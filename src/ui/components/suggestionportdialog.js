import { Link, Op, Port } from "cables";
import defaultOps from "../defaultops.js";
import { gui } from "../gui.js";
import SuggestionDialog from "./suggestiondialog.js";
import { getConverters } from "./converterops.js";

/**
 * show suggestions for linking a port
 *
 * @export
 * @class SuggestPortDialog
 */
export default class SuggestPortDialog
{

    /**
     * Description
     * @param {Op} op
     * @param {Port} port
     * @param {MouseEvent} mouseEvent
     * @param {Function} cb
     * @param {Function} [cbCancel]
     */
    constructor(op, port, mouseEvent, cb, cbCancel)
    {

        /** @type {import("./suggestiondialog.js").SuggestionItem[]} */
        this._suggestions = [];

        // linkRecommendations
        for (let i = 0; i < op.portsIn.length; i++)
        {
            const theport = op.portsIn[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                theport.direction != port.direction
            ) this.#addPort(theport, Link.canLink(theport, port), getConverters(theport, port).length > 0);
        }

        for (let i = 0; i < op.portsOut.length; i++)
        {
            const theport = op.portsOut[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                theport.direction != port.direction
                // Link.canLink(theport, port)
            ) this.#addPort(theport, Link.canLink(theport, port), getConverters(theport, port).length > 0);
            // else
            // {
            //     const convs = getConverters(theport, port);
            //     if()
            //     console.log("text", convs);
            //     this.#addPortConv(theport);
            // }
        }

        if (op.objName == defaultOps.defaultOpNames.subPatchInput2 || op.objName == defaultOps.defaultOpNames.subPatchOutput2)
        {
            op = gui.patchView.getSubPatchOuterOp(op.uiAttribs.subPatch);
        }

        if (op.isSubPatchOp())
        {
            this._suggestions.push({
                "p": null,
                "op": op,
                "name": "create SubPatch Port",
                "createSpOpPort": true
            });
        }

        new SuggestionDialog(this._suggestions, op, mouseEvent, cb, (id) =>
        {
            for (const i in this._suggestions)
                if (this._suggestions[i].id == id)
                {
                    cb(this._suggestions[i].p, this._suggestions[i].op, this._suggestions[i]);
                }
        }, false, cbCancel);
    }

    /**
     * @param {Port} p
     * @param {boolean} directLink
     * @param {boolean} converter
     */
    #addPort(p, directLink, converter)
    {
        if (!directLink && !converter) return;

        for (let i = 0; i < this._suggestions.length; i++)
            if (this._suggestions[i].p == p) return;

        let className = "portSuggest" + p.type;
        if (p.isLinked()) className += "Linked";
        let name = "";
        if (converter)name += "♻ ";

        className = "port_text_color_" + p.getTypeString().toLowerCase();

        name += p.title;
        this._suggestions.push({
            "class": className,
            "p": p,
            "op": p.op.id,
            "name": name,
            // "isLinked": p.isLinked(),
            "isBoundToVar": p.isBoundToVar(),
            "isAnimated": p.isAnimated()
        });
    }

}
