import { Events, ele } from "cables-shared-client";
import { Anim, Op, Port } from "cables";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import { glTlKeys } from "./gltlkeys.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { GlTimeline } from "./gltimeline.js";
import opNames from "../opnameutils.js";

/**
 * @typedef {object} TlTitleOptions
 * @property {String} [title]
 * @property {Port} [port]
 * @property {Port} [port]
 * @property {glTlAnimLine} [animLine]
 */

export class TlTitle extends Events
{
    static EVENT_TITLECLICKED = "titleClicked";
    index = 0;

    /** @type {HTMLElement} */
    #el = null;

    /** @type {HTMLElement} */
    #elButtonsLeft = null;

    /** @type {HTMLElement} */
    #elTitle = null;

    // * @type {Object}
    // #buttons = [];
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

    /** @type {glTlAnimLine} */
    animLine = null;

    #height = 30;

    collapsed = false;
    #hideOpName = false;
    isHovering = false;
    folderButton = null;
    #options = {};
    #elButtonsRight;
    #elIndent;

    /**
     * @param {HTMLElement} parentEl
     * @param {Anim} anim
     * @param {GlTimeline} gltl
     * @param {TlTitleOptions} options
     */
    constructor(gltl, parentEl, anim, options)
    {
        super();
        this.#gltl = gltl;
        this.#anim = anim || new Anim();
        this.#el = document.createElement("div");
        this.#el.classList.add("tlTitle");
        parentEl.appendChild(this.#el);

        this.#elButtonsRight = document.createElement("span");
        this.#elButtonsRight.classList.add("tlButtonsRight");
        this.#el.appendChild(this.#elButtonsRight);

        this.#elIndent = document.createElement("span");
        this.#elIndent.classList.add("indent");
        this.#el.appendChild(this.#elIndent);

        this.#elButtonsLeft = document.createElement("span");
        this.#elButtonsLeft.classList.add("tlButtonsLeft");
        this.#el.appendChild(this.#elButtonsLeft);

        this.#elTitle = document.createElement("span");

        this.#el.addEventListener("pointerenter", () =>
        {
            this.hover();
            this.emitEvent("hoverchange");
        });

        this.#el.addEventListener("pointerleave", () =>
        {
            this.unhover();
            this.emitEvent("hoverchange");
        });

        ele.clickable(this.#elTitle, (e) =>
        {
            this.emitEvent(TlTitle.EVENT_TITLECLICKED, this, e);
            this.#gltl.showParamAnim(this.#anim);
        });

        if (this.#gltl.layout == GlTimeline.LAYOUT_GRAPHS)
            this.activeButton = this.addButtonRight("<span class=\"icon icon-pencil icon-0_5x nomargin info\" data-info=\"tlactive\"></span>",
                (e) =>
                {
                    if (e.buttons == 2) this.#gltl.deactivateAllAnims();
                    this.toggleActive();
                }
            );

        this.#el.appendChild(this.#elTitle);

        if (this.#gltl.layout == GlTimeline.LAYOUT_GRAPHS) this.setActive(this.#anim.tlActive);
        else this.setActive(true);

        this.#options = options;

        if (options.animLine) this.animLine = options.animLine;
        if (options.port) this.setPort(options.port);
        if (options.title) this.setTitle(options.title);

        this.updateIcons();
    }

    /**
     * @param {boolean} b
     */
    set hideOpName(b)
    {
        this.#hideOpName = b;
        this.updateTitleFromOp();
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
        this.#el.style.height = Math.max(0, h - 6) + "px";
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
                this.updateTitleFromOp();
            }),
            port.on(Port.EVENT_UIATTRCHANGE, () =>
            {
                this.updateTitleFromOp();
            })
        );
        this.#op = port.op;
        this.#port = port;
        this.updateTitleFromOp();
    }

    updateTitleFromOp()
    {
        let title = this.#options.title || "";
        if (this.#op)
        {
            let style = "";
            let classnames = opNames.getNamespaceClassName(this.#op.objName);

            if (this.#hideOpName)style = "color:transparent !important";
            else classnames += " opname ";
            title += "<span style=\"" + style + "\" class=\"" + classnames + "\">";
            title += this.#op.name;
            title += "</span>";

            if (this.animLine && this.animLine.childLines.length > 0 && this.animLine.collapsed)
            {
                title += "(" + (this.animLine.childLines.length + 1) + ") ";
                title += " <span class=\"portname\">";
                title += this.#port.getTitle();

                for (let i = 0; i < this.animLine.childLines.length; i++)
                {
                    title += this.animLine.childLines[i].getPortTitles();
                }

                title += "</span>";
            }
            else
            {
                title += " <span class=\"portname\">" + (this.#port.uiAttribs.title || this.#port.name) + "</span>";

            }
            if (this.#op.uiAttribs.comment) title += "<span class=\"comment\"> // " + this.#op.uiAttribs.comment + "</span>";

            this.setBorderColor(false, this.#op.uiAttribs.color || "transparent");
        }
        else
        {
            console.log("no op title....");
        }

        this.setTitle(title);
    }

    /**
     * @param {boolean} c
     */
    setActive(c)
    {
        if (this.#anim) this.#anim.tlActive = c;

        this.updateIcons();
    }

    updateIcons()
    {
        if (this.animLine && this.animLine.childLines && this.animLine.childLines.length > 0)
        {
            if (!this.folderButton)
                this.folderButton = this.addButton("<span class=\"icon icon-chevron-right icon-0_5x nomargin info\" data-info=\"tlmute\"></span>", () =>
                {
                    this.animLine.toggleFolder();
                    this.updateTitleFromOp();
                });

            if (!this.animLine.collapsed)
            {
                this.folderButton.children[0].classList.remove("icon-chevron-right");
                this.folderButton.children[0].classList.add("icon-chevron-down");
            }
            else
            {
                this.folderButton.children[0].classList.add("icon-chevron-right");
                this.folderButton.children[0].classList.remove("icon-chevron-down");
            }
        }

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
                if (this.#port) this.#port.emitEvent("animLineUpdate");
            }
        }

        if (this.#port && !this.muteButton)
            this.muteButton = this.addButtonRight("<span class=\"icon icon-eye icon-0_5x nomargin info\" data-info=\"tlmute\"></span>",
                (e) =>
                {
                    this.#port.animMuted = !this.#port.animMuted;
                    this.#port.emitEvent("animLineUpdate");

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
            this.#port.emitEvent("animLineUpdate");

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
     * @param {boolean} [visible]
     * @param {undefined} [side]
     */
    addButtonRight(title, cb, visible, side)
    {
        return this.addButton(title, cb, visible, 1);
    }

    /**
     * @param {string} title
     * @param {Function} cb
     * @param {boolean} [visible]
     * @param {number} [side]
     */
    addButton(title, cb, visible, side)
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

        if (!side) this.#elButtonsLeft.appendChild(button);
        else this.#elButtonsRight.appendChild(button);

        // this.#buttons.push({ "ele": button, cb, title });
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

    getClientRect()
    {
        return this.#el.getBoundingClientRect();
    }

    hover()
    {
        this.#el.classList.add("hover");
        this.isHovering = true;
        this.#port?.emitEvent("animLineUpdate");
    }

    unhover()
    {
        this.#el.classList.remove("hover");
        this.isHovering = false;
        this.#port?.emitEvent("animLineUpdate");
    }
}
