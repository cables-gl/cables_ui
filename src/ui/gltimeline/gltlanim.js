import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";
import glTlKeys from "./gltlkeys.js";

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

        this._glRectKeysBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectKeysBg.setSize(1000, 30);
        this._glRectKeysBg.setColor(0.5, 0.5, 0.5, 1);
        this._glRectKeysBg.setPosition(100, 0);
        this._glRectKeysBg.setParent(this._glRectBg);


        // this._glRectBg.setBorder(1);

        this._glTitle = new GlText(this._glTl.texts, anim.name || "unknown anim");
        this._glTitle.setParentRect(this._glRectBg);

        this.keys = new glTlKeys(glTl, anim, this._glRectKeysBg);

        anim.on("onChange", () =>
        {
            this.keys.init();
        });
    }

    setIndex(i)
    {
        this._glRectBg.setPosition(0, i * 31 + 50);
    }
}
