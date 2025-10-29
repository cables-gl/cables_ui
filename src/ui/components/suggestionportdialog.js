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

    /** @type {import("./suggestiondialog.js").SuggestionItem[]} */
    #suggestions = [];

    /**
     * Description
     * @param {Op} op
     * @param {Port} port
     * @param {MouseEvent} mouseEvent
     * @param {Function} cb
     * @param {Function} [cbCancel]
     * @param {boolean} [useConverter]
     */
    constructor(op, port, mouseEvent, cb, cbCancel, useConverter)
    {

        // linkRecommendations
        for (let i = 0; i < op.portsIn.length; i++)
        {
            const theport = op.portsIn[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                !theport.uiAttribs.greyout &&
                theport.direction != port.direction
            ) this.#addPort(theport, Link.canLink(theport, port), useConverter && getConverters(theport, port).length > 0, port);
        }

        for (let i = 0; i < op.portsOut.length; i++)
        {
            const theport = op.portsOut[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                !theport.uiAttribs.greyout &&
                theport.direction != port.direction
                // Link.canLink(theport, port)
            ) this.#addPort(theport, Link.canLink(theport, port), useConverter && getConverters(theport, port).length > 0, port);

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
            this.#suggestions.push({
                "p": null,
                "op": op,
                "name": "create SubPatch Port",
                "createSpOpPort": true
            });
        }

        new SuggestionDialog(this.#suggestions, op, mouseEvent, (...args) =>
        {
            cb(...args);

        }, (id) =>
        {
            let found = false;
            for (const i in this.#suggestions)
            {
                if (this.#suggestions[i].id == id)
                {
                    cb(this.#suggestions[i].p, this.#suggestions[i].op, this.#suggestions[i], useConverter);
                    found = true;
                }
            }
            console.log("not found id........", id);
        }, false, cbCancel);
    }

    /**
     * @param {Port} p
     * @param {boolean} directLink
     * @param {boolean} converter
     * @param {Port} otherPort
     */
    #addPort(p, directLink, converter, otherPort)
    {
        if (!directLink && !converter) return;

        for (let i = 0; i < this.#suggestions.length; i++)
            if (this.#suggestions[i].p == p) return;

        let className = "portSuggest" + p.type;

        if (p.isLinked()) className += "Linked";
        let name = "";
        if (converter)name +=
         "<span style=\"pointer-events:none\" class=\"" + "port_text_color_" + otherPort.getTypeString().toLowerCase() + "\">▐ →</span> " +
         "<span style=\"pointer-events:none\" class=\"" + "port_text_color_" + p.getTypeString().toLowerCase() + "\">▌</span>";

        className = "port_text_color_" + p.getTypeString().toLowerCase();

        name += p.title;
        this.#suggestions.push({
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
