import ele from "../utils/ele";
import Logger from "../utils/logger";
import ModalBackground from "./modalbg";

/**
 * configuration object for loading a patch
 * @typedef {Object} ModalDialogOptions
 * @hideconstructor
 * @property {String} [html=''] html content
 * @property {String} [tite=''] a title of the dialog
 * @property {Boolean} [nopadding=false] remove padding around the window
 * @property {Boolean} [warning=false] show a warning triangle
 * @property {Boolean} [showOkButton=false] show a ok button to close the dialog
 * @property {Boolean} [prompt=false] show an input field to enter a value
 */

/**
 * ModalDialog opens a modal dialog overlay
 *
 * @param {ModalDialogOptions} options The option object.
 * @class
 * @example
 * new ModalDialog(
 * {
 *     "title":"Title",
 *     "html":"hello world",
 * });
 */
export default class ModalDialog extends CABLES.EventTarget
{
    constructor(options, autoOpen = true)
    {
        super();
        this._log = new Logger("ModalDialog");

        if (window.gui && gui.currentModal) gui.currentModal.close();
        this._options = options;
        this._ele = null;
        this._eleContent = null;
        this._bg = new ModalBackground();

        if (autoOpen) this.show();

        ele.byId("modalclose").style.display = "block";

        gui.currentModal = this;
    }

    close()
    {
        this._ele.remove();
        this._bg.hide();
        gui.currentModal = null;
        this.emitEvent("onClose", this);
    }

    html()
    {
        let html = "";

        if (this._options.title) html += "<h2>";
        if (this._options.warning) html += "<span class=\"icon icon-2x icon-alert-triangle\" style=\"vertical-align:bottom;\"></span>&nbsp;&nbsp;";
        if (this._options.title) html += this._options.title + "</h2>";

        if (this._options.text)html += this._options.text;
        if (this._options.html)html += this._options.html;

        if (this._options.prompt)
        {
            html += "<br/><br/>";
            html += "<input id=\"modalpromptinput\" class=\"medium\" value=\"" + (this._options.promptValue || "") + "\"/>";
            html += "<br/><br/>";
            html += "<a class=\"bluebutton\" id=\"prompt_ok\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>";
            html += "&nbsp;&nbsp;<a class=\"greybutton\" id=\"prompt_cancel\">&nbsp;&nbsp;&nbsp;cancel&nbsp;&nbsp;&nbsp;</a>";
        }

        if (this._options.showOkButton)
        {
            html += "<br/><br/><a class=\"bluebutton\" id=\"modalClose\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>";
        }

        return html;
    }

    _addListeners()
    {
        this._eleClose.addEventListener("pointerdown", this.close.bind(this));

        const elePromptInput = ele.byId("modalpromptinput");
        if (elePromptInput)
        {
            elePromptInput.focus();
            elePromptInput.addEventListener("keydown", (e) =>
            {
                if (e.code == "Enter") this._promptSubmit();
            });
        }

        const elePromptOk = ele.byId("prompt_ok");
        if (elePromptOk)
        {
            elePromptOk.addEventListener("pointerdown", () =>
            {
                this._promptSubmit();
            });
        }

        const eleModalOk = ele.byId("modalClose");
        if (eleModalOk)
        {
            eleModalOk.addEventListener("pointerdown", () =>
            {
                this.close();
            });
        }

        const elePromptCancel = ele.byId("prompt_cancel");
        if (elePromptCancel) elePromptCancel.addEventListener("pointerdown", this.close.bind(this));
    }

    updateHtml(h)
    {
        this._options.html = h;
        this._eleContent.innerHTML = this.html();
    }

    show()
    {
        // this._eleBg.style.display = "block";
        this._bg.show();

        this._ele = document.createElement("div");
        this._eleContent = document.createElement("div");

        this._eleCloseIcon = document.createElement("span");
        this._eleCloseIcon.classList.add("icon-x", "icon", "icon-2x");
        this._eleClose = document.createElement("div");
        this._eleClose.classList.add("modalclose");
        this._eleClose.appendChild(this._eleCloseIcon);
        this._eleClose.style.display = "block";

        this._ele.classList.add("modalcontainer");
        this._ele.classList.add("cablesCssUi");
        this._ele.appendChild(this._eleClose);
        this._ele.appendChild(this._eleContent);

        document.body.appendChild(this._ele);

        if (!this._options.nopadding) this._eleContent.style.padding = "15px";
        if (this._options.nopadding) this._ele.style.padding = "0px";

        this._eleContent.innerHTML = this.html();

        this._addListeners();

        CABLES.UI.hideToolTip();

        this.emitEvent("onShow", this);
    }

    getElement()
    {
        return this._ele;
    }

    _promptSubmit()
    {
        const elePromptInput = ele.byId("modalpromptinput");

        if (!elePromptInput) return this._log.warn("modal prompt but no input...?!");
        if (!this._options.promptOk) return this._log.warn("modal prompt but no promptOk callback!");

        this.close();
        this._options.promptOk(elePromptInput.value);
        this.emitEvent("onSubmit", elePromptInput.value);
    }
}
