import { Events, Logger, ele, TalkerAPI } from "cables-shared-client";
import { linter, lintGutter } from "@codemirror/lint";
import { EditorView, highlightActiveLineGutter, highlightActiveLine, ViewPlugin, lineNumbers, keymap } from "@codemirror/view";
import { Transaction, EditorState } from "@codemirror/state";
import { helix, commands } from "codemirror-helix";
import { syntaxTree } from "@codemirror/language";
import { autocompletion } from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";

import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
// import { glsl } from "codemirror-lang-glsl";

import { oneDark } from "@codemirror/theme-one-dark";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
// import { basicDark } from 'cm6-theme-basic-dark'
// import { tokyoNightStorm } from "@fsegurai/codemirror-theme-tokyo-night-storm"
import { indentWithTab } from "@codemirror/commands";
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
     * @param {object} options
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

        if (!options.allowEdit) style = "background-color:#333;";
        const html = "<div class=\"\" id=\"editorcontent" + this.#tab.id + "\" style=\"width:100%;height:100%;overflow:auto;" + style + "\"></div>";
        this.#tab.html(html);
        this._eleId = "editorcontent" + this.#tab.id;
        this.ele = ele.byId(this._eleId);

        if (options.hasOwnProperty("content")) this.setContent(options.content);
    }

    /**
     * @param {string} content
     * @param {boolean} silent
     */
    setContent(content, silent = false)
    {
        content = content || "";

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
            // this.setContent(content);
            if (this._options.onFinished) this._options.onFinished();
        });
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
                    "config": { "editor.cursor-shape.insert": "bar" },
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

        // if (this._options.syntax == "glsl")
        // {
        //     extensions.push(glsl);
        // }
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

        this.cmView = new EditorView(
            {
                "parent": this.ele,
                "extensions": extensions,
                "doc": options.content || "",
            });

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

            snippetCompletion("setUiError = function (\"${1:id}\",\"${1:message}\")",
                {
                    "label": "inTriggerButton"
                }),

            snippetCompletion("inTriggerButton(\"${1:name}\")",
                {
                    "label": "inTriggerButton"
                }),

            snippetCompletion("inTrigger(\"${1:name}\")",
                {
                    "label": "inTrigger"
                }),

            snippetCompletion("inMultiPort(\"#1\", CABLES.OP_PORT_TYPE_NUMBER)",
                {
                    "label": "inMultiPort"
                }),

            snippetCompletion("outTrigger(\"${1:name}\")",
                {
                    "label": "outTrigger"
                }),

            snippetCompletion("inBool(\"${1:name}\",${2:false})",
                {
                    "label": "inBool"
                }),

            snippetCompletion("inInt(\"${1:name}\",${2:0})",
                {
                    "label": "inInt"
                }),

            snippetCompletion("inFloatSlider(\"${1:name}\",${2:0})",
                {
                    "label": "inFloatSlider"
                }),

            snippetCompletion("inFloat(\"${1:name}\",${2:0})",
                {
                    "label": "inFloat"
                }),

            snippetCompletion("inDropDown(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\)",
                {
                    "label": "inDropDown"
                }),

            snippetCompletion("inSwitch(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\,\${3:\"default\"}\)",
                {
                    "label": "inSwitch"
                }),

            snippetCompletion("inStringEditor(\"${1:name}\",\"${2:default}\",\"${3:syntax}\")",
                {
                    "label": "inStringEditor"
                }),

            snippetCompletion("inString(\"${1:name}\",\"${2:default}\")",
                {
                    "label": "inString"
                }),

            snippetCompletion("inObject(\"${1:name}\")",
                {
                    "label": "inObject"
                }),

            snippetCompletion("inTexture(\"${1:name}\")",
                {
                    "label": "inTexture"
                }),

            snippetCompletion("inArray(\"${1:name}\")",
                {
                    "label": "inArray"
                }),

            snippetCompletion("inUrl(\"${1:name}\")",
                {
                    "label": "inUrl"
                }),

            snippetCompletion("outNumber(\"${1:name}\")",
                {
                    "label": "outNumber"
                }),

            snippetCompletion("outBoolNum(\"${1:name}\")",
                {
                    "label": "outBoolNum"
                }),

            snippetCompletion("outString(\"${1:name}\")",
                {
                    "label": "outString"
                }),

            snippetCompletion("outObject(\"${1:name}\")",
                {
                    "label": "outObject"
                }),

            snippetCompletion("outArray(\"${1:name}\")",
                {
                    "label": "outArray"
                }),

            snippetCompletion("outTexture(\"${1:name}\")",
                {
                    "label": "outTexture"
                }),

            snippetCompletion("CABLES.map(${1:name})",
                {
                    "label": "CABLES.map"
                }),

            snippetCompletion("console.log(\"${1:text}\");",
                {
                    "label": "console.log"
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
        ];
    }
}
