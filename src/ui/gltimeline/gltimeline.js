import { Events } from "cables-shared-client";
import GlTextWriter from "../gldraw/gltextwriter.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import glTlAnim from "./gltlanim.js";
import glTlRuler from "./gltlruler.js";

export default class GlTimeline extends Events
{
    constructor(cgl)
    {
        super();
        this.isAnimated = false;
        this.paused = false;
        this.cgl = cgl;

        this.texts = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });
        this.rects = new GlRectInstancer(cgl, { "name": "gltl rects" });

        this.ruler = new glTlRuler(this);
        this.tlAnims = [];

        // this.tlAnims = [new glTlAnim(this), new glTlAnim(this), new glTlAnim(this)];
        // for (let i = 0; i < this.tlAnims.length; i++)
        //     this.tlAnims[i].setIndex(i);

        this.init();

        gui.on("opSelectChange", () =>
        {
            for (let i = 0; i < this.tlAnims.length; i++) this.tlAnims[i].update();
        });
    }

    init()
    {
        for (let i = 0; i < this.tlAnims.length; i++) this.tlAnims[i].dispose();
        this.tlAnims = [];

        const p = gui.corePatch();
        let count = 0;
        for (let i = 0; i < p.ops.length; i++)
        {
            const op = p.ops[i];
            for (let j = 0; j < op.portsIn.length; j++)
            {
                if (op.portsIn[j].anim)
                {
                    console.log(op.portsIn[j].anim);
                    const a = new glTlAnim(this, op.portsIn[j].anim, op, op.portsIn[j]);
                    this.tlAnims.push(a);
                    a.setIndex(count);
                    count++;
                }
            }
        }
    }

    dispose()
    {

    }

    render(resX, resY)
    {
        this.cgl.gl.clearColor(0.2, 0.2, 0.2, 1);
        this.cgl.gl.clear(this.cgl.gl.COLOR_BUFFER_BIT | this.cgl.gl.DEPTH_BUFFER_BIT);

        this.cgl.pushDepthTest(false);

        this.rects.render(resX, resY, -1, 1, resX / 2);
        this.texts.render(resX, resY, -1, 1, resX / 2);

        this.cgl.popDepthTest();
    }
}
