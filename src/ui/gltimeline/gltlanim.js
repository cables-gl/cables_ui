import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";

export default class glTlAnim extends Events
{
    constructor(glTl, anim)
    {
        super();
        this._anim = anim;
        this._glTl = glTl;


        this._glRectBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectBg.setSize(1000, 30);
        this._glRectBg.setColor(0, 0, 0, 1);
        // this._glRectBg.setBorder(1);

        this._glTitle = new GlText(this._glTl.texts, "hello anim");
        this._glTitle.setParentRect(this._glRectBg);
    }

    setIndex(i)
    {
        this._glRectBg.setPosition(0, i * 31);
    }
}
