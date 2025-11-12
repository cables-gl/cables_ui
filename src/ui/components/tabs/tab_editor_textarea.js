import { Events, Logger, ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { GuiText } from "../../text.js";
import ManageOp from "./tab_manage_op.js";
import { notify, notifyError } from "../../elements/notification.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { contextMenu } from "../../elements/contextmenu.js";
import { userSettings } from "../usersettings.js";

/**
 * tab panel for editing text and source code using the ace editor
 */

export default class EditorTabTextArea extends Events
{
    constructor(options)
    {
        super();
        this._log = new Logger("EditorTab");
        if (typeof options.allowEdit === "undefined" || options.allowEdit === null) options.allowEdit = true;

        this._options = options;

        gui.maintabPanel.show();

        let title = gui.maintabPanel.tabs.getUniqueTitle(options.title);

        // check if tab exists?

        this._tab = new Tab(title,
            {
                "icon": null,
                "type": options.syntax,
                "name": options.name,
                "dataId": options.dataId || options.name,
                "infotext": GuiText.editorTab,
                "singleton": options.singleton,
            });

        this._tab.editor = this;
        this.ele = null;

        this._tab.on("onActivate", () =>
        {
            if (this.ele) this.ele.focus();
        });

        this._tab.on("resize", () =>
        {
            // if (this._tab) this._tab.updateSize();
            // if (this._editor) this._editor.resize();
        });

        const existing = gui.mainTabs.getTabByTitle(title);
        if (existing)
        {
            gui.mainTabs.activateTab(existing.id);
        }
        else
        {
            this._tab.editorObj = options.editorObj;
            gui.mainTabs.addTab(this._tab);
        }

        let style = "";

        if (!options.allowEdit) style = "background-color:#333;";
        const html = "<textarea class=\"editor_textarea\" id=\"editorcontent" + this._tab.id + "\" style=\"width:100%;height:100%" + style + "\"></textarea>";
        this._tab.html(html);
        this.ele = ele.byId("editorcontent" + this._tab.id);

        if (options.hasOwnProperty("content")) this.setContent(options.content);
    }

    /**
     * @param {string} content
     */
    setContent(content, silent = false)
    {
        content = content || "";
        this.ele.value = content;

        if (this._options.allowEdit)
        {
            if (this._options.onSave || this._options.showSaveButton) this._tab.addButton(GuiText.editorSaveButton, () =>
            {
                this.save();
            });

            let hideFormatButton = !!this._options.hideFormatButton;
            if (!hideFormatButton && this._options.syntax && this._options.syntax === "js") hideFormatButton = false;
            else hideFormatButton = true;
            if (!platform.frontendOptions.showFormatCodeButton)hideFormatButton = true;

            if (this._options.allowEdit && !hideFormatButton) this._tab.addButton(GuiText.editorFormatButton, this.format.bind(this));
        }

        this._tab.addEventListener("close", this._options.onClose);
        this._tab.addEventListener(
            "onActivate",
            () =>
            {
                this.ele.focus();
                // if (this._tab.editorObj && this._tab.editorObj.name) userSettings.set("editortab", this._tab.editorObj.name);
            },
        );

        setTimeout(() =>
        {
            this.ele.focus();
            if (this._options.onFinished) this._options.onFinished();
        }, 100);
    }

    focus()
    {
        this.ele.focus();
    }

    format()
    {
        platform.talkerAPI.send(
            TalkerAPI.CMD_FORMAT_OP_CODE,
            {
                "code": this.ele.value,
            },
            (err, res) =>
            {
                if (!res || !res.success)
                {
                    notifyError("failed to format code, keeping old version");
                    this._log.warn("code formating error", err);
                }
                else
                {
                    this.ele.value = res.opFullCode;
                    this.ele.focus();
                }

                if (err)
                {
                    notifyError("failed to format code, keeping old version");
                    this._log.warn("code formating http error", res);
                }
            }
        );
    }

    save()
    {
        function onSaveCb(txt)
        {
            gui.jobs().finish("saveeditorcontent");

            if (txt.toLowerCase().indexOf("error") == 0) notifyError(txt);
            else
            {
                notify(txt);
                gui.mainTabs.setChanged(this._tab.id, false);
            }

            this.ele.focus();
        }

        gui.jobs().start({ "id": "saveeditorcontent", "title": "saving editor content" });
        if (this._options.onSave)
        {
            this._options.onSave(onSaveCb.bind(this), this.ele.value, this.ele);
        }
        else this.emitEvent("save", onSaveCb.bind(this), this.ele.value, this.ele);
    }

}
