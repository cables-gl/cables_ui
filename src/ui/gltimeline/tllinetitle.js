import { Events, ele } from "cables-shared-client";
import { Op } from "cables";
import { contextMenu } from "../elements/contextmenu.js";
import { glTlKeys } from "./gltlkeys.js";

export class TlTitle extends Events
{
    index = 0;

    /** @type {HTMLElement} */
    #el = null;

    /** @type {HTMLElement} */
    #elTitle = null;

    /** @type {Object} */
    #buttons = [];
    #isCurrent;
    #hasSelectedKeys;

    /** @type {Op} */
    op;

    /** @type {glTlKeys} */
    tlKeys;

    /**
     * @param {HTMLElement} parentEl
     */
    constructor(parentEl)
    {
        super();
        this.#el = document.createElement("div");
        this.#el.classList.add("tlTitle");
        parentEl.appendChild(this.#el);

        this.#elTitle = document.createElement("span");

        ele.clickable(this.#elTitle, () =>
        {
            this.emitEvent("titleClicked", this);
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
        // this.addButton("<span class=\"nomargin icon icon-three-dots\"></span>", () => {});
        this.#el.appendChild(this.#elTitle);

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
    setIsCurrent(c)
    {
        this.#isCurrent = c;

        if (c) this.#elTitle.classList.add("current");
        else this.#elTitle.classList.remove("current");
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

    updateColor()
    {
        if (this.op)
            this.setIsCurrent(gui.patchView.isCurrentOp(this.op));
    }

    dispose()
    {
        this.#el.remove();
    }
}
