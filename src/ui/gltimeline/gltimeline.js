import { Events, Logger } from "cables-shared-client";
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

    /** @type {GlTextWriter} */
    texts = null;

    /** @type {GlRectInstancer} */
    rects = null;

    /** @type {glTlRuler} */
    ruler = null;

    /** @type {glTlScroll} */
    scroll = null;

    /** @type {Array<glTlAnim>} */
    #tlAnims = [];

    #zoom = 20;
    #canvasMouseDown = false;
    #paused = false;
    #cgl = null;
    #isAnimated = false;

    /**
     * @param {CABLES.CGState} cgl
    */
    constructor(cgl)
    {
        super();

        this._log = new Logger("gltimeline");

        this.#cgl = cgl;

        this.texts = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });

        this.rects = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.ruler = new glTlRuler(this);

        this.scroll = new glTlScroll(this);

        this.init();

        gui.on("opSelectChange", () =>
        {
            for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].update();
        });

        cgl.canvas.addEventListener("pointermove", this._onCanvasMouseMove.bind(this), { "passive": false });
        cgl.canvas.addEventListener("pointerup", this._onCanvasMouseUp.bind(this), { "passive": false });
        cgl.canvas.addEventListener("pointerdown", this._onCanvasMouseDown.bind(this), { "passive": false });
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this), { "passive": true });
        cgl.addEventListener("resize", this.resize.bind(this));
    }

    resize()
    {
        // console.log("resize.....");

        this.scroll.setWidth(this.#cgl.canvasWidth);
        this.ruler.setWidth(this.#cgl.canvasWidth);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].setWidth(this.#cgl.canvasWidth);

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

        try { this.#cgl.canvas.setPointerCapture(e.pointerId); }
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

        this.#zoom *= delta;
        this.#zoom = CABLES.clamp(this.#zoom, 0.1, 10000000);
        console.log("zoom", this.#zoom, this.timeToPixel(1));
        this.ruler.update();
        this.scroll.update();
    }

    get offsetSeconds()
    {
        return 0;
    }

    get width()
    {
        return this.#cgl.canvasWidth;
    }

    pixelToTime()
    {

    }

    timeToPixel(t)
    {
        return t * this.#zoom * 12;
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

    /**
     * @param {number} resX
     * @param {number} resY
     */
    render(resX, resY)
    {
        this.#cgl.gl.clearColor(0.2, 0.2, 0.2, 1);
        this.#cgl.gl.clear(this.#cgl.gl.COLOR_BUFFER_BIT | this.#cgl.gl.DEPTH_BUFFER_BIT);

        this.#cgl.pushDepthTest(false);

        this.rects.render(resX, resY, -1, 1, resX / 2);
        this.texts.render(resX, resY, -1, 1, resX / 2);

        this.#cgl.popDepthTest();
    }
}
