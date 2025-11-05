import { Events, ele } from "cables-shared-client";
import { Anim, Op, Port } from "cables";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import { glTlKeys } from "./gltlkeys.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { GlTimeline } from "./gltimeline.js";
import opNames from "../opnameutils.js";
import { UiOp } from "../core_extend_op.js";
import { CssClassNames, DomEvents } from "../theme.js";
import { GuiText } from "../text.js";
import { gui } from "../gui.js";

/**
 * @typedef {object} TlTitleOptions
 * @property {String} [title]
 * @property {Port} [port]
 * @property {Port} [port]
 * @property {glTlAnimLine} [animLine]
 */
export class TlTitle extends Events
{
    static EVENT_CLICK_OPNAME = "titleClicked";
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

    collapsed = false;
    #hideOpName = false;
    isHovering = false;
    folderButton = null;
    #options = {};
    #elButtonsRight;
    #elIndent;
    #elOpname;
    #elPortname;
    #elPortValue;

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

        this.#elOpname = document.createElement("span");
        this.#el.appendChild(this.#elOpname);

        this.#elPortValue = document.createElement("span");
        this.#elPortValue.classList.add("portAndValue");
        this.#el.appendChild(this.#elPortValue);
        this.#elPortValue.addEventListener(DomEvents.POINTER_DBL_CLICK, (e) => { this.selectAllKeys(); });

        this.#elPortname = document.createElement("span");
        this.#elPortValue.appendChild(this.#elPortname);

        this.#elTitle = document.createElement("span");
        this.#el.appendChild(this.#elTitle);

        this.#el.addEventListener(DomEvents.POINTER_DBL_CLICK, (e) => { this.selectAllKeys(); });

        this.#el.addEventListener(DomEvents.POINTER_ENTER, () =>
        {
            gui.showInfo(GuiText.tlhover_title);
            this.hover();
            this.emitEvent("hoverchange");
        });

        this.#el.addEventListener(DomEvents.POINTER_LEAVE, () =>
        {
            this.unhover();
            this.emitEvent("hoverchange");
        });

        ele.clickable(this.#elOpname, (e) =>
        {
            this.emitEvent(TlTitle.EVENT_CLICK_OPNAME, this, e);
            this.#gltl.showParamOp(this.#op);
        });

        ele.clickable(this.#elPortValue, (e) =>
        {
            this.emitEvent(TlTitle.EVENT_CLICK_OPNAME, this, e);

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
        this.#el.style.height = Math.max(0, h - 6) + "px";
    }

    selectAllKeys()
    {
        this.#gltl.unSelectAllKeys();
        // this.#gltl.deactivateAllAnims(true);
        const keys = this.animLine.getGlKeysForAnim(this.#anim);
        keys.selectAll();
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

            let opname = this.#op.name;
            if (this.#port.op.uiAttribs.extendTitle)
                opname += " <span class=\"extendTitle\"> " + this.#port.op.uiAttribs.extendTitle + "</span>";
            this.#elOpname.innerHTML = opname;

            this.#elOpname.classList.add(opNames.getNamespaceClassName(this.#op.objName));
            this.#elOpname.classList.add("opname");
            if (this.#hideOpName) this.#elOpname.classList.add("hiddenOpname");

            let portnames = "";

            if (this.animLine && this.animLine.childLines.length > 0 && this.animLine.collapsed)
            {
                portnames += "(" + (this.animLine.childLines.length + 1) + ") ";
                portnames += " <span class=\"portname\">";
                portnames += this.#port.getTitle();

                for (let i = 0; i < this.animLine.childLines.length; i++)
                {
                    portnames += this.animLine.childLines[i].getPortTitles();
                }

                portnames += "</span>";
            }
            else
            {
                portnames += " <span class=\"portname\">";
                portnames += (this.#port.uiAttribs.title || this.#port.name);
                portnames += "</span>";
            }

            this.#elPortname.innerHTML = portnames;
            this.#elPortname.classList.add("portname");

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
                    this.animLine.toggleCollapse();
                    this.updateTitleFromOp();
                });

            if (!this.animLine.collapsed)
            {
                this.folderButton.children[0].classList.remove("icon-chevron-right");
                this.folderButton.children[0].classList.add("icon-chevron-down");
                if (this.#el.parentElement) this.#el.parentElement.classList.remove("collapsed");
            }
            else
            {
                this.folderButton.children[0].classList.add("icon-chevron-right");
                this.folderButton.children[0].classList.remove("icon-chevron-down");
                if (this.#el.parentElement) this.#el.parentElement.classList.add("collapsed");
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
                this.muteButton.children[0].style.backgroundColor = "red";
            }
            else
            {
                this.#elTitle.style.opacity = "1";
                this.muteButton.children[0].style.backgroundColor = "";
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

        this.#el.style.borderLeft = "3px solid " + color;
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
        button.classList.add(CssClassNames.BUTTON_SMALL);

        let html = "";
        html += title;
        button.innerHTML = html;
        ele.clickable(button, cb);
        if (cb) button.addEventListener("contextmenu", (e) => { cb(e); });
        button.addEventListener(DomEvents.POINTER_DBL_CLICK, (e) => { this.#gltl.deactivateAllAnims(true); });
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

    updateColor()
    {
        if (this.#op && this.#op.uiAttribs.selected)
        {
            if (this.index == 0) this.#el.classList.add("selectedOp");
        }
        else this.#el.classList.remove("selectedOp");

        if (this.#port)
            if (this.#port.uiAttribs.hover) this.#elPortname.classList.add("hover");
            else this.#elPortname.classList.remove("hover");
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
        this.isHovering = true;
        this.#port?.setUiAttribs({ "hover": true });
        this.#port?.emitEvent("animLineUpdate");
    }

    unhover()
    {
        this.isHovering = false;
        this.#port?.setUiAttribs({ "hover": false });
        this.#port?.emitEvent("animLineUpdate");
    }

    /**
     * @param {number} [t]
     */
    updateValue(t)
    {
        // if (this.#anim)
        //     this.#elValue.innerHTML = String(Math.round(1000 * this.#anim.getValue(t)) / 1000);
    }

    scrollIntoView()
    {
        const elem = this.#el;
        let rectElem = elem.getBoundingClientRect();
        let rectContainer = this.#gltl.tlTimeScrollContainer.getBoundingClientRect();
        if (rectElem.bottom > rectContainer.bottom || rectElem.top < rectContainer.top)
        {
            this.#el.scrollIntoView({ "block": "start", "container": "nearest" });
            document.body.scrollTop = 0;
        }

    }
}
