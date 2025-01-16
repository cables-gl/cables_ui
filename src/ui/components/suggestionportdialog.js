import defaultOps from "../defaultops.js";
import { gui } from "../gui.js";
import SuggestionDialog from "./suggestiondialog.js";

/**
 * show suggestions for linking a port
 *
 * @export
 * @class SuggestPortDialog
 */
export default class SuggestPortDialog
{
    constructor(op, port, mouseEvent, cb, cbCancel)
    {
        this._suggestions = [];

        // linkRecommendations
        for (let i = 0; i < op.portsIn.length; i++)
        {
            const theport = op.portsIn[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&

                CABLES.Link.canLink(theport, port))
            {
                this._addPort(theport);
            }
        }

        for (let i = 0; i < op.portsOut.length; i++)
        {
            const theport = op.portsOut[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                CABLES.Link.canLink(theport, port)) this._addPort(theport);
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

    _addPort(p)
    {
        for (let i = 0; i < this._suggestions.length; i++)
            if (this._suggestions[i].p == p) return;


        let className = "portSuggest" + p.type;
        if (p.isLinked()) className += "Linked";

        this._suggestions.push({
            "class": className,
            "p": p,
            "op": p.op.id,
            "name": p.title,
            // "isLinked": p.isLinked(),
            "isBoundToVar": p.isBoundToVar(),
            "isAnimated": p.isAnimated()
        });
    }
}
