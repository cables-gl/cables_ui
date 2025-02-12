import { Events, Logger, ele } from "cables-shared-client";
import { Types } from "cables-shared-types";
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
import { getHandleBarHtml } from "../utils/handlebars.js";
import { notify, notifyWarn } from "../elements/notification.js";
import undo from "../utils/undo.js";

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

    /** @type {Array<Types.AnimKey>} */
    #selectedKeys = [];

    hoverKeyRect = null;

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
     * @param {CABLES.CglContext} cgl
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

        cgl.canvas.classList.add("cblgltimelineEle");
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
        gui.glTimeline = this;

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

    /**
     * @param {number} time
     */
    snapTime(time)
    {
        if (this.cfg.restrictToFrames) time = Math.floor(time * this.fps) / this.fps;
        return time;
    }

    toggleGraphLayout()
    {
        if (this.#layout == 1) this.#layout = 0;
        else this.#layout = 1;

        this.init();
    }

    getColorSpecial()
    {
        return [0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1];
    }

    /**
     * @param {GlRect|GlText} r
     */
    setColorRectSpecial(r)
    {
        if (r)
            r.setColor(this.getColorSpecial());
    }

    /**
     * @param {number} w
     */
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

            if (this.getNumSelectedKeys() > 0 && !this.selectRect)
            {
                return;
            }
            else
            {
                if (y > this.getFirstLinePosy())
                {
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
            }

            this.updateAllElements();

            // console.log(this.getNumSelectedKeys() + "keys selected");
            if (this.getNumSelectedKeys() > 0)
            {
                this.showKeyParams();
            }
        }
        else
        if (e.buttons == this.buttonForScrolling)
        {
            this.view.scroll(-this.view.pixelToTime(e.movementX) * 2, 0);
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
            minTime = Math.min(minTime, keys[i].time);

        return minTime;
    }

    getNumSelectedKeys()
    {
        return this.#selectedKeys.length;
    }

    moveSelectedKeys(time)
    {
        if (time === undefined)time = this.cursorTime;
        let minTime = time - this.getKeysSmallestTime(this.#selectedKeys);
        this.moveSelectedKeysDelta(minTime);
    }

    setSelectedKeysTime(time)
    {
        if (time === undefined)time = this.cursorTime;

        for (let i = 0; i < this.#selectedKeys.length; i++)
            this.#selectedKeys[i].set({ "time": time });

        this.updateAllElements();
    }

    serializeSelectedKeys(newId)
    {
        const keys = [];
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            const o = this.#selectedKeys[i].getSerialized();
            o.id = this.#selectedKeys[i].id;
            o.animName = this.#selectedKeyAnims[i].name;
            o.animId = this.#selectedKeyAnims[i].id;

            if (newId)o.id = CABLES.shortId();
            keys.push(o);
        }

        return keys;
    }

    /**
     * @param {number} delta
     */
    moveSelectedKeysDelta(delta)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
            this.#selectedKeys[i].set({ "time": this.#selectedKeys[i].time + delta });

        this.updateAllElements();
    }

    getSelectedKeysBoundsTime()
    {
        let min = 999999;
        let max = -999999;
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            min = Math.min(min, this.#selectedKeys[i].time);
            max = Math.max(max, this.#selectedKeys[i].time);
        }
        return { "min": min, "max": max };
    }

    deleteSelectedKeys()
    {
        const oldKeys = this.serializeSelectedKeys();
        const gltl = this;
        undo.add({
            "title": "timeline move keys",
            undo()
            {
                gltl.deserializeKeys(oldKeys);

            },
            redo()
            {
            } });

        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeyAnims[i].remove(this.#selectedKeys[i]);

        }

        this.unSelectAllKeys();
    }

    /**
     * @param {Types.AnimKey} k
     * @param {Types.Anim} a
     *
     */
    selectKey(k, a)
    {
        if (!this.isKeySelected(k))
        {
            this.#selectedKeys.push(k);
            this.#selectedKeyAnims.push(a);
        }
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseDown(e)
    {
        if (!e.pointerType) return;

        if (e.buttons == 1)
            if (this.hoverKeyRect == null)
                this.unSelectAllKeys();

        try { this.#cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        this.emitEvent("mousedown", e);
        this.#rects.mouseDown(e, e.offsetX, e.offsetY);
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

    showKeyParams()
    {

        const html = getHandleBarHtml(
            "params_keys", {
                "numKeys": this.#selectedKeys.length,
            });

        gui.opParams.clear();

        ele.byId(gui.getParamPanelEleId()).innerHTML = html;

        ele.clickable(ele.byId("keyscopy"), () =>
        {
            this.copy(new ClipboardEvent("copy"));
        });

        ele.clickable(ele.byId("keysdelete"), () =>
        {
            this.deleteSelectedKeys();
        });

    }

    /**
     * @param {ClipboardEvent} event
     */
    copy(event = null)
    {
        const obj = { "keys": this.serializeSelectedKeys() };

        if (event)
        {
            const objStr = JSON.stringify(obj);
            event.clipboardData.setData("text/plain", objStr);
            event.preventDefault();
        }
        return obj;

    }

    /**
     * @param {ClipboardEvent} event
     */
    cut(event)
    {
        this.copy(event);
        this.deleteSelectedKeys();
    }

    /**
     * @param {Array<Object>} keys
     * @param {Object} options
     */
    deserializeKeys(keys, options)
    {
        const deleteOld = options.deleteOld || false;
        const setCursorTime = options.setCursorTime || false;

        let minTime = Number.MAX_VALUE;
        for (let i in keys)
        {
            minTime = Math.min(minTime, keys[i].t);
        }

        let notfoundallAnims = false;
        let newKeys = [];

        for (let i = 0; i < keys.length; i++)
        {
            const k = keys[i];
            if (setCursorTime)
                k.t = k.t - minTime + this.cursorTime;

            let found = false;
            for (let j = 0; j < this.#tlAnims.length; j++)
            {
                let an = null;
                if (k.animId)an = this.#tlAnims[j].getAnimById(k.animId);

                if (an)
                {
                    const l = new CABLES.AnimKey(keys[i], an);
                    newKeys.push(l);
                    an.addKey(l);
                    found = true;
                }
            }

            if (!found)
                notfoundallAnims = true;

        }
        return { "keys": newKeys, "notfoundallAnims": notfoundallAnims };
    }

    /**
     * @param {ClipboardEvent} e
     */
    paste(e)
    {
        if (e.clipboardData.types.indexOf("text/plain") > -1)
        {
            e.preventDefault();

            const str = e.clipboardData.getData("text/plain");

            e.preventDefault();

            const json = JSON.parse(str);
            if (json)
            {
                if (json.keys)
                {
                    const notfoundallAnims = this.deserializeKeys(json.keys, true).notfoundallAnims;
                    if (notfoundallAnims)
                    {
                        notifyWarn("could not find all anims for pasted keys");
                    }
                    else
                    {
                        notify(json.keys.length + " keys pasted");
                    }

                    const animPorts = gui.corePatch().getAllAnimPorts();
                    for (let i = 0; i < animPorts.length; i++)
                    {

                        if (animPorts[i].anim)
                            animPorts[i].anim.removeDuplicates();
                    }
                    // anim.sortKeys();

                    // for (let i in anim.keys)
                    // {
                    //     anim.keys[i].updateCircle(true);
                    // }

                    return;
                }
            }
            // CABLES.UI.setStatusText("paste failed / not cables data format...");
            CABLES.UI.notify("Paste failed");
        }
    }

    /** @returns {boolean} */
    isFocused()
    {
        // todo
        return true;
    }

    duplicateSelectedKeys()
    {
        const o = this.copy();

        const newKeys = this.deserializeKeys(o.keys, false).keys;

        undo.add({
            "title": "timeline duplicate keys",
            undo()
            {
                for (let i = 0; i < newKeys.length; i++)
                {
                    console.log("delete...dupes");
                    newKeys[i].delete();
                }
                // key.set(oldValues);

            },
            redo()
            {
            } });
    }

}
