import { Events, ele } from "cables-shared-client";

export class TlTitle extends Events
{
    index = 0;

    /** @type {HTMLElement} */
    #el = null;

    /** @type {HTMLElement} */
    #elTitle = null;

    /** @type {Object} */
    #buttons = [];

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

    dispose()
    {
        this.#el.remove();
    }
}
