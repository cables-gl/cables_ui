import { ModalBackground, Logger, ele, Events } from "cables-shared-client";
import { hideToolTip } from "../elements/tooltips.js";
import { gui } from "../gui.js";
import { CssClassNames } from "../theme.js";

/**
 * configuration object for a modal dialog
 * @typedef {Object} ModalDialogOptions
 * @property {String} [html] html content
 * @property {String} [title] a title of the dialog
 * @property {String} [text]
 * @property {Object} [okButton]
 * @property {Object} [cancelButton]
 * @property {Boolean} [nopadding=false] remove padding around the window
 * @property {Boolean} [warning=false] show a warning triangle
 * @property {Boolean} [showOkButton=false] show a ok button to close the dialog
 * @property {Boolean} [prompt=false] show an input field to enter a value
 * @property {Boolean} [choice=false] show ok/cancel buttons with onSubmit and onClosed callbacks
 */

/**
 * open a modal dialog
 *
 * @example
 * new ModalDialog(
 * {
 *     "title":"Title",
 *     "html":"hello world",
 * });
 */
export default class ModalDialog extends Events
{
    #log = new Logger("ModalDialog");

    /** @type {ModalDialogOptions} */
    #options = {};

    #ele = null;
    #eleContent = null;
    #bg = new ModalBackground();

    /**
     * @param {ModalDialogOptions} options
     */
    constructor(options, autoOpen = true)
    {
        super();

        if (gui && gui.currentModal) gui.currentModal.close();
        this.#options = options;
        this.#options.okButton = this.#options.okButton || {};
        if (!this.#options.okButton.text) this.#options.okButton.text = "Ok";
        if (!this.#options.okButton.cssClasses) this.#options.okButton.cssClasses = "bluebutton";
        if (!this.#options.okButton.callback) this.#options.okButton.callback = null;

        this.#options.cancelButton = this.#options.cancelButton || {};
        if (!this.#options.cancelButton.text) this.#options.cancelButton.text = "Cancel";
        if (!this.#options.cancelButton.cssClasses) this.#options.cancelButton.cssClasses = CssClassNames.BUTTON;
        if (!this.#options.cancelButton.callback) this.#options.cancelButton.callback = null;

        this._checkboxGroups = this.#options.checkboxGroups || [];

        if (autoOpen) this.show();

        ele.byId("modalclose").style.display = "block";

        if (gui) gui.currentModal = this;

        this.#bg.on("hide", this.close.bind(this));
    }

    close()
    {
        this.#ele.remove();
        this.#bg.hide();
        if (gui) gui.currentModal = null;
        this.emitEvent("onClose", this);
    }

    html()
    {
        let html = "";

        if (this.#options.title) html += "<h2>";
        if (this.#options.warning) html += "<span class=\"icon icon-2x icon-alert-triangle\" style=\"vertical-align:bottom;\"></span>&nbsp;&nbsp;";
        if (this.#options.title) html += this.#options.title + "</h2>";

        if (this.#options.text)html += this.#options.text;
        if (this.#options.html)html += this.#options.html;

        if (this.#options.prompt)
        {
            html += "<br/><br/>";
            html += "<input id=\"modalpromptinput\" class=\"medium\" value=\"" + (this.#options.promptValue || "") + "\"/>";
            html += "<br/>";
        }

        if (this._checkboxGroups.length > 0)
        {
            this._checkboxGroups.forEach((group) =>
            {
                html += "<div class=\"checkbox_group\">";
                html += "<div class=\"checkbox_group_title\">" + group.title + "</div>";
                group.checkboxes.forEach((checkbox) =>
                {
                    const id = "modal_checkbox_" + checkbox.name;
                    const checkboxContainer = document.createElement("div");
                    checkboxContainer.style.display = "flex";
                    checkboxContainer.style.alignItems = "center";

                    const checkboxEle = document.createElement("input");
                    checkboxEle.classList.add("modalcheckbox");
                    checkboxEle.setAttribute("id", id);
                    checkboxEle.setAttribute("type", "checkbox");
                    if (checkbox.name) checkboxEle.setAttribute("name", checkbox.name);
                    if (checkbox.value) checkboxEle.setAttribute("value", checkbox.value);
                    if (checkbox.checked) checkboxEle.setAttribute("checked", "checked");
                    if (checkbox.disabled) checkboxEle.setAttribute("disabled", "disabled");
                    if (checkbox.tooltip)
                    {
                        checkboxEle.classList.add("tt", "tt-info");
                        checkboxEle.dataset.tt = checkbox.tooltip;
                    }
                    checkboxContainer.appendChild(checkboxEle);
                    if (checkbox.title)
                    {
                        checkboxContainer.innerHTML += "<label for=\"" + id + "\">" + checkbox.title + "</label>";
                    }
                    html += checkboxContainer.outerHTML;
                });
                html += "</div>";
            });
        }

        if (this.#options.notices && this.#options.notices.length > 0)
        {
            html += "<div class=\"modallist notices\">";
            html += "<ul>";
            for (let i = 0; i < this.#options.notices.length; i++)
            {
                const item = this.#options.notices[i];
                html += "<li>" + item + "</li>";
            }
            html += "</ul></div>";
        }

        if (this.#options.footer)
        {
            html += this.#options.footer;
        }

        if (this.#options.prompt)
        {
            html += "<br/>";
            html += "<a class=\"" + this.#options.okButton.cssClasses + "\" id=\"prompt_ok\">&nbsp;&nbsp;&nbsp;" + this.#options.okButton.text + "&nbsp;&nbsp;&nbsp;</a>";
            html += "&nbsp;&nbsp;<a class=\"cblbutton\" id=\"prompt_cancel\">&nbsp;&nbsp;&nbsp;" + this.#options.cancelButton.text + "&nbsp;&nbsp;&nbsp;</a>";
        }

        if (this.#options.choice)
        {
            html += "<br/><br/>";
            html += "<a class=\"" + this.#options.okButton.cssClasses + "\" id=\"choice_ok\">&nbsp;&nbsp;&nbsp;" + this.#options.okButton.text + "&nbsp;&nbsp;&nbsp;</a>";
            html += "&nbsp;&nbsp;<a class=\"" + this.#options.cancelButton.cssClasses + "\" id=\"choice_cancel\">&nbsp;&nbsp;&nbsp;" + this.#options.cancelButton.text + "&nbsp;&nbsp;&nbsp;</a>";
        }

        if (this.#options.showOkButton)
        {
            html += "<br/><br/><a class=\"" + this.#options.okButton.cssClasses + "\" id=\"modalClose\">&nbsp;&nbsp;&nbsp;" + this.#options.okButton.text + "&nbsp;&nbsp;&nbsp;</a>";
        }

        return html;
    }

    #addListeners()
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

        const elePromptCancel = ele.byId("prompt_cancel");
        if (elePromptCancel) elePromptCancel.addEventListener("pointerdown", this.close.bind(this));

        const eleChoiceOk = ele.byId("choice_ok");
        if (eleChoiceOk)
        {
            eleChoiceOk.addEventListener("pointerdown", () =>
            {
                this._choiceSubmit();
            });
        }

        const eleChoiceCancel = ele.byId("choice_cancel");
        if (eleChoiceCancel)
        {
            eleChoiceCancel.addEventListener("pointerdown", () =>
            {
                this.close();
                if (this.#options.cancelButton.callback) this.#options.cancelButton.callback();
            });
        }

        const eleModalOk = ele.byId("modalClose");
        if (eleModalOk)
        {
            eleModalOk.addEventListener("pointerdown", () =>
            {
                if (this.#options.okButton.callback) this.#options.okButton.callback();
                this.close();
            });
        }
    }

    /**
     * @param {string} h
     */
    updateHtml(h)
    {
        this.#options.html = h;
        this.#eleContent.innerHTML = this.html();

        Array.from(document.querySelectorAll("pre code")).forEach(function (block)
        {
            hljs.highlightElement(block);
        });
    }

    show()
    {
        this.#bg.show();

        this.#ele = document.createElement("div");
        this.#eleContent = document.createElement("div");

        this._eleCloseIcon = document.createElement("span");
        this._eleCloseIcon.classList.add("icon-x", "icon", "icon-2x");
        this._eleClose = document.createElement("div");
        this._eleClose.classList.add("modalclose");
        this._eleClose.appendChild(this._eleCloseIcon);
        this._eleClose.style.display = "block";

        this.#ele.classList.add("modalcontainer");
        this.#ele.classList.add("cablesCssUi");
        this.#ele.appendChild(this._eleClose);
        this.#ele.appendChild(this.#eleContent);

        document.body.appendChild(this.#ele);

        if (!this.#options.nopadding) this.#eleContent.style.padding = "15px";
        if (this.#options.nopadding) this.#ele.style.padding = "0px";

        this.#eleContent.innerHTML = this.html();

        Array.from(document.querySelectorAll("pre code")).forEach(function (block)
        {
            hljs.highlightElement(block);
        });

        this.#addListeners();

        hideToolTip();

        this.emitEvent("onShow", this);

        setTimeout(() =>
        {
            if (ele.byId("modalpromptinput"))ele.byId("modalpromptinput").focus();
        }, 50); // why is this delay needed in some cases (e.g. resolution button below canvas)
    }

    getElement()
    {
        return this.#ele;
    }

    _choiceSubmit()
    {
        const states = this._getCheckboxStates();
        this.close();
        this.emitEvent("onSubmit", null, states);
    }

    _promptSubmit()
    {
        const elePromptInput = ele.byId("modalpromptinput");

        if (!elePromptInput) return this.#log.warn("modal prompt but no input...?!");
        if (!this.#options.promptOk) return this.#log.warn("modal prompt but no promptOk callback!");

        const states = this._getCheckboxStates();
        this.close();
        this.#options.promptOk(elePromptInput.value, states);
        this.emitEvent("onSubmit", elePromptInput.value, states);
    }

    persistInIdleMode()
    {
        return this.#options.persistInIdleMode;
    }

    _getCheckboxStates()
    {
        const checkboxes = ele.byQueryAll(".modalcheckbox");
        const checkboxStates = {};
        checkboxes.forEach((checkbox) =>
        {
            let state = checkbox.checked;
            if (state)
                if (checkbox.value && (checkbox.value !== "on"))
                    state = checkbox.value;

            checkboxStates[checkbox.getAttribute("name")] = state;
        });
        return checkboxStates;
    }
}
