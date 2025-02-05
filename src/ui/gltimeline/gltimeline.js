import { Events, Logger } from "cables-shared-client";
import GlTextWriter from "../gldraw/gltextwriter.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import glTlAnim from "./gltlanimline.js";
import glTlRuler from "./gltlruler.js";
import { gui } from "../gui.js";
import glTlScroll from "./gltlscroll.js";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";
import GlTlView from "./gltlview.js";
import GlSplineDrawer from "../gldraw/glsplinedrawer.js";
import { userSettings } from "../components/usersettings.js";

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

    /** @type {GlSplineDrawer} */
    splines;

    /** @type {GlRectInstancer} */
    #rects = null;

    /** @type {GlRectInstancer} */
    #rectsOver = null;

    /** @type {glTlRuler} */
    ruler = null;

    /** @type {glTlScroll} */
    scroll = null;

    /** @type {Array<glTlAnim>} */
    #tlAnims = [];

    /** @type {GlRect} */
    #glRectCursor;

    duration = 120;

    displayUnits = "Seconds";

    /** @type {GlText} */
    #textTimeS;

    /** @type {GlText} */
    #textTimeF;

    /** @type {GlText} */
    #textTimeB;

    /** @type {GlRect} */
    #timeBg;

    /** @type {GlRect} */
    #rectSelect;

    titleSpace = 150;

    /** @type {GlTlView} */
    view = null;

    #layout = 0;

    #selectedKeys = [];

    #canvasMouseDown = false;
    #paused = false;
    #cgl = null;
    #isAnimated = false;
    buttonForScrolling = 2;
    cfg = {
        "fps": 30,
        "bpm": 180,
        "fadeInFrames": true,
        "showBeats": true,
        "displayUnits": "Seconds",
        "restrictToFrames": true
    };

    #selOpsStr;
    #lastXnoButton;
    #lastYnoButton;

    selectRect = null;
    #selectedKeyAnims = [];

    /**
     * @param {CABLES.CGState} cgl
    */
    constructor(cgl)
    {
        super();

        this._log = new Logger("gltimeline");

        this.#cgl = cgl;
        this.view = new GlTlView(this);

        this.texts = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });
        this.#rects = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.#rectsOver = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.ruler = new glTlRuler(this);
        this.scroll = new glTlScroll(this);

        this.#glRectCursor = this.#rects.createRect({ "draggable": true, "interactive": true });
        this.#glRectCursor.setSize(1, cgl.canvasHeight);
        this.#glRectCursor.setPosition(0, 0);
        this.setColorRectSpecial(this.#glRectCursor);

        this.#timeBg = this.#rects.createRect({ });
        this.#timeBg.setSize(this.titleSpace, this.ruler.height + this.scroll.height);
        this.#timeBg.setColor(0.15, 0.15, 0.15, 1);
        this.#timeBg.setPosition(0, 0, -0.5);

        this.#textTimeS = new GlText(this.texts, "time");
        this.#textTimeS.setPosition(10, this.ruler.y, -0.5);
        this.setColorRectSpecial(this.#textTimeS);

        this.#textTimeF = new GlText(this.texts, "frames");
        this.#textTimeF.setPosition(10, this.ruler.y + 17, -0.5);
        this.setColorRectSpecial(this.#textTimeF);

        this.#textTimeB = new GlText(this.texts, "");
        this.#textTimeB.setPosition(10, this.ruler.y - 17, -0.5);
        this.setColorRectSpecial(this.#textTimeB);

        gui.corePatch().timer.on("playPause", () =>
        {
            gui.corePatch().timer.setTime(this.snapTime(gui.corePatch().timer.getTime()));
        });
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

        gui.corePatch().on("onOpDelete", () => { this.init(); });
        gui.corePatch().on("onOpAdd", () => { this.init(); });
        gui.corePatch().on("portAnimToggle", () => { this.init(); });

        this.updateAllElements();

        gui.keys.key("c", "Center cursor", "down", cgl.canvas.id, {}, (e) =>
        {
            this.view.centerCursor();
        });

        gui.keys.key("j", "Go to previous keyframe", "down", cgl.canvas.id, {}, (e) =>
        {
            this.jumpKey(-1);
        });
        gui.keys.key("k", "Go to next keyframe", "down", cgl.canvas.id, {}, (e) =>
        {
            this.jumpKey(1);
        });

        gui.keys.key("delete", "delete", "down", cgl.canvas.id, {}, (e) =>
        {
            this.deleteSelectedKeys();
        });

        gui.patchView.patchRenderer.on("selectedOpsChanged", () =>
        {
            let selops = gui.patchView.getSelectedOps();
            let selOpsStr = "";
            for (let i = 0; i < selops.length; i++) selOpsStr += selops[i].opId;

            this.updateAllElements();
            if (this.#layout == 1 && selOpsStr != this.#selOpsStr)
            {
                this.init();
                this.#selOpsStr = selOpsStr;
            }
        });

        this.#rectSelect = this.#rectsOver.createRect({ "draggable": true, "interactive": true });
        this.#rectSelect.setSize(0, 0);
        this.#rectSelect.setPosition(0, 0, -0.9);
        this.#rectSelect.setColor(gui.theme.colors_patch.patchSelectionArea);

        this._initUserPrefs();

    }

    _initUserPrefs()
    {
        const userSettingScrollButton = userSettings.get("patch_button_scroll");
        this.buttonForScrolling = userSettingScrollButton;
    }

    /** @returns {number} */
    get bpm()
    {
        return this.cfg.bpm;
    }

    /** @returns {number} */
    get fps()
    {
        return this.cfg.fps;
    }

    get rects()
    {
        return this.#rects;
    }

    get isAnimated()
    {
        return !this.view.animsFinished;
    }

    get cursorTime()
    {
        return gui.corePatch().timer.getTime();
    }

    resize()
    {
        this.scroll.setWidth(this.#cgl.canvasWidth - this.titleSpace);
        this.ruler.setWidth(this.#cgl.canvasWidth - this.titleSpace);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].setWidth(this.#cgl.canvasWidth);
        this.updateAllElements();
    }

    snapTime(t)
    {
        if (this.cfg.restrictToFrames) t = Math.floor(t * this.fps) / this.fps;
        return t;
    }

    toggleGraphLayout()
    {
        if (this.#layout == 1) this.#layout = 0;
        else this.#layout = 1;

        this.init();
    }

    setColorRectSpecial(r)
    {
        if (r)
            r.setColor(0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1);
    }

    setMaxTitleSpace(w)
    {
        if (w > this.titleSpace)
        {
            this.titleSpace = w;
            this.#timeBg.setSize(this.titleSpace, this.ruler.height + this.scroll.height);
            this.updateAllElements();
        }
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

            if (y > this.getFirstLinePosy())
            {

                // if (this.selectRect == null) // when beginning to draw selection area
                this.unSelectAllKeys();

                this.selectRect = {
                    "x": Math.min(this.#lastXnoButton, x),
                    "y": Math.min(this.#lastYnoButton, y),
                    "x2": Math.max(this.#lastXnoButton, x),
                    "y2": Math.max(this.#lastYnoButton, y) };

                this.#rectSelect.setPosition(this.#lastXnoButton, this.#lastYnoButton, -1);
                this.#rectSelect.setSize(x - this.#lastXnoButton, y - this.#lastYnoButton);
            }
            if (y < this.getFirstLinePosy())
            {
                gui.corePatch().timer.setTime(this.snapTime(this.view.pixelToTime(e.offsetX - this.titleSpace) + this.view.offset));
            }

            this.updateAllElements();
        }
        else
        if (e.buttons == this.buttonForScrolling)
        {
            this.view.scroll(-25 * this.view.pixelToTime(e.movementX));
            this.updateAllElements();
        }
        else
        {
            this.#lastXnoButton = x;
            this.#lastYnoButton = y;
        }
    }

    unSelectAllKeys()
    {
        this.#selectedKeys = [];
        this.#selectedKeyAnims = [];
    }

    isKeySelected(k)
    {
        return this.#selectedKeys.indexOf(k) != -1;
    }

    getKeysSmallestTime(keys)
    {
        let minTime = 9999999;
        for (let i = 0; i < keys.length; i++)
        {
            minTime = Math.min(minTime, keys[i].time);
        }

        return minTime;

    }

    moveSelectedKeys(time)
    {
        if (time === undefined)time = this.cursorTime;
        let minTime = time - this.getKeysSmallestTime(this.#selectedKeys);
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeys[i].set({ "time": this.#selectedKeys[i].time + minTime });
        }
        this.updateAllElements();

    }

    deleteSelectedKeys()
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
            this.#selectedKeyAnims[i].remove(this.#selectedKeys[i]);

        this.unSelectAllKeys();
    }

    selectKey(k, a)
    {
        if (!this.isKeySelected(k))
        {
            this.#selectedKeys.push(k);
            this.#selectedKeyAnims.push(a);
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
        this.selectRect = null;
        this.#rectSelect.setSize(0, 0);

    }

    _onCanvasWheel(event)
    {

        if (event.metaKey)
        {
            this.view.scroll(event.deltaY * 0.002);
        }
        else
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX))
        {
            let delta = 0;
            if (event.deltaY < 0)delta = 1.1;
            else delta = 0.9;

            this.view.setZoomOffset(delta);
        }
        else
        {
            this.view.scroll(event.deltaX * 0.01);
        }

        this.pixelPerSecond = this.view.timeToPixel(1);
        this.updateAllElements();
    }

    get width()
    {
        return this.#cgl.canvasWidth;
    }

    init()
    {
        const perf = gui.uiProfiler.start("[gltimeline] init");

        this.splines = new GlSplineDrawer(this.#cgl, "gltlSplines_0");
        this.splines.setWidth(2);
        this.splines.setFadeout(false);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].dispose();
        this.#tlAnims = [];

        const p = gui.corePatch();
        let ops = p.ops;
        let count = 0;
        const ports = [];

        let selops = gui.patchView.getSelectedOps();
        if (this.#layout == 1 && selops.length > 0)
        {
            ops = selops;
        }
        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            for (let j = 0; j < op.portsIn.length; j++)
            {
                if (op.portsIn[j].anim)
                {
                    ports.push(op.portsIn[j]);

                    if (this.#layout === 0)
                    {
                        const a = new glTlAnim(this, [op.portsIn[j]]);
                        this.#tlAnims.push(a);
                    }
                    count++;
                }
            }
        }

        if (this.#layout === 1)
        {
            const multiAnim = new glTlAnim(this, ports, { "keyYpos": true, "multiAnims": true });
            multiAnim.setHeight(400);
            multiAnim.setPosition(0, this.getFirstLinePosy());
            this.#tlAnims.push(multiAnim);
        }

        this.updateAllElements();
        this.setPositions();
        this.resize();

        perf.finish();

    }

    getFirstLinePosy()
    {
        let posy = 0;

        this.scroll.setPosition(this.titleSpace, posy);
        posy += this.scroll.height;

        this.ruler.setPosition(this.titleSpace, posy);
        posy += this.ruler.height;
        return posy;
    }

    setPositions()
    {
        let posy = this.getFirstLinePosy();

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
        this.setPositions();
        this.updateAllElements();
    }

    /**
     * @param {number} resX
     * @param {number} resY
     */
    render(resX, resY)
    {
        this.view.updateAnims();

        if (!this.view.animsFinished) this.updateAllElements();

        this.udpateCursor();
        this.#cgl.gl.clearColor(0.2, 0.2, 0.2, 1);
        this.#cgl.gl.clear(this.#cgl.gl.COLOR_BUFFER_BIT | this.#cgl.gl.DEPTH_BUFFER_BIT);

        this.#cgl.pushDepthTest(true);

        this.#rects.render(resX, resY, -1, 1, resX / 2);
        this.texts.render(resX, resY, -1, 1, resX / 2);
        this.splines.render(resX, resY, -1, 1, resX / 2, this.#lastXnoButton, this.#lastYnoButton);
        this.#rectsOver.render(resX, resY, -1, 1, resX / 2);

        this.#cgl.popDepthTest();
    }

    udpateCursor()
    {
        this.#glRectCursor.setPosition(this.view.timeToPixelScreen(this.cursorTime), 0, -0.3);

        let s = "" + Math.round(this.cursorTime * 1000) / 1000;
        const parts = s.split(".");
        parts[1] = parts[1] || "000";
        while (parts[1].length < 3)parts[1] += "0";
        this.#textTimeS.text = "second " + parts[0] + "." + parts[1];
        this.#textTimeF.text = "frame " + Math.floor(this.cursorTime * this.fps);

        if (this.cfg.showBeats)
            this.#textTimeB.text = "beat " + Math.floor(this.cursorTime * (this.bpm / 60));
    }

    updateAllElements()
    {
        const perf = gui.uiProfiler.start("[gltimeline] udpateAllElements");

        this.ruler.update();
        this.scroll.update();
        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].update();
        this.#glRectCursor.setSize(1, this.#cgl.canvasHeight);
        this.udpateCursor();

        perf.finish();
    }

    onConfig(cfg)
    {
        this.cfg = cfg;
        this.duration = cfg.duration;
        this.displayUnits = cfg.displayUnits;
        this.updateAllElements();
    }

    /**
     * @param {number} dir 1 or -1
     */
    jumpKey(dir)
    {
        let theKey = null;

        for (let anii = 0; anii < this.#tlAnims.length; anii++)
        {
            for (let ans = 0; ans < this.#tlAnims[anii].anims.length; ans++)
            {
                const anim = this.#tlAnims[anii].anims[ans];
                const index = 0;

                for (let ik = 0; ik < anim.keys.length; ik++)
                {
                    if (ik < 0) continue;
                    let newIndex = ik;

                    if (anim.keys[newIndex].time != this.view.cursorTime)
                    {

                        if (dir == 1 && anim.keys[newIndex].time > this.view.cursorTime)
                        {
                            if (!theKey)theKey = anim.keys[newIndex];
                            if (anim.keys[newIndex].time < theKey.time) theKey = anim.keys[newIndex];
                        }

                        if (dir == -1 && anim.keys[newIndex].time < this.view.cursorTime)
                        {
                            if (!theKey)theKey = anim.keys[newIndex];
                            if (anim.keys[newIndex].time > theKey.time) theKey = anim.keys[newIndex];
                        }
                    }
                }
            }
        }

        if (theKey)
        {
            gui.scene().timer.setTime(theKey.time);
            if (theKey.time > this.view.timeRight || theKey.time < this.view.timeLeft) this.view.centerCursor();
        }
    }

}
