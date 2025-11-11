import { Events, Logger } from "cables-shared-client";
import { map } from "cables/src/core/utils.js";
import { Patch } from "cables";
import GlText from "../gldraw/gltext.js";
import GlRect from "../gldraw/glrect.js";
import Gui, { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";
import { tlView } from "./tlview.js";
import { GuiText } from "../text.js";

/**
 * gltl ruler display
 *
 * @export
 * @class glTlRuler
 * @extends {Events}
 */
export class glTlRuler extends Events
{
    static COLOR_MARK_OUTRANGE = [0, 0, 0, 0.5];
    static COLOR_MARK_SIZE0 = [1, 1, 1, 0.1];
    static COLOR_MARK_SIZE1 = [1, 1, 1, 0.2];
    static COLOR_MARK_SIZE2 = [1, 1, 1, 0.1];
    static COLOR_MARK_SIZES = [this.COLOR_MARK_SIZE0, this.COLOR_MARK_SIZE1, this.COLOR_MARK_SIZE2];

    #log = new Logger("glTlRuler");

    /** @type {GlTimeline} */
    #glTl;

    /** @type {GlRect} */
    #glRectBg;

    /** @type {GlRect[]} */
    markf = [];

    /** @type {GlRect[]} */
    marks = [];

    /** @type {GlText[]} */
    titles = [];

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl, r, fullview)
    {
        super();
        this.fullView = fullview;
        this.#glTl = glTl;
        this.y = r.y;
        this.height = r.h;
        this.view = this.#glTl.view;
        if (fullview) this.view = new tlView(glTl);

        this.#glRectBg = r;

        this.#glRectBg.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            gui.showInfo(GuiText.tlhover_ruler);
        });

        for (let i = 0; i < 300; i++)
        {
            const mr = this.#glTl.rectsNoScroll.createRect({ "name": "ruler marker frames", "draggable": false, "interactive": false });
            mr.setColorArray(gui.theme.colors_timeline.ruler_frames);
            mr.setPosition(-8888, 0);
            mr.setParent(this.#glRectBg);
            this.markf.push(mr);
        }

        for (let i = 0; i < 700; i++)
        {
            const mr = this.#glTl.rectsNoScroll.createRect({ "name": "ruler marker seconds", "draggable": false, "interactive": false });
            mr.setParent(this.#glRectBg);
            mr.setColorArray(gui.theme.colors_timeline.ruler_tick);
            mr.setPosition(-8888, 0);
            this.marks.push(mr);
        }

        for (let i = 0; i < 100; i++)
        {
            const mt = new GlText(this.#glTl.textsNoScroll, "");

            this.titles.push(mt);
        }

        gui.corePatch().on(Patch.EVENT_ANIM_MAXTIME_CHANGE, () =>
        {
            if (this.fullView)
            {
                this.view.scrollTo(0);
                this.view.setZoomLength(gui.corePatch().animMaxTime);
            }

            this.update();
        });

        gui.on(Gui.EVENT_THEMECHANGED, () =>
        {
            this.updateTheme();
        });

        this.updateTheme();
        this.update();
    }

    updateTheme()
    {
        this.#glRectBg.setColorArray(gui.theme.colors_timeline.ruler_background);

        for (let i = 0; i < this.markf.length; i++)
        {
            this.markf[i].setColorArray(gui.theme.colors_timeline.ruler_frames);
        }

        for (let i = 0; i < this.marks.length; i++)
        {
            this.marks[i].setColorArray(gui.theme.colors_timeline.ruler_tick);
        }

    }

    /**
     * @param {number} x
     */
    setTimeFromPixel(x)
    {
        gui.corePatch().timer.setTime(this.#glTl.snapTime(this.view.pixelToTime(x) + this.view.offset));
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
        const x = this.view.timeToPixel(s - this.view.offset);

        let mr = this.marks[this.count];
        let mheight = 7;

        if (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
            if (title.includes(".")) return;

        if (showTitle)
        {
            mheight = 20;
            mr.setColor(0.8, 0.8, 0.8, showTitle);

            if ((this.timeTitleLookup[s] || 0) < showTitle && this.titleCounter < this.titles.length)// this.titleCounter == 0 || x - this.titles[this.titleCounter - 1].x > this.titles[this.titleCounter - 1].width * 1.8)
            {
                this.timeTitleLookup[s] = showTitle;
                this.titles[this.titleCounter].text = String(title);// (Math.round(s * 100) / 100) + "s";
                this.titles[this.titleCounter].setParentRect(this.#glRectBg);
                this.titles[this.titleCounter].setPosition(x, 1);
                if (this.titleCounter == 0) this.titles[this.titleCounter].setPosition(x + this.titles[this.titleCounter].width / 2, 1);
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
        if (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
        {
            const fr = Math.round(s * 100) / 100 * this.#glTl.fps;
            return fr + "f";
        }
        return Math.round(s * 100) / 100 + "s";
    }

    update()
    {
        this.updateOld();
        this.timeMarkerLookup = {};
        this.timeTitleLookup = {};

        const timeLeft = Math.floor(this.view.timeLeft);
        const timeRight = Math.ceil(this.view.timeRight);

        const timeLeftMinute = Math.floor(this.view.timeLeft / 60) * 60;
        const timeRightMinute = Math.ceil(this.view.timeRight / 60) * 60;

        const timeLeftHour = Math.floor(this.view.timeLeft / 3600) * 3600;
        const timeRightHour = Math.ceil(this.view.timeRight / 3600) * 3600;

        const timeLeftDay = Math.floor(this.view.timeLeft / (24 * 3600)) * (24 * 3600);
        const timeRightDay = Math.ceil(this.view.timeRight / (24 * 3600)) * (24 * 3600);

        const dur = this.view.visibleTime;

        const widthOneFrame = this.view.timeToPixel(1 / this.#glTl.fps);
        const widthTenthSecond = this.view.timeToPixel(0.1);
        const widthHalfSecond = this.view.timeToPixel(0.5);
        const widthOneSecond = this.view.timeToPixel(1);
        const widthFiveSecond = this.view.timeToPixel(5);
        const widthTenSecond = this.view.timeToPixel(10);
        const widthHalfMinute = this.view.timeToPixel(30);
        const widthOneMinute = this.view.timeToPixel(60);
        const widthFiveMinute = this.view.timeToPixel(300);
        const widthTenMinutes = this.view.timeToPixel(600);
        const widthHalfHour = this.view.timeToPixel(1800);
        const widthOneHour = this.view.timeToPixel(3600);
        const widthOneDay = this.view.timeToPixel(24 * 3600);

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
            for (let s = timeLeft; s < timeRight; s += frameInSeconds) this.addMarker(s, Math.ceil(s / frameInSeconds) + "f", this.between(widthOneFrame, minWidth, maxWidth) * (this.#glTl.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES ? 1 : 0), false, fade);

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
        let pixelScale = this.view.timeToPixel(1);
        let titleCounter = 0;
        let offset = Math.floor(this.view.offset);

        for (let i = 0; i < this.titles.length; i++)
        {
            this.titles[i]._align = 1;
            this.titles[i].text = "";
            this.titles[i].setParentRect(null);
        }

        // fadin frames...
        if (this.#glTl.cfg.fadeInFrames)
        {
            const oneframePixel = this.view.timeToPixel(1 / this.#glTl.fps);
            if (oneframePixel >= 5)
            {
                const mheight = this.height * 0.7;
                for (let i = 0; i < this.markf.length; i++)
                {
                    const mr = this.markf[i];
                    const t = offset + i * (1 / this.#glTl.fps);
                    const x = this.view.timeToPixel(t - this.view.offset);
                    const a = CABLES.map(oneframePixel, 5, 10, 0.04, 0.3);

                    mr.setSize(oneframePixel - 2, this.height - mheight);
                    mr.setPosition(x + 1 - oneframePixel / 2, mheight);
                    mr.setColor(0.53, 0.53, 0.53, a);

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
    }

}
