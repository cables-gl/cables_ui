import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";

export default class glTlRuler extends Events
{
    constructor(glTl)
    {
        super();
        this._glTl = glTl;

        this._glRectBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectBg.setSize(1000, 50);
        this._glRectBg.setColor(0.3, 0.3, 0.3, 1);

        this.marks = [];
        for (let i = 0; i < 100; i++)
        {
            const mr = this._glTl.rects.createRect({ "draggable": false });
            mr.setColor(1, 1, 1, 1);
            mr.setSize(1, 20);
            mr.setPosition(i * 8, 0);

            this.marks.push(mr);
        }
    }
}
