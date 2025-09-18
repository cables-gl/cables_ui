import { Events, ele } from "cables-shared-client";
import { Anim, Op, Port } from "cables";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import { contextMenu } from "../elements/contextmenu.js";
import { glTlKeys } from "./gltlkeys.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { GlTimeline } from "./gltimeline.js";
import opNames from "../opnameutils.js";

export class TlTitle extends Events
{
    static EVENT_TITLECLICKED = "titleClicked";
    index = 0;

    /** @type {HTMLElement} */
    #el = null;

    /** @type {HTMLElement} */
    #elButtons = null;

    /** @type {HTMLElement} */
    #elTitle = null;

    /** @type {Object} */
    #buttons = [];
    #hasSelectedKeys;

    /** @type {Op} */
    #op;

    /** @type {glTlKeys} */
    tlKeys;

    /** @type {Anim} */
    #anim;

    /** @type {EventListener[]} */
    #listeners = [];
    #gltl;

    /** @type {Port} */
    #port;
    #height;
    collapsed = false;

    /**
     * @param {HTMLElement} parentEl
     * @param {Anim} anim
     * @param {GlTimeline} gltl
     * @param {{ port: any; collapsable: any; }} options
     */
    constructor(gltl, parentEl, anim, options)
    {
        super();
        this.#gltl = gltl;
        this.#anim = anim || new Anim();
        this.#el = document.createElement("div");
        this.#el.classList.add("tlTitle");
        parentEl.appendChild(this.#el);

        this.#elButtons = document.createElement("span");
        this.#elButtons.classList.add("tlButtons");
        this.#el.appendChild(this.#elButtons);

        this.#elTitle = document.createElement("span");

        ele.clickable(this.#elTitle, (e) =>
        {
            this.emitEvent(TlTitle.EVENT_TITLECLICKED, this, e);
            this.#gltl.showParamAnim(this.#anim);
        });

        if (options.collapsable)
            this.collapseButton = this.addButton("<span class=\"icon icon-chevron-right icon-0_5x nomargin info\" data-info=\"tlcollapse\"></span>",
                (e) =>
                {
                    this.collapsed = !this.collapsed;
                    this.updateIcons();
                    console.log("collapse...", this.collapsed);

                }
            );
        else
            this.addButton("<span class=\"icon icon-chevron-right icon-0_5x nomargin info\" style=\"opacity:0\"></span>", null, false);

        if (this.#gltl.layout == GlTimeline.LAYOUT_GRAPHS)
            this.activeButton = this.addButton("<span class=\"icon icon-pencil icon-0_5x nomargin info\" data-info=\"tlactive\"></span>",
                (e) =>
                {
                    if (e.buttons == 2) this.#gltl.deactivateAllAnims();
                    this.toggleActive();
                }
            );

        this.#el.appendChild(this.#elTitle);

        if (this.#gltl.layout == GlTimeline.LAYOUT_GRAPHS) this.setActive(this.#anim.tlActive);
        else this.setActive(true);

        if (options.port) this.setPort(options.port);

        this.updateIcons();
    }

    /**
     * @param {string} t
     */
    setTitle(t)
    {
        this.#elTitle.innerHTML = t;
    }

    /**
     * @param {number} h
     */
    setHeight(h)
    {
        this.#height = h;
        this.#el.style.height = h - 6 + "px";
    }

    /**
     * @param {Port} port
     */
    setPort(port)
    {
        if (this.#port) return;
        this.#listeners.push(
            port.op.on(Op.EVENT_UIATTR_CHANGE, () =>
            {
                this.updateFromOp();
            }),
            port.on(Port.EVENT_UIATTRCHANGE, () =>
            {
                this.updateFromOp();
            })
        );
        this.#op = port.op;
        this.#port = port;
        this.updateFromOp();
    }

    updateFromOp()
    {
        let title = "";
        if (this.#op)
        {
            title += "<span class=\"" + opNames.getNamespaceClassName(this.#op.objName) + "\">";
            title += this.#op.name;
            title += "</span>";

            title += " <span class=\"portname\">" + (this.#port.uiAttribs.title || this.#port.name) + "</span>";
            if (this.#op.uiAttribs.comment) title += "<span class=\"comment\"> // " + this.#op.uiAttribs.comment + "</span>";

            this.setBorderColor(false, this.#op.uiAttribs.color || "transparent");
        }

        this.setTitle(title);
    }

    /**
     * @param {boolean} c
     */
    setActive(c)
    {
        if (this.#anim)
            this.#anim.tlActive = c;

        this.updateIcons();
    }

    updateIcons()
    {
        if (this.#anim)
        {

            const c = this.#anim.tlActive;

            if (c) this.#elTitle.classList.add("current");
            else this.#elTitle.classList.remove("current");

            if (this.activeButton)
            {
                if (!c)
                {
                    this.#elTitle.style.opacity = "0.4";
                    this.activeButton.children[0].classList.remove("icon-pencil");
                    this.activeButton.children[0].classList.add("icon-pencil-off");
                }
                else
                {
                    this.#elTitle.style.opacity = "1";
                    this.activeButton.children[0].classList.add("icon-pencil");
                    this.activeButton.children[0].classList.remove("icon-pencil-off");
                }
            }
        }

        if (this.#port && !this.muteButton)
            this.muteButton = this.addButton("<span class=\"icon icon-eye icon-0_5x nomargin info\" data-info=\"tlmute\"></span>",
                (e) =>
                {

                    this.#port.animMuted = !this.#port.animMuted;
                    this.updateIcons();
                }
            );
        if (this.muteButton)
        {
            if (this.#port.animMuted)
            {
                this.#elTitle.style.opacity = "0.4";
                this.muteButton.children[0].classList.remove("icon-eye");
                this.muteButton.children[0].classList.add("icon-eye-off");
            }
            else
            {
                this.#elTitle.style.opacity = "1";
                this.muteButton.children[0].classList.add("icon-eye");
                this.muteButton.children[0].classList.remove("icon-eye-off");
            }
        }

        if (this.collapseButton)
        {
            if (this.collapsed)
            {
                this.collapseButton.children[0].classList.remove("icon-chevron-right");
                this.collapseButton.children[0].classList.add("icon-chevron-down");
            }
            else
            {
                this.collapseButton.children[0].classList.add("icon-chevron-right");
                this.collapseButton.children[0].classList.remove("icon-chevron-down");
            }
        }
    }

    /**
     * @param {boolean} selected
     * @param {string} color
     */
    setBorderColor(selected, color)
    {
        if (selected) this.#el.classList.add("selectedOp");
        else this.#el.classList.remove("selectedOp");

        this.#elTitle.style.borderLeft = "3px solid " + color;

    }

    toggleActive()
    {
        if (this.#anim)
            this.setActive(!this.#anim.tlActive);
    }

    /**
     * @param {boolean} c
     */
    setHasSelectedKeys(c)
    {
        this.#hasSelectedKeys = c;

        if (c) this.#el.classList.add("hasSelectedKeys");
        else this.#el.classList.remove("hasSelectedKeys");
    }

    /**
     * @param {string} title
     * @param {Function} cb
     */
    addButton(title, cb, visible)
    {
        const button = document.createElement("a");
        button.classList.add("button-small");

        let html = "";
        html += title;
        button.innerHTML = html;
        ele.clickable(button, cb);
        if (cb) button.addEventListener("contextmenu", (e) => { cb(e); });
        button.addEventListener("dblclick", (e) => { this.#gltl.deactivateAllAnims(true); });
        if (visible === false)button.style.opacity = "0";
        this.#elButtons.appendChild(button);
        this.#buttons.push({ "ele": button, cb, title });
        return button;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPos(x, y)
    {
        this.#el.style.left = (x) + "px";
        this.#el.style.top = (y) + "px";
        // console.log(this.#gltl.getFirstLinePosy(), y);
    }

    dispose()
    {
        for (let i = 0; i < this.#listeners.length; i++) this.#listeners[i].remove();
        this.#el.remove();

    }

    /* @deprecated */
    updateColor()
    {

    }

    getAnim()
    {
        return this.#anim;
    }
}
