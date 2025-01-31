import { Events, Logger } from "cables-shared-client";
import GlTextWriter from "../gldraw/gltextwriter.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import glTlAnim from "./gltlanim.js";
import glTlRuler from "./gltlruler.js";
import { gui } from "../gui.js";
import glTlScroll from "./gltlscroll.js";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";

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
    #rects = null;

    /** @type {glTlRuler} */
    ruler = null;

    /** @type {glTlScroll} */
    scroll = null;

    /** @type {Array<glTlAnim>} */
    #tlAnims = [];

    /** @type {GlRect} */
    #glRectCursor;

    fps = 30;
    duration = 120;
    bpm = 120;
    displayUnits = "Seconds";

    /** @type {GlText} */
    #textTimeS;

    /** @type {GlText} */
    #textTimeF;

    titleSpace = 150;

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

        this.#rects = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.ruler = new glTlRuler(this);

        this.scroll = new glTlScroll(this);

        this.#glRectCursor = this.#rects.createRect({ "draggable": true, "interactive": true });
        this.#glRectCursor.setSize(1, cgl.canvasHeight);
        this.#glRectCursor.setColor(0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1);
        this.#glRectCursor.setPosition(0, 0);

        this.#textTimeS = new GlText(this.texts, "time");
        this.#textTimeS.setPosition(10, 0);

        this.#textTimeF = new GlText(this.texts, "frames");
        this.#textTimeF.setPosition(10, 20);

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

        gui.corePatch().on("timelineConfigChange", this.onConfig.bind(this));
        this.updateAllElements();
    }

    get rects()
    {
        return this.#rects;
    }

    get offset()
    {
        if (!this.ruler) return 0;
        return this.ruler.offset;
    }

    resize()
    {
        this.scroll.setWidth(this.#cgl.canvasWidth - this.titleSpace);
        this.ruler.setWidth(this.#cgl.canvasWidth - this.titleSpace);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].setWidth(this.#cgl.canvasWidth);
        this.updateAllElements();
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseMove(e)
    {
        this.emitEvent("mousemove", e);

        let x = e.offsetX;
        let y = e.offsetY;
        this.#rects.mouseMove(x, y, e.buttons, e);

        if (e.buttons == 1)
        {
            gui.corePatch().timer.setTime(this.pixelToTime(e.offsetX - this.titleSpace) + this.offset);
            this.updateAllElements();
        }
        else
        if (e.buttons == 2)
        {
            this.ruler.scroll(-1 * this.pixelToTime(e.movementX));
            this.updateAllElements();
        }

    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseDown(e)
    {
        if (!e.pointerType) return;

        try { this.#cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        this.emitEvent("mousedown", e);
        this.#rects.mouseDown(e);
        this.mouseDown = true;
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseUp(e)
    {
        this.#rects.mouseUp(e);
        this.mouseDown = false;
    }

    _onCanvasWheel(event)
    {
        let delta = 0;
        if (event.deltaY > 0)delta = 1.1;
        else delta = 0.9;

        this.#zoom *= delta;
        this.#zoom = CABLES.clamp(this.#zoom, 0.1, 10000000);

        this.pixelPerSecond = this.timeToPixel(1);
        this.updateAllElements();
    }

    get width()
    {
        return this.#cgl.canvasWidth;
    }

    /**
     * @param {number} t
     */
    timeToPixelScreen(t)
    {
        return this.timeToPixel(t) + this.titleSpace - this.timeToPixel(this.offset);
    }

    /**
     * @param {number} t
     */
    timeToPixel(t)
    {
        return t * this.#zoom * 12;
    }

    /**
     * @param {number} x
     */
    pixelToTime(x)
    {
        return x / this.timeToPixel(1);
    }

    /**
     * @param {number} x
     */
    pixelScreenToTime(x)
    {
        return this.pixelToTime(x - this.titleSpace);
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

        this.scroll.setPosition(this.titleSpace, posy);
        posy += this.scroll.height;

        this.ruler.setPosition(this.titleSpace, posy);
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
        this.udpateCursor();
        this.#cgl.gl.clearColor(0.2, 0.2, 0.2, 1);
        this.#cgl.gl.clear(this.#cgl.gl.COLOR_BUFFER_BIT | this.#cgl.gl.DEPTH_BUFFER_BIT);

        this.#cgl.pushDepthTest(true);

        this.#rects.render(resX, resY, -1, 1, resX / 2);
        this.texts.render(resX, resY, -1, 1, resX / 2);

        this.#cgl.popDepthTest();
    }

    udpateCursor()
    {
        this.#glRectCursor.setPosition(this.timeToPixelScreen(gui.corePatch().timer.getTime()), 0, -0.3);

        let s = "" + Math.round(gui.corePatch().timer.getTime() * 1000) / 1000;
        const parts = s.split(".");
        parts[1] = parts[1] || "000";
        while (parts[1].length < 3)parts[1] += "0";
        this.#textTimeS.text = parts[0] + "." + parts[1] + " seconds";
        this.#textTimeF.text = Math.floor(gui.corePatch().timer.getTime() * this.fps) + "f";

    }

    updateAllElements()
    {
        this.ruler.update();
        this.scroll.update();
        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].update();
        this.#glRectCursor.setSize(1, this.#cgl.canvasHeight);
        this.udpateCursor();

    }

    onConfig(cfg)
    {
        this.fps = cfg.fps;
        this.duration = cfg.duration;
        this.bpm = cfg.bpm;
        this.displayUnits = cfg.displayUnits;
        this.updateAllElements();
    }
}
