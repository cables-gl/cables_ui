import { Logger, ele, TalkerAPI } from "cables-shared-client";
// import { basicDark } from 'cm6-theme-basic-dark'
// import { tokyoNightStorm } from "@fsegurai/codemirror-theme-tokyo-night-storm"

import { createOpDocButton } from "../editor.js";
import { platform } from "../../platform.js";
import { gui } from "../../gui.js";
import { UserSettings, userSettings } from "../usersettings.js";
import { notify, notifyError } from "../../elements/notification.js";
import { GuiText } from "../../text.js";
import { escapeHTML } from "../../utils/helper.js";
import Tab from "../../elements/tabpanel/tab.js";
import EditorBase from "./tab_editor.js";

const CURSOR_LINES_STORAGE_KEY = "cables_editor_lines";
const CURSOR_LINES_MAX_ENTRIES = 200;

const DEFAULT_HELIX_CONFIG = "[editor]\ndefault-yank-register = \"+\"\n\n[editor.cursor-shape]\ninsert = \"bar\"\n";

/** @type {import("./cm_libs.js")} - codemirror, loaded when the first editor opens */
let cm = null;

/** @type {import("helix-cm6")} - loaded on first use of a helix editor */
let helixModule = null;

function loadCursorLines()
{
    try
    {
        return JSON.parse(window.localStorage.getItem(CURSOR_LINES_STORAGE_KEY)) || {};
    }
    catch (e)
    {
        return {};
    }
}

/**
 * @param {string} key
 * @param {number} line
 */
function storeCursorLine(key, line)
{
    const lines = loadCursorLines();
    delete lines[key];
    lines[key] = line;

    const keys = Object.keys(lines);
    for (let i = 0; i < keys.length - CURSOR_LINES_MAX_ENTRIES; i++) delete lines[keys[i]];

    try
    {
        window.localStorage.setItem(CURSOR_LINES_STORAGE_KEY, JSON.stringify(lines));
    }
    catch (e) {}
}

/**
 * tab panel for editing text and source code using the codemirror editor
 */
export default class EditorTabCodemirror extends EditorBase
{
    #log = new Logger("editorTabCm");
    helix = false;
    #highlightCompartment = null;
    #languageCompartment = null;
    #prefsCompartment = null;
    #prefsListener = null;

    /** @type {import("../../api/opsserver.js").LinterDiag[]} */
    #externalDiags = [];

    /** @type {import("../../api/opsserver.js").LinterDiag[]} */
    #editorDiags = [];
    #lastStoredLine = 0;

    /** @type {string} content for the editor while it is being created (codemirror loads async), null otherwise */
    #pendingContent = null;
    #helixStatusEle = document.createElement("div");

    /**
     * @param {import("../editor.js").EditorOptions} options
     * @param {boolean} [helix]
     */
    constructor(options, helix)
    {
        super(options);
        this.helix = helix;
        if (typeof options.allowEdit === "undefined" || options.allowEdit === null) options.allowEdit = true;

        gui.maintabPanel.show();

        let title = gui.maintabPanel.tabs.getUniqueTitle(options.title);

        this.tab = new Tab(title,
            {
                "icon": null,
                "type": options.syntax,
                "name": options.name,
                "dataId": options.dataId || options.name,
                "infotext": GuiText.editorTab,
                "singleton": options.singleton
            });

        this.tab.editor = this;
        this.ele = null;

        this.tab.on(Tab.EVENT_CLOSE, () =>
        {
            if (this.#prefsListener) userSettings.off(this.#prefsListener);
            this.#prefsListener = null;
            this.cmView?.destroy();
            this.cmView = null;
        });

        this.tab.on("onActivate", () =>
        {
            this.focus();
        });

        this.tab.on("resize", () =>
        {
        });

        const existing = gui.mainTabs.getTabByTitle(title);
        if (existing)
        {
            gui.mainTabs.activateTab(existing.id);
        }
        else
        {
            this.tab.editorObj = options.editorObj;
            gui.mainTabs.addTab(this.tab);
        }

        let style = "";

        // if (!options.allowEdit) style = "background-color:#333;";
        const html =
            "<div class=\"\" id=\"editorcontent" + this.tab.id + "\" style=\"width:100%;height:calc(100% - var(--editorDiagHeight));overflow:auto;" + style + "\"></div>" + this.getDiagHtmlOuter();
        this.tab.html(html);
        this._eleId = "editorcontent" + this.tab.id;
        this.ele = ele.byId(this._eleId);

        if (options.hasOwnProperty("content")) this.setContent(options.content);

        this.setDiags();
    }

    /**
     * @param {string} content
     */
    setContent(content)
    {
        content = content || "";

        if (this.cmView)
        {
            const cursorPos = Math.min(this.cmView.state.selection.main.head, content.length);
            this.cmView.dispatch(
                {
                    "changes": { "from": 0, "to": this.cmView.state.doc.length, "insert": content },
                    "selection": cm.EditorSelection.cursor(cursorPos),
                    "annotations": cm.Transaction.addToHistory.of(false)
                });
            this.cmView.focus();
        }
        else
        {
            const creating = this.#pendingContent !== null;
            this.#pendingContent = content;
            if (creating) return;

            this.createEditor(() =>
            {
                if (this._options.onClose)
                    this.tab.addEventListener(Tab.EVENT_CLOSE, this._options.onClose);
                this.tab.addEventListener(
                    Tab.EVENT_ACTIVATE,
                    () =>
                    {
                        this.focus();
                    }
                );
                this.cmView.focus();

                const lastLine = loadCursorLines()[this.#cursorLineKey()];
                if (lastLine) this.gotoLine(lastLine);

                if (this._options.onFinished) this._options.onFinished();
            });
        }
    }

    focus()
    {

        this.cmView?.focus();
    }

    #cursorLineKey()
    {
        return this._options.dataId || this._options.name;
    }

    /**
     * @param {import("@codemirror/view").ViewUpdate} update
     */
    #onEditorUpdate(update)
    {
        if (this.#hasLintUpdate(update)) queueMicrotask(() => { this.#updateEditorDiags(update.state); });
        if (!update.selectionSet || !this.#cursorLineKey()) return;

        const line = update.state.doc.lineAt(update.state.selection.main.head).number;
        if (line == this.#lastStoredLine) return;

        this.#lastStoredLine = line;
        storeCursorLine(this.#cursorLineKey(), line);
    }

    /**
     * @param {import("@codemirror/view").ViewUpdate} update
     */
    #hasLintUpdate(update)
    {
        for (let i = 0; i < update.transactions.length; i++)
        {
            const effects = update.transactions[i].effects;
            for (let j = 0; j < effects.length; j++)
                if (effects[j].is(cm.setDiagnosticsEffect)) return true;
        }
        return false;
    }

    /**
     * @param {import("@codemirror/state").EditorState} state
     */
    #updateEditorDiags(state)
    {
        if (!this.cmView || this.cmView.state !== state) return;

        const severities = { "error": 2, "warning": 1 };
        const diags = [];
        cm.forEachDiagnostic(state, (d, from) =>
        {
            const line = state.doc.lineAt(from);
            diags.push({
                "line": line.number,
                "column": from - line.from + 1,
                "severity": severities[d.severity] || 0,
                "message": d.message
            });
        });
        this.#editorDiags = diags;
        super.setDiags(this.#getAllDiags(), false);
    }

    #getAllDiags()
    {
        const diags = this.#externalDiags.concat(this.#editorDiags);
        diags.sort((a, b) => { return a.line - b.line; });
        return diags;
    }

    /**
     * @param {import("../../api/opsserver.js").LinterDiag[]} arr
     * @param {boolean} [jumpToError]
     */
    setDiags(arr = [], jumpToError = true)
    {
        this.#externalDiags = arr;
        super.setDiags(this.#getAllDiags(), jumpToError);
    }

    getContent()
    {
        const str = this.cmView.state.doc.toString();
        return str;
    }

    /**
     * @param {number} line
     */
    gotoLine(line)
    {

        if (!this.cmView || !Number.isInteger(line) || line < 1 || line > this.cmView.state.doc.lines) return;

        try
        {

            const lineInfo = this.cmView.state.doc.line(line); // 1-based line number
            this.cmView.dispatch({
                "selection": { "anchor": lineInfo.from },
                "effects": cm.EditorView.scrollIntoView(lineInfo.from, { "y": "center" })
            });
        }
        catch (e)
        {
            console.log("e", e);

        }
    }

    format()
    {
        platform.talkerAPI.send(
            TalkerAPI.CMD_FORMAT_OP_CODE,
            {
                "code": this.getContent()

            },
            (err, res) =>
            {
                if (!res || !res.success)
                {
                    notifyError("failed to format code, keeping old version");
                    this.#log.warn("code formating error", err);
                }
                else
                {
                    this.setContent(res.opFullCode);
                }

                if (err)
                {
                    notifyError("failed to format code, keeping old version");
                    this.#log.warn("code formating http error", res);
                }
            }
        );
    }

    save()
    {
        const onSaveCb = (txt) =>
        {
            gui.jobs().finish("saveeditorcontent");

            if (txt.toLowerCase().indexOf("error") == 0) notifyError(txt);
            else
            {
                notify(txt);
                gui.mainTabs.setChanged(this.tab.id, false);
            }

            this.focus();
        };

        gui.jobs().start({ "id": "saveeditorcontent", "title": "saving editor content" });
        if (this._options.onSave) this._options.onSave(onSaveCb, this.getContent(), this);
        else this.emitEvent("save", onSaveCb, this.getContent(), this);
    }

    /**
     * apply a helix config.toml to all open helix editors
     * @param {string} config
     * @returns {string[]} warnings
     */
    static reconfigureHelix(config)
    {
        if (!helixModule) return [];
        let warnings = [];
        for (let i = 0; i < gui.mainTabs.tabs.length; i++)
        {
            const editor = gui.mainTabs.tabs[i].editor;
            if (editor && editor.helix && editor.cmView)
                warnings = warnings.concat(helixModule.helixConfigure(editor.cmView, { "config": config || DEFAULT_HELIX_CONFIG }));
        }
        return warnings;
    }

    /**
     * statusline like helix's default: mode, name, modified | pending keys, selections, register, position
     * @param {import("helix-cm6").HelixStatus} status
     */
    #updateHelixStatus(status)
    {
        const modes = { "normal": "NOR", "insert": "INS", "select": "SEL" };
        const left = [
            "<span class=\"hx-statusline-mode hx-statusline-mode-" + status.mode + "\">" + modes[status.mode] + "</span>",
            "<span>" + escapeHTML(this._options.title || this._options.name || "") + (status.modified ? " [+]" : "") + "</span>"
        ];
        if (status.recording) left.push("<span>[" + escapeHTML(status.recording) + "]</span>");

        const right = [];
        if (status.pending || status.count) right.push("<span>" + (status.count || "") + escapeHTML(status.pending) + "</span>");
        right.push("<span>" + (status.selections > 1 ? (status.primaryIndex + 1) + "/" + status.selections + " sels" : "1 sel") + "</span>");
        if (status.register) right.push("<span>reg=" + escapeHTML(status.register) + "</span>");
        right.push("<span>" + status.line + ":" + status.column + "</span>");

        this.#helixStatusEle.className = "hx-statusline";
        this.#helixStatusEle.innerHTML = left.join("") + "<span class=\"hx-statusline-spacer\"></span>" + right.join("");
    }

    static getHelixConfig()
    {
        return userSettings.get(UserSettings.PREF_HELIX_CONFIG) || DEFAULT_HELIX_CONFIG;
    }

    /**
     * creates the view with #pendingContent as initial document, so it is not part of the undo history
     * @param {function} cb
     */
    createEditor(cb)
    {
        if (!cm)
        {
            import("./cm_libs.js").then((m) =>
            {
                cm = m;
                this.createEditor(cb);
            });
            return;
        }

        if (this.helix && !helixModule)
        {
            import("helix-cm6").then((m) =>
            {
                helixModule = m;
                this.createEditor(cb);
            });
            return;
        }

        this.#highlightCompartment = new cm.Compartment();
        this.#languageCompartment = new cm.Compartment();
        this.#prefsCompartment = new cm.Compartment();

        const extensions = [];
        if (this.helix)
            extensions.push(helixModule.helix(
                {
                    "config": EditorTabCodemirror.getHelixConfig(),
                    "syntax": false,
                    "onStatus": (status) => { this.#updateHelixStatus(status); },
                    "commands": {
                        "write": ({ view }) =>
                        {
                            this.save();
                            helixModule.helixMarkSaved(view);
                        }
                    }
                }
            ),
            // helix colors default to system colors, use the oneDark ones, yellow cursor
            cm.EditorView.theme({
                "&": {
                    "--hx-fg": "#abb2bf",
                    "--hx-bg": "#282c34",
                    "--hx-selection": "#3e4451",
                    "--hx-cursor-primary-bg": "#ffd000",
                    "--hx-cursor-bg": "#ffd00080"
                },
                ".cm-cursor": { "borderLeftColor": "#ffd000" },
                "& ::highlight(hx-sel)": { "color": "#ffffff" },
                ".hx-statusline": { "display": "flex", "gap": "1em", "padding": "0 1em 0 0", "fontFamily": "monospace", "lineHeight": "1.6", "backgroundColor": "#21252b", "color": "#abb2bf" },
                ".hx-statusline-mode": { "padding": "0 0.8em", "fontWeight": "bold", "color": "#21252b" },
                ".hx-statusline-mode-normal": { "backgroundColor": "#61afef" },
                ".hx-statusline-mode-insert": { "backgroundColor": "#98c379" },
                ".hx-statusline-mode-select": { "backgroundColor": "#c678dd" },
                ".hx-statusline-spacer": { "flex": "1" }
            }),
            cm.showPanel.of(() => { return { "dom": this.#helixStatusEle, "top": false }; }));

        extensions.push(this.#highlightCompartment.of([]));

        // extensions.push(customCommands);
        extensions.push(cm.highlightActiveLine());
        extensions.push(cm.highlightActiveLineGutter());
        // before oneDark: earlier themes win over later ones with the same specificity
        // the ui's global ::selection sets black text, which editor text would inherit
        extensions.push(cm.EditorView.theme({
            ".cm-line::selection, .cm-line ::selection": { "color": "#ffffff" },
            ".cm-activeLine, .cm-activeLineGutter": { "backgroundColor": "#222222" },
            "&": { "--hx-cursorline": "#222222" }
        }));
        extensions.push(cm.oneDark);
        extensions.push(cm.lineNumbers());
        extensions.push(cm.bracketMatching());
        if (!this.helix)
        {
            extensions.push(cm.closeBrackets());
            extensions.push(cm.keymap.of(cm.closeBracketsKeymap));
        }
        extensions.push(cm.indentOnInput());
        extensions.push(cm.autocompletion());
        extensions.push(cm.keymap.of([cm.indentWithTab, { "key": "Enter", "run": cm.insertNewlineAndIndent }]));

        extensions.push(cm.lintGutter());
        extensions.push(cm.keymap.of([...cm.searchKeymap]));
        extensions.push(cm.highlightSelectionMatches());
        extensions.push(cm.EditorView.updateListener.of((update) => { this.#onEditorUpdate(update); }));

        if (!this.helix)
        {

            extensions.push(
                cm.history(),
                cm.drawSelection(),
                cm.EditorState.allowMultipleSelections.of(true));
            // undo/redo, move/copy/delete line, select all, smart home/end, ...
            extensions.push(cm.keymap.of([...cm.defaultKeymap, ...cm.historyKeymap]));
            extensions.push(cm.keymap.of([
                {
                    "key": "Mod-/",
                    "run": cm.toggleComment
                }, {
                    "key": "Mod-d",
                    "run": cm.selectNextOccurrence,
                    "preventDefault": true
                }]));
        }

        extensions.push(this.#prefsCompartment.of(this.#getPrefsExtensions()));
        extensions.push(this.#languageCompartment.of(this.#getLanguageExtensions(this._options.syntax)));

        if (!this._options.allowEdit)
        {
            extensions.push(cm.EditorState.readOnly.of(true));
            extensions.push(cm.EditorView.theme({
                "&": { "opacity": "0.8 !important" },
                ".cm-dropCursor": { "display": "none" },
                "&.cm-focused": { "outline": "none" }
            }));
        }

        this.cmView = new cm.EditorView(
            {
                "parent": this.ele,
                "extensions": extensions,
                "doc": this.#pendingContent
            });
        this.#pendingContent = null;

        // diags set while codemirror was loading could not highlight their lines yet
        if (this.#externalDiags.length) super.setDiags(this.#getAllDiags(), false);

        this.#prefsListener = userSettings.on(UserSettings.EVENT_CHANGE, (key) =>
        {
            if (key != UserSettings.PREF_FONTSIZE_ACE && key != UserSettings.PREF_WRAPMODE_ACE && key != UserSettings.PREF_TABWIDTH) return;
            this.cmView?.dispatch({ "effects": this.#prefsCompartment.reconfigure(this.#getPrefsExtensions()) });
        });

        // this.cmView.state.readOnly.of(true);

        createOpDocButton(this.tab, this);
        cb();

    }

    /**
     * @param {string} syntax
     */
    /**
     * font size, wrap mode and tab width from the user preferences
     */
    #getPrefsExtensions()
    {
        const fontSize = parseFloat(userSettings.get(UserSettings.PREF_FONTSIZE_ACE)) || 12;
        const tabWidth = Math.max(1, Math.min(16, parseInt(userSettings.get(UserSettings.PREF_TABWIDTH)) || 4));
        const wrap = userSettings.get(UserSettings.PREF_WRAPMODE_ACE) === true || userSettings.get(UserSettings.PREF_WRAPMODE_ACE) === "true";

        const exts = [
            cm.EditorView.theme({
                "&": { "fontSize": fontSize + "px" },
                ".cm-content": { "tabSize": tabWidth },
                ".cm-scroller": { "fontSize": fontSize + "px" }
            }),
            cm.EditorState.tabSize.of(tabWidth),
            cm.indentUnit.of(" ".repeat(tabWidth))
        ];
        if (wrap) exts.push(cm.EditorView.lineWrapping);
        return exts;
    }

    #getLanguageExtensions(syntax)
    {
        if (syntax == "glsl") return [cm.glsl()];
        if (syntax == "css" || syntax == "inline-css") return [cm.css()];
        if (syntax == "md" || syntax == "markdown") return [cm.markdown()];
        if (syntax == "html") return [cm.html()];
        if (syntax == "xml") return [cm.xml()];
        if (syntax == "sql") return [cm.sql()];
        if (syntax == "python") return [cm.python()];
        if (syntax == "json") return [cm.json(), cm.linter(cm.jsonParseLinter())];
        if (syntax == "js")
        {
            const syntaxErrorLinter = cm.linter((view) =>
            {
                const diagnostics = [];
                cm.syntaxTree(view.state).iterate({
                    "enter": function (node)
                    {
                        if (node.type.isError)
                        {
                            diagnostics.push({
                                "from": node.from,
                                "to": node.to,
                                "severity": "error",
                                "message": "Syntax error"
                            });
                        }
                    }
                });
                return diagnostics;
            });

            return [
                syntaxErrorLinter,
                cm.javascript(),
                cm.javascriptLanguage.data.of({
                    "autocomplete": this.getSnippets()
                })
            ];
        }
        return [];
    }

    /**
     * @param {string} syntax
     */
    setSyntax(syntax)
    {
        if (this._options.syntax == syntax) return;
        super.setSyntax(syntax);
        if (!this.cmView) return;
        this.cmView.dispatch({ "effects": this.#languageCompartment.reconfigure(this.#getLanguageExtensions(syntax)) });
    }

    setInactive()
    {
        console.log("codemirror setinactive not implemented.");
    }

    getSnippets()
    {
        return [

            cm.snippetCompletion("op.setUiError = function (\"${1:id}\",\"${1:message}\")",
                {
                    "label": "op.inTriggerButton"
                }),

            cm.snippetCompletion("op.inTriggerButton(\"${1:name}\")",
                {
                    "label": "op.inTriggerButton"
                }),

            cm.snippetCompletion("op.inTrigger(\"${1:name}\")",
                {
                    "label": "op.inTrigger"
                }),

            cm.snippetCompletion("op.inMultiPort(\"#1\", CABLES.OP_PORT_TYPE_NUMBER)",
                {
                    "label": "op.inMultiPort"
                }),

            cm.snippetCompletion("op.outTrigger(\"${1:name}\")",
                {
                    "label": "op.outTrigger"
                }),

            cm.snippetCompletion("op.inBool(\"${1:name}\",${2:false})",
                {
                    "label": "op.inBool"
                }),

            cm.snippetCompletion("op.inInt(\"${1:name}\",${2:0})",
                {
                    "label": "op.inInt"
                }),

            cm.snippetCompletion("op.inFloatSlider(\"${1:name}\",${2:0})",
                {
                    "label": "op.inFloatSlider"
                }),

            cm.snippetCompletion("op.inFloat(\"${1:name}\",${2:0})",
                {
                    "label": "op.inFloat"
                }),

            cm.snippetCompletion("op.inDropDown(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\)",
                {
                    "label": "op.inDropDown"
                }),

            cm.snippetCompletion("op.inSwitch(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\,\${3:\"default\"}\)",
                {
                    "label": "op.inSwitch"
                }),

            cm.snippetCompletion("op.inStringEditor(\"${1:name}\",\"${2:default}\",\"${3:syntax}\")",
                {
                    "label": "op.inStringEditor"
                }),

            cm.snippetCompletion("op.inString(\"${1:name}\",\"${2:default}\")",
                {
                    "label": "op.inString"
                }),

            cm.snippetCompletion("op.inObject(\"${1:name}\")",
                {
                    "label": "op.inObject"
                }),

            cm.snippetCompletion("op.inTexture(\"${1:name}\")",
                {
                    "label": "op.inTexture"
                }),

            cm.snippetCompletion("op.inArray(\"${1:name}\")",
                {
                    "label": "op.inArray"
                }),

            cm.snippetCompletion("op.inUrl(\"${1:name}\")",
                {
                    "label": "op.inUrl"
                }),

            cm.snippetCompletion("op.outNumber(\"${1:name}\")",
                {
                    "label": "op.outNumber"
                }),

            cm.snippetCompletion("op.outBoolNum(\"${1:name}\")",
                {
                    "label": "op.outBoolNum"
                }),

            cm.snippetCompletion("op.outString(\"${1:name}\")",
                {
                    "label": "op.outString"
                }),

            cm.snippetCompletion("op.outObject(\"${1:name}\")",
                {
                    "label": "op.outObject"
                }),

            cm.snippetCompletion("op.outArray(\"${1:name}\")",
                {
                    "label": "op.outArray"
                }),

            cm.snippetCompletion("op.outTexture(\"${1:name}\")",
                {
                    "label": "op.outTexture"
                }),

            cm.snippetCompletion("CABLES.map(${1:name})",
                {
                    "label": "CABLES.map"
                }),

            cm.snippetCompletion("console.log(\"${1:text}\");",
                {
                    "label": "console.log"
                }),
            cm.snippetCompletion("op.logError(\"${1:text}\");",
                {
                    "label": "op.logError"
                }),

            cm.snippetCompletion("op.setPortGroup(\"${1:name}\",[${2:port},${3:port}]);",
                {
                    "label": "op.setPortGroup"
                }),

            cm.snippetCompletion("CABLES.map(${1:value},${2:oldMin},${3:oldMax},${4:newMin},${5:newMax});",
                {
                    "label": "CABLES.map"
                }),

            cm.snippetCompletion("op.toWorkPortsNeedToBeLinked(${1:port1},${2:port2});",
                {
                    "label": "op.toWorkPortsNeedToBeLinked"
                }),

            cm.snippetCompletion("op.toWorkPortsNeedsString(${1:port1},${2:port2});",
                {
                    "label": "op.toWorkPortsNeedsString"
                }),

            cm.snippetCompletion("vec3.create();",
                {
                    "label": "vec3.create"
                }),

            cm.snippetCompletion("vec3.set(${1:out},${2:x},${3:y},${4:z});",
                {
                    "label": "vec3.set(out, x, y, z)"
                }),

            cm.snippetCompletion("mat4.create();",
                {
                    "label": "mat4.create"
                }),

            cm.snippetCompletion("mat4.identity();",
                {
                    "label": "mat4.identity"
                }),

            cm.snippetCompletion("mat4.translate(${1:out},${2:a},${3:v});",
                {
                    "label": "mat4.translate(out,a,v);"
                }),

            cm.snippetCompletion("CGL.Texture.PFORMATSTR_RGBA32F",
                {
                    "label": "CGL.Texture.PFORMATSTR_RGBA32F"
                }),

            cm.snippetCompletion("CGL.Texture.PFORMATSTR_RGBA8UB",
                {
                    "label": "CGL.Texture.PFORMATSTR_RGBA8UB"
                }),

            cm.snippetCompletion("CGL.Texture.PIXELFORMATS",
                {
                    "label": "CGL.Texture.PIXELFORMATS"
                }),

            cm.snippetCompletion("op.setUiError(\"id\", \"text or null\");",
                {
                    "label": "op.setUiError"
                }),

            cm.snippetCompletion("op.patch.isEditorMode()",
                {
                    "label": "op.patch.isEditorMode"
                }),

            cm.snippetCompletion("op.isCurrentUiOp()",
                {
                    "label": "op.isCurrentUiOp"
                })

        ];
    }

    /**
     * @param {any[]} lineNumbers
     * @param {string} r
     * @param {string} g
     * @param {string} b
     */
    highlightLines(lineNumbers, r, g, b)
    {
        if (!this.cmView) return; // still loading, createEditor applies the diags afterwards

        const deco = lineNumbers
            .filter((n) => { return n >= 1 && n <= this.cmView.state.doc.lines; })
            .sort((a, b) => { return a - b; })
            .map((n) =>
            {

                if (n > this.cmView.state.doc.lines) return;
                return cm.Decoration.line({ "attributes": { "style": "background-color: rgba(" + r + "," + b + "," + g + ",0.3)" } })
                    .range(this.cmView.state.doc.line(n).from);
            }
            );

        this.cmView.dispatch({
            "effects": this.#highlightCompartment.reconfigure(
                cm.EditorView.decorations.of(cm.Decoration.set(deco))
            )
        });
    }
}
