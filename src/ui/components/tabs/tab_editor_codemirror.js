import { Events, Logger, ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { GuiText } from "../../text.js";
import ManageOp from "./tab_manage_op.js";
import { notify, notifyError } from "../../elements/notification.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { contextMenu } from "../../elements/contextmenu.js";
import { userSettings } from "../usersettings.js";

let loadedCm = false;
let loadingCm = false;

/**
 * tab panel for editing text and source code using the codemirror editor
 */

export default class EditorTabCodemirror extends Events
{
    #log = new Logger("editorTabCm");
    #tab = null;
    helix = false;

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
            if (this.ele) this.ele.focus();
        });

        this.#tab.on("resize", () =>
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
        this.ele.value = content;

        this.createEditor(() =>
        {

            if (this._options.allowEdit)
            {
                if (this._options.onSave || this._options.showSaveButton) this.#tab.addButton(GuiText.editorSaveButton, () =>
                {
                    this.save();
                });

                let hideFormatButton = !!this._options.hideFormatButton;
                if (!hideFormatButton && this._options.syntax && this._options.syntax === "js") hideFormatButton = false;
                else hideFormatButton = true;
                if (!platform.frontendOptions.showFormatCodeButton)hideFormatButton = true;

                if (this._options.allowEdit && !hideFormatButton) this.#tab.addButton(GuiText.editorFormatButton, this.format.bind(this));
            }

            this.#tab.addEventListener("close", this._options.onClose);
            this.#tab.addEventListener(
                "onActivate",
                () =>
                {
                    this.ele.focus();
                // if (this._tab.editorObj && this._tab.editorObj.name) userSettings.set("editortab", this._tab.editorObj.name);
                },
            );
            this.cmWrap.setContent(content);
            // setTimeout(() =>
            // {
            //     this.ele.focus();
            if (this._options.onFinished) this._options.onFinished();
            // }, 100);
        });
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
                    this.#log.warn("code formating error", err);
                }
                else
                {
                    this.ele.value = res.opFullCode;
                    this.ele.focus();
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

            this.ele.focus();
        };

        gui.jobs().start({ "id": "saveeditorcontent", "title": "saving editor content" });
        if (this._options.onSave)
        {
            this._options.onSave(onSaveCb, this.cmWrap.getContent(), this.ele);
        }
        else this.emitEvent("save", onSaveCb, this.cmWrap.getContent(), this.ele);
    }

    /**
     * @param {function} cb
     */
    createEditor(cb)
    {
        if (loadingCm)
        {
            console.log("waiting for cm");
            setTimeout(() =>
            {
                this.createEditor(cb);
            }, 100);
            return;
        }

        // this.keys.key(" ", "show/hide timeline", "down", null, { "cmdCtrl": true, "ignoreInput": true }, () =>
        // {
        //     gui.toggleTimeline();
        // });

        if (loadedCm)
        {
            this.cmWrap = startCm(this.ele, { "helix": this.helix });

            cb();
        }
        else
        {
            loadingCm = true;
            console.log("loading cm");

            loadjs.ready("codemirror", () =>
            {
                this.cmWrap = startCm(this.ele, { "helix": this.helix });
                gui.jobs().finish("codemirror");
                loadedCm = true;
                loadingCm = false;
                console.log("loaded cm");
                cb();
            });

            gui.jobs().start({ "id": "codemirror", "title": "loading codemirror editor " });
            try
            {
                loadjs(["js/codemirror/cmhelix.js"], "codemirror");
            }
            catch (e)
            {
                console.log("text", e);
            }
        }
    }
}
