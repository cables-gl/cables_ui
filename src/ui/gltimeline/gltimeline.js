import { Events } from "cables-shared-client";
import GlTextWriter from "../gldraw/gltextwriter.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import glTlAnim from "./gltlanim.js";
import glTlRuler from "./gltlruler.js";
import { gui } from "../gui.js";
import glTlScroll from "./gltlscroll.js";

/**
 * gl timeline
 *
 * @export
 * @class GlTimeline
 * @extends {Events}
 */
export default class GlTimeline extends Events
{

    /** @type {Array<glTlAnim>} */
    #tlAnims = [];

    /**
     * @param {CABLES.CGState} cgl
     */
    constructor(cgl)
    {
        super();
        this._zoom = 20;
        this.isAnimated = false;
        this.paused = false;
        this.cgl = cgl;

        /**
         * @type {GlTextWriter}
         */
        this.texts = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });

        this.rects = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.ruler = new glTlRuler(this);

        this.scroll = new glTlScroll(this);

        this._canvasMouseDown = false;
        this.init();

        gui.on("opSelectChange", () =>
        {
            for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].update();
        });

        cgl.canvas.addEventListener("pointermove", this._onCanvasMouseMove.bind(this), { "passive": false });
        cgl.canvas.addEventListener("pointerup", this._onCanvasMouseUp.bind(this), { "passive": false });
        cgl.canvas.addEventListener("pointerdown", this._onCanvasMouseDown.bind(this), { "passive": false });
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this), { "passive": true });
    }

    _onCanvasMouseMove(e)
    {
        this.emitEvent("mousemove", e);

        let x = e.offsetX;
        let y = e.offsetY;
        this.rects.mouseMove(x, y, this.mouseDown ? 1 : 0);
        if (this.mouseDown)
        {

            /*
             * console.log("drag", x);s
             * this.rects.mouseDrag(x, y);
             */
        }
    }

    _onCanvasMouseDown(e)
    {
        if (!e.pointerType) return;

        try { this._cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        this.emitEvent("mousedown", e);
        this.rects.mouseDown(e);
        this.mouseDown = true;
    }

    _onCanvasMouseUp(e)
    {
        this.rects.mouseUp(e);
        this.mouseDown = false;
    }

    _onCanvasWheel(event)
    {
        let delta = 0;
        if (event.deltaY > 0)delta = 1.1;
        else delta = 0.9;

        this._zoom *= delta;
        this._zoom = CABLES.clamp(this._zoom, 0.1, 10000000);
        console.log("zoom", this._zoom, this.timeToPixel(1));
        this.ruler.update();
        this.scroll.update();
    }

    get offsetSeconds()
    {
        return 0;
    }

    get width()
    {
        return this.cgl.canvasWidth;
    }

    pixelToTime()
    {

    }

    timeToPixel(t)
    {
        return t * this._zoom * 12;
    }

    init()
    {
        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].dispose();
        this.#tlAnims = [];

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
                    this.#tlAnims.push(a);
                    // a.setIndex(count);
                    count++;
                }
            }
        }
        this.setPositions();
    }

    setPositions()
    {
        let posy = 0;

        this.scroll.setPosition(0, posy);
        posy += this.scroll.height;

        this.ruler.setPosition(0, posy);
        posy += this.ruler.height;

        for (let i = 0; i < this.#tlAnims.length; i++)
        {
            this.#tlAnims[i].setPosition(0, posy);
            posy += this.#tlAnims[i].height;
        }

    }

    dispose()
    {

    }

    updateSize()
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
