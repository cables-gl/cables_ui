import { Events, Logger, ele, TalkerAPI } from "cables-shared-client";
import { EditorView, highlightActiveLineGutter, highlightActiveLine, ViewPlugin, lineNumbers } from "@codemirror/view";
import { Transaction, Extension, EditorState } from "@codemirror/state";
import { helix, commands } from "codemirror-helix";
import { autocompletion } from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
// import { basicDark } from 'cm6-theme-basic-dark'
// import { tokyoNightStorm } from "@fsegurai/codemirror-theme-tokyo-night-storm"
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
        return this.cmView.state.doc.toString();
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
        else this.emitEvent("save", onSaveCb, this.setContent, this);
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

        // extensions.push(customCommands);
        extensions.push(highlightActiveLine());
        extensions.push(highlightActiveLineGutter());
        extensions.push(oneDark);
        extensions.push(lineNumbers());
        extensions.push(javascript());
        extensions.push(autocompletion());
        // extensions.push(snippet(snippets));

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
}
