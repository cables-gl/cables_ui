import { Events, ele } from "cables-shared-client";
import { utils } from "cables";
import text from "../../text.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import TabPanel from "./tabpanel.js";

/**
 * @typedef TabOptions
 * @property {String} [name]
 * @property {boolean} [singleton]
 * @property {boolean} [closable]
 * @property {boolean} [hideToolbar]
 * @property {boolean} [showTitle]
 * @property {boolean} [padding]
 * @property {TabPanel} [tabPanel]
 * @property {string} [dataId]
 * @property {string} [icon]
 * @property {string} [infotext]
 */

export default class Tab extends Events
{
    static EVENT_CLOSE = "close";
    static EVENT_DEACTIVATE = "onDeactivate";
    static EVENT_ACTIVATE = "onActivate";

    /**
     * @param {String} title
     * @param {TabOptions} options
     */
    constructor(title, options)
    {
        super();
        this.id = utils.uuid();

        /** @type {TabOptions} */
        this.options = options || {};
        if (!this.options.hasOwnProperty("showTitle")) this.options.showTitle = true;
        if (!this.options.hasOwnProperty("hideToolbar")) this.options.hideToolbar = false;
        if (!this.options.hasOwnProperty("closable")) this.options.closable = true;
        if (!this.options.hasOwnProperty("name")) this.options.name = title || "???";

        this.tabPanel = this.options.tabPanel || null;
        this.icon = this.options.icon || null;
        this.dataId = this.options.dataId;
        this.title = title;
        this.active = false;
        this.toolbarContainerEle = document.createElement("div");
        this.contentEle = document.createElement("div");
        this.toolbarEle = document.createElement("div");
        this.toolbarEle.classList.add("buttonbar");
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

            const tbEl = ele.byId("toolbarContent" + this.id);
            if (tbEl)tbEl.appendChild(this.toolbarEle);
        }

        this.contentEle.id = "content" + this.id;
        this.contentEle.classList.add("tabcontent");
        if (this.options.padding) this.contentEle.classList.add("padding");
        this.contentEle.innerHTML = "";
        eleContainer.appendChild(this.contentEle);
    }

    /**
     * @param {HTMLElement} el
     */
    addButtonBarElement(el)
    {
        this.toolbarEle.appendChild(el);
    }

    addButtonSpacer()
    {
        const button = document.createElement("span");
        button.innerHTML = "&nbsp;&nbsp;&nbsp;";
        this.toolbarEle.appendChild(button);
        this.buttons.push({ "ele": button });
        return button;
    }

    /**
     * @param {string} title
     * @param {Function} cb
     */
    addButton(title, cb, classes)
    {
        const button = document.createElement("a");
        button.classList.add("button-small");

        let html = "";
        html += title;
        button.innerHTML = html;
        ele.clickable(button, cb);
        this.toolbarEle.appendChild(button);
        this.buttons.push({ "ele": button, cb, title });
        if (classes) for (let i = 0; i < classes.length; i++)button.classList.add(classes[i]);
        return button;
    }

    getSaveButton()
    {
        for (let i = 0; i < this.buttons.length; i++) if (this.buttons[i].title == text.editorSaveButton) return this.buttons[i];
    }

    remove()
    {
        this.emitEvent(Tab.EVENT_CLOSE, this);
        this.contentEle.remove();
        this.toolbarContainerEle.remove();
        if (this.tabPanel) this.tabPanel.closeTab(this.id);
    }

    /**
     * @param {string} html
     */
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
        this.emitEvent(Tab.EVENT_ACTIVATE);
    }

    deactivate()
    {
        this.active = false;
        this.contentEle.style.display = "none";
        this.toolbarContainerEle.style.display = "none";
        this.emitEvent(Tab.EVENT_DEACTIVATE);
    }
}
