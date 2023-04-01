import defaultops from "../defaultops";
import SuggestionDialog from "./suggestiondialog";

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
                CABLES.Link.canLink(theport, port)) this._addPort(theport);
        }

        for (let i = 0; i < op.portsOut.length; i++)
        {
            const theport = op.portsOut[i];
            if (
                !theport.uiAttribs.hidePort &&
                !theport.uiAttribs.readOnly &&
                CABLES.Link.canLink(theport, port)) this._addPort(theport);
        }

        if (defaultops.isSubPatchOpName(op.objName))
        {
            const ports = gui.patchView.getSubPatchExposedPorts(op.patchId.get());
            for (let i = 0; i < ports.length; i++)
            {
                if (CABLES.Link.canLink(ports[i], port)) this._addPort(ports[i]);
            }
        }


        new SuggestionDialog(this._suggestions, op, mouseEvent, cb,
            (id) =>
            {
                for (const i in this._suggestions)
                    if (this._suggestions[i].id == id)
                    {
                        if (port.parent.uiAttribs.subPatch != this._suggestions[i].p.parent.uiAttribs.subPatch)
                        {
                            this._suggestions[i].p.setUiAttribs({ "expose": true });
                        }

                        cb(this._suggestions[i].p.name, this._suggestions[i].op);
                    }
            }, false, cbCancel);
    }

    _addPort(p)
    {
        const name = p.name;
        this._suggestions.push({
            "p": p,
            "op": p.parent.id,
            "name": p.title,
            "isLinked": p.isLinked(),
            "isBoundToVar": p.isBoundToVar(),
            "isAnimated": p.isAnimated()
        });
    }
}
