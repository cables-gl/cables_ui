import { getHandleBarHtml } from "../../utils/handlebars";

export default class Tab extends CABLES.EventTarget
{
    constructor(title, options)
    {
        super();
        CABLES.EventTarget.apply(this);
        this.id = CABLES.uuid();
        this.options = options || {};
        if (!options.hasOwnProperty("showTitle")) this.options.showTitle = true;
        if (!options.hasOwnProperty("hideToolbar")) this.options.hideToolbar = false;
        if (!options.hasOwnProperty("closable")) this.options.closable = true;
        if (!options.hasOwnProperty("name")) this.options.name = title;

        this.icon = this.options.icon || null;
        this.dataId = options.dataId;
        this.title = title;
        this.active = false;
        this.toolbarContainerEle = document.createElement("div");
        this.contentEle = document.createElement("div");
        this.toolbarEle = document.createElement("div");
        this.buttons = [];
    }

    initHtml(eleContainer)
    {
        if (!this.options.hideToolbar)
        {
            this.toolbarContainerEle.id = "toolbar" + this.id;
            this.toolbarContainerEle.classList.add("toolbar");
            this.toolbarContainerEle.innerHTML = getHandleBarHtml("tabpanel_toolbar",
                {
                    "options": this.options, "id": this.id, "title": this.title, "hideToolbar": true,
                });
            eleContainer.appendChild(this.toolbarContainerEle);
            document.getElementById("toolbarContent" + this.id).appendChild(this.toolbarEle);
        }

        this.contentEle.id = "content" + this.id;
        this.contentEle.classList.add("tabcontent");
        if (this.options.padding) this.contentEle.classList.add("padding");
        this.contentEle.innerHTML = "";// "hello " + this.title + "<br/><br/>the tab " + this.id;
        eleContainer.appendChild(this.contentEle);
    }

    addButton(title, cb)
    {
        const button = document.createElement("a");
        button.classList.add("button-small");
        button.innerHTML = title;
        button.addEventListener("click", cb);
        this.toolbarEle.appendChild(button);
        this.buttons.push({ "ele": button, cb, title });
    }

    getSaveButton()
    {
        for (let i = 0; i < this.buttons.length; i++) if (this.buttons[i].title == CABLES.UI.TEXTS.editorSaveButton) return this.buttons[i];
    }

    remove()
    {
        this.emitEvent("onClose", this);
        this.contentEle.remove();
        this.toolbarContainerEle.remove();
    }

    html(html)
    {
        this.contentEle.innerHTML = html;
        this.updateSize();
    }

    isVisible()
    {
        return this.active;
    }

    updateSize()
    {
        if (!this.contentEle || !this.contentEle.parentElement) return;
        if (!this.toolbarContainerEle) return;
        this.contentEle.style.height = (this.contentEle.parentElement.clientHeight - this.toolbarContainerEle.clientHeight - 3) + "px";
    }

    activate()
    {
        this.active = true;
        this.contentEle.style.display = "block";
        this.toolbarContainerEle.style.display = "block";
        this.updateSize();
        this.emitEvent("onActivate");
    }

    deactivate()
    {
        this.active = false;
        this.contentEle.style.display = "none";
        this.toolbarContainerEle.style.display = "none";
        this.emitEvent("ondeactivate");
    }
}
