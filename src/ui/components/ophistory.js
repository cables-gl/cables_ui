import { Events } from "cables-shared-client";
import { gui } from "../gui.js";

export default class OpHistory extends Events
{
    constructor()
    {
        super();
        this._history = [];
        this._position = this._history.length - 1;
    }

    push(opid)
    {
        if (this._history[this._position] == opid) return;
        if (this._position != this._history.length - 1 && this._position > 0) this._history.length = this._position;

        this._history.push(opid);
        this._position = this._history.length - 1;

        this.emitEvent("changed");
    }

    back()
    {
        this._position--;
        let opid = this._history[this._position];

        if (gui.patchView.isCurrentOpId(opid))
        {
            this._position--;
            opid = this._history[this._position];
        }
        this._focusCurrent();
    }

    _focusCurrent()
    {
        const opid = this._history[this._position];

        if (!gui.keys.shiftKey) gui.patchView.focusOp(opid, true); else gui.patchView.setSelectedOpById(opid);
    }

    forward()
    {
        if (this._position + 1 > this._history.length - 1) return;
        this._position++;
        this._focusCurrent();
    }

    getAsArray(max)
    {
        if (max === undefined)max = 9999;
        const h = [];
        const start = Math.max(0, this._history.length - max);
        const end = this._history.length - 1;

        for (let i = end; i >= start; i--)
        {
            const idx = i;
            const op = gui.corePatch().getOpById(this._history[idx]);
            if (!op) continue;
            const o =
                {
                    "id": this._history[idx],
                    "title": op.uiAttribs.title
                };
            h.push(o);
        }
        return h;
    }
}
