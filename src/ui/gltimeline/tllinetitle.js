import { Events, ele } from "cables-shared-client";
import { Anim, Op } from "cables";
import { contextMenu } from "../elements/contextmenu.js";
import { glTlKeys } from "./gltlkeys.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { GlTimeline } from "./gltimeline.js";

export class TlTitle extends Events
{
    static EVENT_TITLECLICKED = "titleClicked";
    index = 0;

    /** @type {HTMLElement} */
    #el = null;

    /** @type {HTMLElement} */
    #elTitle = null;

    /** @type {Object} */
    #buttons = [];
    #hasSelectedKeys;

    /** @type {Op} */
    op;

    /** @type {glTlKeys} */
    tlKeys;

    /** @type {Anim} */
    #anim;
    #gltl;

    /**
     * @param {HTMLElement} parentEl
     * @param {Anim} anim
     * @param {GlTimeline} gltl
     */
    constructor(gltl, parentEl, anim)
    {
        super();
        this.#gltl = gltl;
        this.#anim = anim;
        this.#el = document.createElement("div");
        this.#el.classList.add("tlTitle");
        parentEl.appendChild(this.#el);

        this.#elTitle = document.createElement("span");

        ele.clickable(this.#elTitle, (e) =>
        {
            console.log("${}", e);
            this.emitEvent(TlTitle.EVENT_TITLECLICKED, this, e);
        });
        this.addButton("...",
            (e) =>
            {
                contextMenu.show(
                    {
                        "items":
                        [
                            {
                                "title": "Select all keys",
                                "func": () => { this.tlKeys.selectAll(); }
                            },
                        ]
                    }, e.target);
            }
        );
        if (this.#gltl.layout == GlTimeline.LAYOUT_GRAPHS)
            this.activeButton = this.addButton("<span class=\"icon icon-check icon-0_75x nomargin info\" data-info=\"tlactive\"></span>",
                (e) =>
                {
                    if (e.buttons == 2) this.#gltl.deactivateAllAnims();
                    this.toggleActive();
                }
            );
        this.#el.appendChild(this.#elTitle);

        if (this.#gltl.layout == GlTimeline.LAYOUT_GRAPHS) this.setActive(anim.tlActive);
        else this.setActive(true);
    }

    /**
     * @param {string} t
     */
    setTitle(t)
    {
        this.#elTitle.innerHTML = t;
    }

    /**
     * @param {boolean} c
     */
    setActive(c)
    {
        this.#anim.tlActive = c;

        this.updateIcons();
    }

    updateIcons()
    {
        const c = this.#anim.tlActive;

        if (c) this.#elTitle.classList.add("current");
        else this.#elTitle.classList.remove("current");

        if (this.activeButton)
        {
            if (!c)
            {
                this.#elTitle.style.opacity = "0.4";
                this.activeButton.children[0].classList.remove("icon-check");
                this.activeButton.children[0].classList.add("icon-empty");
            }
            else
            {
                this.#elTitle.style.opacity = "1";
                this.activeButton.children[0].classList.add("icon-check");
                this.activeButton.children[0].classList.remove("icon-empty");
            }
        }
    }

    /**
     * @param {string} color
     */
    setBorderColor(selected, color)
    {
        if (selected) this.#el.classList.add("selectedOp");
        else this.#el.classList.remove("selectedOp");

        this.#el.style.borderLeft = "3px solid " + color;
    }

    toggleActive()
    {
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
    addButton(title, cb)
    {
        const button = document.createElement("a");
        button.classList.add("button-small");

        let html = "";
        html += title;
        button.innerHTML = html;
        ele.clickable(button, cb);
        button.addEventListener("contextmenu", (e) => { cb(e); });
        button.addEventListener("dblclick", (e) => { this.#gltl.deactivateAllAnims(true); });
        this.#el.appendChild(button);
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
        this.#el.style.top = (y + 35) + "px";
    }

    dispose()
    {
        this.#el.remove();

    }

    /* @deprecated */
    updateColor()
    {

    }
}
