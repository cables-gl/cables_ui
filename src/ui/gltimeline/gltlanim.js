import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";
import glTlKeys from "./gltlkeys.js";

export default class glTlAnim extends Events
{
    constructor(glTl, anim, op, port)
    {
        super();
        this._anim = anim;
        this._glTl = glTl;

        this._glRectBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectBg.setSize(1000, 30);
        this._glRectBg.setColor(0, 0, 0, 1);

        this._glRectKeysBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectKeysBg.setSize(1000, 30);
        this._glRectKeysBg.setColor(0.2, 0.2, 0.2, 1);
        this._glRectKeysBg.setPosition(150, 0);
        this._glRectKeysBg.setParent(this._glRectBg);

        this._glTitle = new GlText(this._glTl.texts, op.name + " - " + port.name || "unknown anim");
        this._glTitle.setParentRect(this._glRectBg);

        this.keys = new glTlKeys(glTl, anim, this._glRectKeysBg);
        this._op = op;
        this._port = port;

        console.log(anim);

        // op.on("uiParamPanel", () =>
        // {
        //     if (gui.patchView.isCurrentOp(this.op))
        //     {
        //         this._glTitle.setColor(1, 0, 0, 1);
        //     }
        // });


        anim.on("onChange", () =>
        {
            this.keys.init();
        });

        this.updateColor();
    }

    update()
    {
        this.updateColor();
    }

    updateColor()
    {
        this._glTitle.setColor(1, 1, 1, 1);
        this._glRectKeysBg.setColor(0.3, 0.3, 0.3, 1);

        if (gui.patchView.isCurrentOp(this._op))
        {
            this._glTitle.setColor(0.5, 1, 1, 1);
            this._glRectKeysBg.setColor(0.4, 0.4, 0.4, 1);
        }
    }

    setIndex(i)
    {
        this._glRectBg.setPosition(0, i * 31 + 50);
    }
}
