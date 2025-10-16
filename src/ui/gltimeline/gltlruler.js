import { Events, Logger } from "cables-shared-client";
import { map } from "cables/src/core/utils.js";
import GlText from "../gldraw/gltext.js";
import GlRect from "../gldraw/glrect.js";
import { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";

/**
 * gltl ruler display
 *
 * @export
 * @class glTlRuler
 * @extends {Events}
 */
export class glTlRuler extends Events
{

    // static COLOR_BEATS = [0.5, 0.5, 0.5, 1];
    // static COLOR_BEAT4 = [0.8, 0.8, 0.8, 1];

    static COLOR_MARK_OUTRANGE = [0, 0, 0, 0.5];
    static COLOR_MARK_SIZE0 = [1, 1, 1, 0.1];
    static COLOR_MARK_SIZE1 = [1, 1, 1, 0.2];
    static COLOR_MARK_SIZE2 = [1, 1, 1, 0.1];
    static COLOR_MARK_SIZES = [this.COLOR_MARK_SIZE0, this.COLOR_MARK_SIZE1, this.COLOR_MARK_SIZE2];

    /** @type {GlTimeline} */
    #glTl;
    pointerDown = false;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlRuler");
        this.#glTl = glTl;
        this.y = 30;
        this.height = 50;

        this._glRectBg = this.#glTl.rectsNoScroll.createRect({ "name": "ruler bgrect", "draggable": false, "interactive": true });
        this._glRectBg.setSize(222, this.height);
        this._glRectBg.setColor(0.25, 0.25, 0.25, 1);
        this._glRectBg.setPosition(0, this.y, -0.9);

        this._glRectBg.on(GlRect.EVENT_POINTER_MOVE, (_x, _y, event) =>
        {
            if (!this.pointerDown) return;
            if (this.#glTl.loopAreaDrag.isDragging) return;
            this.#glTl.removeKeyPreViz();

            gui.corePatch().timer.pause();
            gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(event.offsetX) + this.#glTl.view.offset));

        });

        this._glRectBg.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            if (CABLES.UI.showDevInfos)
                gui.showInfo("visible time" + this.#glTl.view.visibleTime);
        });

        this._glRectBg.on(GlRect.EVENT_POINTER_UNHOVER, () =>
        {
        });

        this._glRectBg.on(GlRect.EVENT_POINTER_DOWN, (event, _r, _x, _y) =>
        {
            this.pointerDown = true;
            gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(event.offsetX) + this.#glTl.view.offset));
        });

        this._glRectBg.on(GlRect.EVENT_POINTER_UP, () =>
        {
            this.pointerDown = false;
        });

        this.markf = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this.#glTl.rectsNoScroll.createRect({ "name": "ruler marker frames", "draggable": false, "interactive": false });
            mr.setColor(0.0, 0.0, 0.0, 1);
            mr.setPosition(-8888, 0);
            mr.setParent(this._glRectBg);
            this.markf.push(mr);
        }

        // this.markBeats = [];
        // for (let i = 0; i < 400; i++)
        // {
        //     const mr = this.#glTl.rectsNoScroll.createRect({ "name": "ruler marker beats", "draggable": false, "interactive": false });
        //     mr.setPosition(-8888, 0);
        //     mr.setParent(this._glRectBg);
        //     mr.setSize(0, 0);
        //     this.markBeats.push(mr);
        // }

        this.marks = [];
        for (let i = 0; i < 700; i++)
        {
            const mr = this.#glTl.rectsNoScroll.createRect({ "name": "ruler marker seconds", "draggable": false, "interactive": false });
            mr.setParent(this._glRectBg);
            mr.setPosition(-8888, 0);
            this.marks.push(mr);
        }

        this.titles = [];
        for (let i = 0; i < 100; i++)
        {
            const mt = new GlText(this.#glTl.textsNoScroll, "");

            this.titles.push(mt);
        }

        this.update();
    }

    /**
     * @param {number} x
     */
    setTimeFromPixel(x)
    {
        gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(x) + this.#glTl.view.offset));
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this._glRectBg.setPosition(x, y);
    }

    /**
     * @param {number} t
     * @param {number} a
     * @param {number} b
     */
    between(t, a, b)
    {
        const f = map(t, a, b, 0, 1);

        const f1 = map(f, 0, 0.25, 0, 1);

        return f1;
    }

    /**
     * @param {number} s
     * @param {string | boolean} title
     * @param {boolean} special
     * @param {number} [fade]
     */
    addMarker(s, title, showTitle, special, fade)
    {
        if (fade == undefined)fade = 1;
        if (s < 0) return;
        if (this.count == this.marks.length) return console.log("too many marks");
        const x = this.#glTl.view.timeToPixel(s - this.#glTl.view.offset);

        let mr = this.marks[this.count];
        let mheight = 7;

        if (showTitle)
        {
            mheight = 20;
            mr.setColor(0.8, 0.8, 0.8, showTitle);

            if ((this.timeTitleLookup[s] || 0) < showTitle && this.titleCounter < this.titles.length)// this.titleCounter == 0 || x - this.titles[this.titleCounter - 1].x > this.titles[this.titleCounter - 1].width * 1.8)
            {
                this.timeTitleLookup[s] = showTitle;
                this.titles[this.titleCounter].text = String(title);// (Math.round(s * 100) / 100) + "s";
                this.titles[this.titleCounter].setParentRect(this._glRectBg);
                this.titles[this.titleCounter].setPosition(x - this.titles[this.titleCounter].width / 2, 1);
                this.titles[this.titleCounter].setOpacity(showTitle);
                this.titleCounter++;
            }
            if (this.titleCounter >= this.titles.length)
            {
                console.log("too many titles...");
            }
        }
        else
        {
            if (special) mheight = 14;
            mr.setColor(0.5, 0.5, 0.5, fade);
        }

        mr.setSize(1, mheight);
        mr.setPosition(x, this.height - mheight);

        this.timeMarkerLookup[s] = mr;
        this.count++;
    }

    title(s)
    {
        if (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES) return Math.round(s * 100) / 100 * this.#glTl.fps + "f";
        return Math.round(s * 100) / 100 + "s";
    }

    update()
    {
        this.timeMarkerLookup = {};
        this.timeTitleLookup = {};
        const timeLeft = Math.floor(this.#glTl.view.timeLeft);
        const timeRight = Math.ceil(this.#glTl.view.timeRight);

        const timeLeftMinute = Math.floor(this.#glTl.view.timeLeft / 60) * 60;
        const timeRightMinute = Math.ceil(this.#glTl.view.timeRight / 60) * 60;

        const timeLeftHour = Math.floor(this.#glTl.view.timeLeft / 3600) * 3600;
        const timeRightHour = Math.ceil(this.#glTl.view.timeRight / 3600) * 3600;

        const timeLeftDay = Math.floor(this.#glTl.view.timeLeft / (24 * 3600)) * (24 * 3600);
        const timeRightDay = Math.ceil(this.#glTl.view.timeRight / (24 * 3600)) * (24 * 3600);

        const dur = this.#glTl.view.visibleTime;

        const widthOneFrame = this.#glTl.view.timeToPixel(1 / this.#glTl.fps);

        const widthTenthSecond = this.#glTl.view.timeToPixel(0.1);
        const widthHalfSecond = this.#glTl.view.timeToPixel(0.5);
        const widthOneSecond = this.#glTl.view.timeToPixel(1);
        const widthFiveSecond = this.#glTl.view.timeToPixel(5);
        const widthTenSecond = this.#glTl.view.timeToPixel(10);
        const widthHalfMinute = this.#glTl.view.timeToPixel(30);
        const widthOneMinute = this.#glTl.view.timeToPixel(60);
        const widthFiveMinute = this.#glTl.view.timeToPixel(300);
        const widthTenMinutes = this.#glTl.view.timeToPixel(600);
        const widthHalfHour = this.#glTl.view.timeToPixel(1800);
        const widthOneHour = this.#glTl.view.timeToPixel(3600);
        const widthOneDay = this.#glTl.view.timeToPixel(24 * 3600);

        this.count = 0;
        this.titleCounter = 0;

        /// /////////////////////////////////////////////////////////////
        // things without title

        /// /////////////////////////////////////////////////////////////
        // things with title
        const frameInSeconds = 1 / this.#glTl.fps;
        let fade = 0;
        let minWidth = 40;
        let maxWidth = 60;

        fade = this.between(widthOneFrame, 10, 15);
        if (fade)
            for (let s = timeLeft; s < timeRight; s += frameInSeconds) this.addMarker(s, Math.floor(s / frameInSeconds) + "f", this.between(widthOneFrame, minWidth, maxWidth) * (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES ? 1 : 0), false, fade);

        fade = this.between(widthTenthSecond, 10, 15);
        if (fade)
            for (let s = timeLeft; s < timeRight; s += 0.1) this.addMarker(s, this.title(s), this.between(widthTenthSecond, minWidth, maxWidth), false, fade);

        fade = this.between(widthHalfSecond, 10, 15);
        if (fade)
            for (let s = timeLeft; s < timeRight; s += 0.5) this.addMarker(s, "", false, true, fade);

        fade = this.between(widthOneSecond, 5, 10);
        if (fade)
            for (let s = timeLeft; s < timeRight; s += 1) this.addMarker(s, this.title(s), this.between(widthOneSecond, minWidth, maxWidth), false, fade);

        fade = this.between(widthTenSecond, 5, 10);
        if (fade)
            for (let s = timeLeftMinute; s < timeRightMinute; s += 10) this.addMarker(s, this.title(s), this.between(widthTenSecond, minWidth, maxWidth), true, fade);

        fade = this.between(widthFiveSecond, 5, 10);
        if (fade)
            for (let s = timeLeftMinute; s < timeRightMinute; s += 5) this.addMarker(s, this.title(s), this.between(widthFiveSecond, minWidth, maxWidth), true, fade);

        fade = this.between(widthHalfMinute, 5, 10);
        if (fade)
            for (let s = timeLeftMinute; s < timeRightMinute; s += 30) this.addMarker(s, this.title(s), this.between(widthHalfMinute, minWidth, maxWidth), true, fade);

        fade = this.between(widthOneMinute, 5, 10);
        if (fade)
            for (let s = timeLeftMinute; s < timeRightMinute; s += 60) this.addMarker(s, s / 60 + "m", this.between(widthOneMinute, minWidth, maxWidth), false, fade);

        fade = this.between(widthFiveMinute, 5, 10);
        if (fade)
            for (let s = timeLeftHour; s < timeRightHour; s += 300) this.addMarker(s, s / 60 + "m", this.between(widthFiveMinute, minWidth, maxWidth), false, fade);

        fade = this.between(widthTenMinutes, 5, 10);
        if (fade)
            for (let s = timeLeftHour; s < timeRightHour; s += 600) this.addMarker(s, s / 60 + "m", this.between(widthTenMinutes, minWidth, maxWidth), false, fade);

        fade = this.between(widthHalfHour, 5, 10);
        if (fade)
            for (let s = timeLeftHour; s < timeRightHour; s += 1800) this.addMarker(s, s / 60 + "m", this.between(widthHalfHour, minWidth, maxWidth), false, fade);

        fade = this.between(widthOneHour, 5, 10);
        if (fade)
            for (let s = timeLeftHour; s < timeRightHour; s += 3600) this.addMarker(s, s / 3600 + "h", this.between(widthOneHour, minWidth, maxWidth), false, fade);

        fade = this.between(widthOneDay, 50, 100);
        if (fade)
            for (let s = timeLeftDay; s < timeRightDay; s += (24 * 3600)) this.addMarker(s, s / (24 * 3600) + "d", this.between(widthOneDay, minWidth, maxWidth), false, fade);
        /// /////////////////////////////////////////////////////////////

        for (let i = this.count; i < this.marks.length; i++)
        {
            const mr = this.marks[i];
            mr.setSize(0, 0);
        }
        for (let i = this.titleCounter; i < this.titles.length; i++)
        {
            this.titles[i].text = "";
            this.titles[i].setPosition(-9999, -999);
        }
        /// //////////////////

    }

    updateOld()
    {
        let pixelScale = this.#glTl.view.timeToPixel(1);
        let titleCounter = 0;
        let offset = Math.floor(this.#glTl.view.offset);

        for (let i = 0; i < this.titles.length; i++)
        {
            this.titles[i]._align = 1;
            this.titles[i].text = "";
            this.titles[i].setParentRect(null);
        }

        if (this.#glTl.cfg.fadeInFrames)
        {
            const oneframePixel = this.#glTl.view.timeToPixel(1 / this.#glTl.fps);
            if (oneframePixel >= 5)
            {
                const mheight = this.height * 0.6;
                for (let i = 0; i < this.markf.length; i++)
                {
                    const mr = this.markf[i];
                    const t = offset + i * (1 / this.#glTl.fps);
                    const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);
                    const a = CABLES.map(oneframePixel, 5, 10, 0.04, 0.3);

                    mr.setSize(oneframePixel - 2, this.height - mheight);
                    mr.setPosition(x + 1 - oneframePixel / 2, mheight);
                    mr.setColor(0.13, 0.13, 0.13, a);

                    if (t < 0) this.markf[i].setSize(0, 0);
                }
            }
            else
            {
                for (let i = 0; i < this.markf.length; i++)
                    this.markf[i].setSize(0, 0);
            }
        }
        else
            for (let i = 0; i < this.markf.length; i++) this.markf[i].setSize(0, 0);

        // if (this.#glTl.cfg.showBeats)
        // {
        //     const bps = this.#glTl.bpm / 60;
        //     const onebeatPixel = this.#glTl.view.timeToPixel(1 / bps);

        //     for (let i = 0; i < this.markBeats.length; i++)
        //     {
        //         const mr = this.markBeats[i];
        //         const t = offset + (i * (1 / bps));
        //         const x = this.#glTl.view.timeToPixel(t - (this.#glTl.view.offset));

        //         mr.setSize(onebeatPixel - 2, 5);
        //         mr.setPosition(x, 1);

        //         // const absBeat = Math.floor((t) * bps);
        //         // if ((absBeat + 1) % (this.#glTl.cfg.bpmHlXth || 4) == 0) mr.setColorArray(glTlRuler.COLOR_BEAT4);
        //         // else
        //         mr.setColorArray(glTlRuler.COLOR_BEATS);

        //         if (t < 0) mr.setOpacity(0.3);
        //     }
        // }
        // else
        // {
        //     for (let i = 0; i < this.markBeats.length; i++) this.markBeats[i].setSize(0, 0);
        // }

        // console.log("pixelscale", pixelScale);

        for (let i = 0; i < this.marks.length; i++)
        {
            const mr = this.marks[i];
            let x = 0;
            let title = null;
            titleCounter %= this.titles.length;

            let time = 0;
            let size = -1;

            if (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_SECONDS)
            {

                if (pixelScale > 50)
                {
                    time = offset + i * 0.1;
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 1 == 0.5)
                    {
                        size = 1;
                    }
                    if (time % 1 == 0) // full seconds
                    {
                        size = 2;
                        title = (time) + "s";
                    }
                }
                else
                if (pixelScale < 4)
                {
                    time = offset + i;
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 30 == 0)
                    {
                        title = (time) + "s";
                        size = 2;
                    }
                }
                else
                if (pixelScale < 8)
                {
                    time = offset + (i);
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 10 == 0)
                    {
                        size = 2;
                        title = (time) + "s";
                    }
                }
                else
                if (pixelScale < 50)
                {
                    time = offset + i;
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 1 == 0)
                    {
                        size = 0;
                    }
                    if (time % 10 == 0)
                    {
                        size = 2;
                        title = (time) + "s";
                    }
                    else if (time % 5 == 0)
                    {
                        title = (time) + "s";
                        size = 1;
                    }
                }
            }
            if (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
            {
                time = offset + i * 0.5;
                x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);

                if (pixelScale > 40)
                {
                    if (time % 1 == 0.5) size = 1;
                    else if (time % 1 == 0) size = 2;
                }
                else
                {

                    if (pixelScale < 15)
                    {
                        if (time % 10 == 0) size = 2;
                    }
                    else if (pixelScale < 25)
                    {
                        if (time % 1 == 0) size = 1;
                        if (time % 5 == 0) size = 2;
                    }
                    else if (pixelScale < 40)
                    {
                        if (time % 1 == 0) size = 1;
                        if (time % 2 == 0) size = 2;
                    }
                    else
                    {
                        size = 0;
                    }
                }
                if (size == 2)
                    title = Math.floor((time) * this.#glTl.fps) + "f";
            }

            let h = 10;
            if (size == -1) x = -19999;
            else if (size == 0) h = 14;
            else if (size == 1) h = 15;
            else if (size == 2) h = 25;

            if (size > -1)
                if (time < 0 || time > this.#glTl.duration)
                {
                    mr.setColorArray(glTlRuler.COLOR_MARK_OUTRANGE);
                    mr.setSize(1, h);
                }
                else
                {
                    mr.setColorArray(glTlRuler.COLOR_MARK_SIZES[size]);
                    mr.setSize(1, h);
                    if (size == 2) mr.setSize(1, h + this.#glTl.height);
                }
            mr.setPosition(x, this.height - h);

            if (title && x < this.#glTl.width)
            {
                if (time < 0 || time > this.#glTl.duration) this.titles[titleCounter].setColor(0, 0, 0, 1);
                else this.titles[titleCounter].setColor(1, 1, 1, 1);

                this.titles[titleCounter].text = title;
                this.titles[titleCounter].setParentRect(this._glRectBg);
                this.titles[titleCounter].setPosition(x, this.height - h - 23);

                titleCounter++;
            }
        }
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        this.width = w;
        this._glRectBg.setSize(this.width, this.height);
    }

    isHovering()
    {
        return this._glRectBg.isHovering();
    }
}
