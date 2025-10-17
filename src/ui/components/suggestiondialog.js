import { ele, ModalBackground } from "cables-shared-client";
import { Op, Port } from "cables";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { gui } from "../gui.js";

/** @typedef SuggestionItem
 * @property {String} [name]
 * @property {String} [class]
 * @property {Number} [id]
 * @property {Number} [rot] - internal: do not set manually
 * @property {Number} [top] - internal: do not set manually
 * @property {Number} [left] - internal: do not set manually
 * @property {String} [shortName] - internal: do not set manually
 * @property {String} [classname] - class
 * @property {Port} [p] - port
 * @property {Op} [op] - op
 * @property {Function} [cb] - [callback]
*/

/**
 * show suggestion dialog (rotary mouse select menu)
 *
 * @export
 * @class SuggestionDialog
 */
export default class SuggestionDialog
{
    #eleDialog;
    #action;
    #cb;
    #options;

    /**
     * @param {SuggestionItem[]} suggestions
     * @param {Op} op
     * @param {MouseEvent} mouseEvent
     * @param {Function} cb
     * @param {Function} _action
     * @param {boolean} [_showSelect]
     * @param {Function} [cbCancel]
     */
    constructor(suggestions, op, mouseEvent, cb, _action, _showSelect, cbCancel, options = {})
    {
        this.#options = options;
        this.#cb = cb;
        this.#action = _action;
        this.#eleDialog = document.createElement("div");// ele.byId("suggestionDialog");
        document.body.appendChild(this.#eleDialog);
        this.#eleDialog.classList.add("suggestionDialog");

        if (!options.tease)
        {
            this._bg = new ModalBackground();
            this._bg.on("hide", () =>
            {
                this.close();
                if (cbCancel)cbCancel();
            });
        }

        this.doShowSelect = _showSelect;

        if (!suggestions)
        {
            if (cb)cb();
            return;
        }

        if (!options.tease)
            CABLES.UI.suggestions = this;

        let sugDegree = 6;
        const sugHeight = 23;

        if (suggestions.length > 10)sugDegree = 3;

        for (let i = 0; i < suggestions.length; i++)
        {
            suggestions[i].id = i;
            suggestions[i].rot = (((i) - (suggestions.length / 2)) * sugDegree);
            suggestions[i].left = 15 - Math.abs(((i) - ((suggestions.length - 1) / 2)) * 3) / 2;
            suggestions[i].top = (i * sugHeight) - (suggestions.length * sugHeight / 2) - sugHeight;
            suggestions[i].shortName = suggestions[i].name.substr(4, suggestions[i].name.length);
            if (suggestions[i].name) suggestions[i].shortName = suggestions[i].name;
        }

        this.#eleDialog.innerHTML = getHandleBarHtml("suggestions", {
            suggestions,
            _showSelect
        });
        if (this._bg) this._bg.show();

        if (!options.hide) ele.show(this.#eleDialog);

        this.#eleDialog.style.left = mouseEvent.clientX + "px";
        this.#eleDialog.style.top = mouseEvent.clientY + "px";

        if (options.opacity) this.#eleDialog.style.opacity = options.opacity;
        for (let i = 0; i < suggestions.length; i++)
        {
            suggestions[i].rot = (((i) - (suggestions.length / 2)) * sugDegree);
            const left = 15 - Math.abs(((i) - ((suggestions.length - 1) / 2)) * 3);

            suggestions[i].shortName = suggestions[i].name.substr(4, suggestions[i].name.length);

            // const sugEle = ele.byId("suggestion" + i);
            const sugEle = this.#eleDialog.getElementsByClassName("suggestion" + i)[0];

            if (suggestions[i].class)sugEle.classList.add(suggestions[i].class);

            if (!options.noAnim)
                sugEle.animate([
                    { "left": -left + "px", "opacity": 0 },
                    { "left": 0 + "px", "opacity": 1 },
                ], {
                    "duration": 150 + i * 50,
                    "easing": "ease-out",
                    "iterations": 1,
                });

            suggestions[i].id = i;
        }
    }

    close()
    {
        this.#eleDialog.innerHTML = "";

        ele.hide(this.#eleDialog);
        if (this._bg) this._bg.hide();

        if (!this.#options.tease) CABLES.UI.suggestions = null;
        gui.patchView.focus();
        this.#eleDialog.remove();
    }

    showSelect()
    {
        if (!this.#options.tease) CABLES.UI.suggestions = this;
        if (this.#cb) this.#cb();
        else this.close();
    }

    show()
    {
        if (!this.#options.tease) CABLES.UI.suggestions = this;
        ele.show(this.#eleDialog);
    }

    hide()
    {
        ele.hide(this.#eleDialog);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPos(x, y)
    {
        this.#eleDialog.style.left = x + "px";
        this.#eleDialog.style.top = y + "px";
    }

    action(id)
    {
        this.close();
        this.#action(id);
    }
}
