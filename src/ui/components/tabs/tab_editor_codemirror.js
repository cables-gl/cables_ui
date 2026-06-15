import { Events, Logger, ele, TalkerAPI } from "cables-shared-client";
import { linter, lintGutter } from "@codemirror/lint";
import { EditorView, highlightActiveLineGutter, highlightActiveLine, ViewPlugin, lineNumbers, keymap, drawSelection } from "@codemirror/view";
import { Transaction, EditorSelection, EditorState } from "@codemirror/state";
import { helix, commands } from "codemirror-helix";
import { syntaxTree } from "@codemirror/language";
import { autocompletion } from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";

import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { glsl } from "codemirror-lang-glsl";
import { css } from "@codemirror/lang-css";

import { oneDark } from "@codemirror/theme-one-dark";
import { searchKeymap, highlightSelectionMatches, selectNextOccurrence } from "@codemirror/search";
// import { basicDark } from 'cm6-theme-basic-dark'
// import { tokyoNightStorm } from "@fsegurai/codemirror-theme-tokyo-night-storm"
import { indentWithTab, toggleComment, history } from "@codemirror/commands";
import { snippetCompletion } from "@codemirror/autocomplete"; // Built-in function

import { createOpDocButton } from "../editor.js";
import { userSettings } from "../usersettings.js";
import { contextMenu } from "../../elements/contextmenu.js";
import { platform } from "../../platform.js";
import { gui } from "../../gui.js";
import { notify, notifyError } from "../../elements/notification.js";
import ManageOp from "./tab_manage_op.js";
import { GuiText } from "../../text.js";
import Tab from "../../elements/tabpanel/tab.js";

/**
 * tab panel for editing text and source code using the codemirror editor
 */

export default class EditorTabCodemirror extends Events
{
    #log = new Logger("editorTabCm");
    #tab = null;
    helix = false;

    /**
     * @param {import("../editor.js").EditorOptions} options
     * @param {boolean} [helix]
     */
    constructor(options, helix)
    {
        super();
        this.helix = helix;
        if (typeof options.allowEdit === "undefined" || options.allowEdit === null) options.allowEdit = true;

        this._options = options;

        gui.maintabPanel.show();

        let title = gui.maintabPanel.tabs.getUniqueTitle(options.title);

        this.#tab = new Tab(title,
            {
                "icon": null,
                "type": options.syntax,
                "name": options.name,
                "dataId": options.dataId || options.name,
                "infotext": GuiText.editorTab,
                "singleton": options.singleton,
            });

        this.#tab.editor = this;
        this.ele = null;

        this.#tab.on("onActivate", () =>
        {
            this.focus();
        });

        this.#tab.on("resize", () =>
        {
        });

        const existing = gui.mainTabs.getTabByTitle(title);
        if (existing)
        {
            gui.mainTabs.activateTab(existing.id);
        }
        else
        {
            this.#tab.editorObj = options.editorObj;
            gui.mainTabs.addTab(this.#tab);
        }

        let style = "";

        // if (!options.allowEdit) style = "background-color:#333;";
        const html = "<div class=\"\" id=\"editorcontent" + this.#tab.id + "\" style=\"width:100%;height:100%;overflow:auto;" + style + "\"></div>";
        this.#tab.html(html);
        this._eleId = "editorcontent" + this.#tab.id;
        this.ele = ele.byId(this._eleId);

        if (options.hasOwnProperty("content")) this.setContent(options.content);
    }

    /**
     * @param {string} content
     */
    setContent(content)
    {
        content = content || "";

        if (this.cmView)
        {
            const cursorPos = this.cmView.state.selection.main.head;
            this.cmView.dispatch(
                {
                    "changes": { "from": 0, "to": this.cmView.state.doc.length, "insert": content },
                    "annotations": Transaction.addToHistory.of(false),
                });
            this.cmView.focus();
            this.cmView.dispatch({
                "selection": EditorSelection.cursor(cursorPos)
            });
        }
        else
        {
            this.createEditor(() =>
            {
                this.#tab.addEventListener(Tab.EVENT_CLOSE, this._options.onClose);
                this.#tab.addEventListener(
                    Tab.EVENT_ACTIVATE,
                    () =>
                    {
                        this.focus();
                    }
                );
                this.cmView.dispatch(
                    {
                        "changes": { "from": 0, "to": this.cmView.state.doc.length, "insert": content },
                        "annotations": Transaction.addToHistory.of(false),
                    });
                this.cmView.focus();
                if (this._options.onFinished) this._options.onFinished();
            });
        }
    }

    focus()
    {

        this.cmView?.focus();
    }

    getContent()
    {
        const str = this.cmView.state.doc.toString();
        return str;
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
                gui.mainTabs.setChanged(this.#tab.id, false);
            }

            this.focus();
        };

        gui.jobs().start({ "id": "saveeditorcontent", "title": "saving editor content" });
        if (this._options.onSave) this._options.onSave(onSaveCb, this.getContent(), this);
        else this.emitEvent("save", onSaveCb, this.getContent(), this);
    }

    /**
     * @param {function} cb
     */
    createEditor(cb)
    {
        const options = {};

        const extensions = [];
        if (this.helix)
            extensions.push(helix(
                {
                    "config": { "editor.cursor-shape.insert": "bar", "editor.default-yank-register": "+" },
                }
            ));
        const syntaxErrorLinter = linter((view) =>
        {
            const diagnostics = [];
            syntaxTree(view.state).iterate({
                enter(node)
                {
                    if (node.type.isError)
                    {
                        diagnostics.push({
                            "from": node.from,
                            "to": node.to,
                            "severity": "error",
                            "message": "Syntax error",
                        });
                    }
                },
            });
            return diagnostics;
        });

        // extensions.push(customCommands);
        extensions.push(highlightActiveLine());
        extensions.push(highlightActiveLineGutter());
        extensions.push(oneDark);
        extensions.push(lineNumbers());
        extensions.push(autocompletion());
        extensions.push(keymap.of([indentWithTab]));

        extensions.push(lintGutter());
        extensions.push(keymap.of([...searchKeymap]));
        extensions.push(highlightSelectionMatches());

        if (!this.helix)
        {

            extensions.push(
                history(),
                drawSelection(),
                EditorState.allowMultipleSelections.of(true));
            extensions.push(keymap.of([
                {
                    "key": "Mod-/",
                    "run": toggleComment,
                }, {
                    "key": "Mod-d",
                    "run": selectNextOccurrence,
                    "preventDefault": true,
                }]));
        }

        if (this._options.syntax == "glsl") extensions.push(glsl());
        if (this._options.syntax == "css") extensions.push(css());
        if (this._options.syntax == "md") extensions.push(css());
        if (this._options.syntax == "js")
        {
            extensions.push(syntaxErrorLinter);
            extensions.push(javascript());
            extensions.push(
                javascriptLanguage.data.of({
                    "autocomplete": this.getSnippets()
                }),
                autocompletion()
            );
        }

        if (!this._options.allowEdit)
        {
            extensions.push(EditorState.readOnly.of(true));
            extensions.push(EditorView.editable.of(false));
            extensions.push(EditorView.theme({
                "&": {
                    "opacity": "0.75 !important"
                } }));
        }

        this.cmView = new EditorView(
            {
                "parent": this.ele,
                "extensions": extensions,
                "doc": options.content || "",
            });

        // this.cmView.state.readOnly.of(true);

        createOpDocButton(this.#tab, this);
        cb();

    }

    setInactive()
    {
        console.log("codemirror setinactive not implemented.");
    }

    getSnippets()
    {
        return [

            snippetCompletion("op.setUiError = function (\"${1:id}\",\"${1:message}\")",
                {
                    "label": "op.inTriggerButton"
                }),

            snippetCompletion("op.inTriggerButton(\"${1:name}\")",
                {
                    "label": "op.inTriggerButton"
                }),

            snippetCompletion("op.inTrigger(\"${1:name}\")",
                {
                    "label": "op.inTrigger"
                }),

            snippetCompletion("op.inMultiPort(\"#1\", CABLES.OP_PORT_TYPE_NUMBER)",
                {
                    "label": "op.inMultiPort"
                }),

            snippetCompletion("op.outTrigger(\"${1:name}\")",
                {
                    "label": "op.outTrigger"
                }),

            snippetCompletion("op.inBool(\"${1:name}\",${2:false})",
                {
                    "label": "op.inBool"
                }),

            snippetCompletion("op.inInt(\"${1:name}\",${2:0})",
                {
                    "label": "op.inInt"
                }),

            snippetCompletion("op.inFloatSlider(\"${1:name}\",${2:0})",
                {
                    "label": "op.inFloatSlider"
                }),

            snippetCompletion("op.inFloat(\"${1:name}\",${2:0})",
                {
                    "label": "op.inFloat"
                }),

            snippetCompletion("op.inDropDown(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\)",
                {
                    "label": "op.inDropDown"
                }),

            snippetCompletion("op.inSwitch(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\,\${3:\"default\"}\)",
                {
                    "label": "op.inSwitch"
                }),

            snippetCompletion("op.inStringEditor(\"${1:name}\",\"${2:default}\",\"${3:syntax}\")",
                {
                    "label": "op.inStringEditor"
                }),

            snippetCompletion("op.inString(\"${1:name}\",\"${2:default}\")",
                {
                    "label": "op.inString"
                }),

            snippetCompletion("op.inObject(\"${1:name}\")",
                {
                    "label": "op.inObject"
                }),

            snippetCompletion("op.inTexture(\"${1:name}\")",
                {
                    "label": "op.inTexture"
                }),

            snippetCompletion("op.inArray(\"${1:name}\")",
                {
                    "label": "op.inArray"
                }),

            snippetCompletion("op.inUrl(\"${1:name}\")",
                {
                    "label": "op.inUrl"
                }),

            snippetCompletion("op.outNumber(\"${1:name}\")",
                {
                    "label": "op.outNumber"
                }),

            snippetCompletion("op.outBoolNum(\"${1:name}\")",
                {
                    "label": "op.outBoolNum"
                }),

            snippetCompletion("op.outString(\"${1:name}\")",
                {
                    "label": "op.outString"
                }),

            snippetCompletion("op.outObject(\"${1:name}\")",
                {
                    "label": "op.outObject"
                }),

            snippetCompletion("op.outArray(\"${1:name}\")",
                {
                    "label": "op.outArray"
                }),

            snippetCompletion("op.outTexture(\"${1:name}\")",
                {
                    "label": "op.outTexture"
                }),

            snippetCompletion("CABLES.map(${1:name})",
                {
                    "label": "CABLES.map"
                }),

            snippetCompletion("console.log(\"${1:text}\");",
                {
                    "label": "console.log"
                }),
            snippetCompletion("op.logError(\"${1:text}\");",
                {
                    "label": "op.logError"
                }),

            snippetCompletion("op.setPortGroup(\"${1:name}\",[${2:port},${3:port}]);",
                {
                    "label": "op.setPortGroup"
                }),

            snippetCompletion("CABLES.map(${1:value},${2:oldMin},${3:oldMax},${4:newMin},${5:newMax});",
                {
                    "label": "CABLES.map"
                }),

            snippetCompletion("op.toWorkPortsNeedToBeLinked(${1:port1},${2:port2});",
                {
                    "label": "op.toWorkPortsNeedToBeLinked"
                }),

            snippetCompletion("op.toWorkPortsNeedsString(${1:port1},${2:port2});",
                {
                    "label": "op.toWorkPortsNeedsString"
                }),

            snippetCompletion("vec3.create();",
                {
                    "label": "vec3.create"
                }),

            snippetCompletion("vec3.set(${1:out},${2:x},${3:y},${4:z});",
                {
                    "label": "vec3.set(out, x, y, z)"
                }),

            snippetCompletion("mat4.create();",
                {
                    "label": "mat4.create"
                }),

            snippetCompletion("mat4.identity();",
                {
                    "label": "mat4.identity"
                }),

            snippetCompletion("mat4.translate(${1:out},${2:a},${3:v});",
                {
                    "label": "mat4.translate(out,a,v);"
                }),

            snippetCompletion("CGL.Texture.PFORMATSTR_RGBA32F",
                {
                    "label": "CGL.Texture.PFORMATSTR_RGBA32F"
                }),

            snippetCompletion("CGL.Texture.PFORMATSTR_RGBA8UB",
                {
                    "label": "CGL.Texture.PFORMATSTR_RGBA8UB"
                }),

            snippetCompletion("CGL.Texture.PIXELFORMATS",
                {
                    "label": "CGL.Texture.PIXELFORMATS"
                }),

            snippetCompletion("op.setUiError(\"id\", \"text or null\");",
                {
                    "label": "op.setUiError"
                }),

            snippetCompletion("op.patch.isEditorMode()",
                {
                    "label": "op.patch.isEditorMode"
                }),

            snippetCompletion("op.isCurrentUiOp()",
                {
                    "label": "op.isCurrentUiOp"
                }),

        ];
    }
}
