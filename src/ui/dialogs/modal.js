import ele from "../utils/ele";
import Logger from "../utils/logger";
import ModalBackground from "./modalbg";

export default class ModalDialog
{
    constructor(options)
    {
        this._log = new Logger("ModalDialog");
        this._options = options;
        this._ele = null;
        this._eleContent = null;
        // this._eleBg = document.getElementById("modalbg");
        this._bg = new ModalBackground();

        this.show();

        this._escapeListener = gui.on("pressedEscape", this.close.bind(this));
    }

    close()
    {
        this._ele.remove();
        // this._eleBg.style.display = "none";
        this._bg.hide();
    }

    html()
    {
        let html = "";
        if (this._options.title)
            html += "<h2>" + this._options.title + "</h2>";

        if (this._options.text)html += this._options.text;

        if (this._options.prompt)
        {
            html += "<br/><br/>";
            html += "<input id=\"modalpromptinput\" class=\"medium\" value=\"" + (this._options.promptValue || "") + "\"/>";
            html += "<br/><br/>";
            html += "<a class=\"bluebutton\" id=\"prompt_ok\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>";
            html += "&nbsp;&nbsp;<a class=\"greybutton\" id=\"prompt_cancel\">&nbsp;&nbsp;&nbsp;cancel&nbsp;&nbsp;&nbsp;</a>";
        }

        return html;
    }

    _addListeners()
    {
        this._eleClose.addEventListener("click", this.close.bind(this));

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
            elePromptOk.addEventListener("click", () =>
            {
                this._promptSubmit();
            });
        }

        const elePromptCancel = ele.byId("prompt_cancel");
        if (elePromptCancel) elePromptCancel.addEventListener("click", this.close.bind(this));
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
        this._ele.appendChild(this._eleClose);
        this._ele.appendChild(this._eleContent);

        document.body.appendChild(this._ele);

        if (!this._options.nopadding) this._eleContent.style.padding = "15px";

        this._eleContent.innerHTML = this.html();

        this._addListeners();

        CABLES.UI.hideToolTip();
    }

    _promptSubmit()
    {
        const elePromptInput = ele.byId("modalpromptinput");

        if (!elePromptInput) return this._log.warn("modal prompt but no input...?!");
        if (!this._options.promptOk) return this._log.warn("modal prompt but no promptOk callback!");

        this.close();
        this._options.promptOk(elePromptInput.value);
    }
}
