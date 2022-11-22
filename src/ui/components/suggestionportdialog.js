import SuggestionDialog from "./suggestiondialog";

export default class SuggestPortDialog
{
    constructor(op, port, mouseEvent, cb, cbCancel)
    {
        this._suggestions = [];

        // linkRecommendations
        for (let i = 0; i < op.portsIn.length; i++)
            if (CABLES.Link.canLink(op.portsIn[i], port))
                this._addPort(op.portsIn[i]);

        for (let i = 0; i < op.portsOut.length; i++)
            if (CABLES.Link.canLink(op.portsOut[i], port))
                this._addPort(op.portsOut[i]);

        new SuggestionDialog(this._suggestions, op, mouseEvent, cb,
            (id) =>
            {
                for (const i in this._suggestions)
                    if (this._suggestions[i].id == id)
                        cb(this._suggestions[i].p.name);
            }, false, cbCancel);
    }

    _addPort(p)
    {
        const name = p.name;
        this._suggestions.push({
            p,
            "name": p.title,
            "isLinked": p.isLinked(),
            "isBoundToVar": p.isBoundToVar(),
            "isAnimated": p.isAnimated()
        });
    }
}
