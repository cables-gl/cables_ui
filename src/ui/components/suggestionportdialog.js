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
    constructor(op, port, mouseEvent, cb, cbCancel, useConverter, forceConverter)
    {
        let countConv = 0;
        const types = {};
        for (let kk = 0; kk < 2; kk++)
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
                )
                {
                    if (kk == 1)
                        this.#addPort(theport, Link.canLink(theport, port), useConverter && getConverters(theport, port).length > 0, port);
                    if (!forceConverter && port.type != theport.type)
                    {
                        types[theport.type] = true;
                        countConv++;
                    }

                }
            }

            for (let i = 0; i < op.portsOut.length; i++)
            {
                const theport = op.portsOut[i];
                console.log(getConverters(theport, port));
                if (
                    !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                !theport.uiAttribs.greyout &&
                theport.direction != port.direction
                )
                {
                    if (kk == 1)
                        this.#addPort(theport, Link.canLink(theport, port), useConverter && getConverters(theport, port).length > 0, port);
                    if (!forceConverter && port.type != theport.type)
                    {
                        types[theport.type] = true;
                        countConv++;
                    }
                }

            }
            if (kk == 0 && countConv > 3)
            {
                let str = "";
                for (const ty in types)
                    str += "<span style=\"pointer-events:none\" class=\"" + "port_text_color_" + Port.getTypeString(ty).toLowerCase() + "\">▐ </span> ";

                this.#suggestions.push({
                    "class": "",
                    "spacing": 10,
                    "name": str + " ⇆ insert converter op"
                });
                useConverter = false;
            }
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
                    found = true;
                    if (!this.#suggestions[i].op)
                    {
                        console.log("joooooooooo");

                        new SuggestPortDialog(op, port, mouseEvent, cb, cbCancel, true, true);
                    }
                    else
                    {
                        cb(this.#suggestions[i].p, this.#suggestions[i].op, this.#suggestions[i], useConverter);
                    }
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

        let pInput = p;
        let pOutput = otherPort;
        if (pInput.direction == Port.DIR_OUT)
        {
            pInput = otherPort;
            pOutput = p;
        }

        let className = "portSuggest" + p.type;

        if (p.isLinked()) className += "Linked";
        let name = p.title;
        if (converter)name =
         "<span style=\"pointer-events:none\" class=\"" + "port_text_color_" + pOutput.getTypeString().toLowerCase() + "\">▐ " + pOutput.title + "</span><span style=\"color:#bbbbbb;\"> →</span> " +
         "<span style=\"pointer-events:none\" class=\"" + "port_text_color_" + pInput.getTypeString().toLowerCase() + "\">▌" + pInput.title + "</span>";

        className = "port_text_color_" + p.getTypeString().toLowerCase();

        let spacing = 0;
        if (!this.lastPort || this.lastPort.uiAttribs.group != p.uiAttribs.group)
        {

            if (p.uiAttribs.group)
            {
                this.#suggestions.push({ "name": p.uiAttribs.group, "class": "groupname" });

            }
            else
            if (this.lastPort)
                spacing = 8;
        }
        this.lastPort = p;

        this.#suggestions.push({
            "class": className,
            "p": p,
            "spacing": spacing,
            "op": p.op.id,
            "name": name,
            // "isLinked": p.isLinked(),
            "isBoundToVar": p.isBoundToVar(),
            "isAnimated": p.isAnimated()
        });
    }

}
