import { Events, Logger } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";
import { GlTimeline } from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";

/**
 * gltl ruler display
 *
 * @export
 * @class glTlRuler
 * @extends {Events}
 */
export class glTlRuler extends Events
{

    /** @type {GlTimeline} */
    #glTl;

    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlRuler");
        this.#glTl = glTl;
        this.y = 30;
        this.height = 50;

        this._glRectBg = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
        this._glRectBg.setSize(222, this.height);
        this._glRectBg.setColor(0.25, 0.25, 0.25, 1);
        this._glRectBg.setPosition(0, this.y);

        this._glRectBg.on(GlRect.EVENT_DRAG, (_r, _ox, _oy, _button, event) =>
        {
            gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(event.offsetX - this.#glTl.titleSpace) + this.#glTl.view.offset));
        });

        this._glRectBg.on(GlRect.EVENT_POINTER_DOWN, (event, _r, _x, _y) =>
        {
            console.log("mousdown");
            gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(event.offsetX - this.#glTl.titleSpace) + this.#glTl.view.offset));

        });

        this.markf = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this.#glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.0, 0.0, 0.0, 1);
            mr.setParent(this._glRectBg);
            this.markf.push(mr);
        }

        this.markBeats = [];
        for (let i = 0; i < 400; i++)
        {
            const mr = this.#glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2, 1);
            mr.setParent(this._glRectBg);
            mr.setSize(0, 0);
            this.markBeats.push(mr);
        }

        this.marks = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this.#glTl.rects.createRect({ "draggable": false });
            mr.setParent(this._glRectBg);
            this.marks.push(mr);
        }

        this.titles = [];
        for (let i = 0; i < 100; i++)
        {
            const mt = new GlText(this.#glTl.texts, "");

            this.titles.push(mt);
        }

        this.update();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this._glRectBg.setPosition(x, y);
    }

    update()
    {
        let pixelScale = this.#glTl.view.timeToPixel(1);
        let titleCounter = 0;
        let offset = Math.floor(this.#glTl.view.offset);
        let offsetPixel = this.#glTl.view.timeToPixelScreen(this.#glTl.view.offset % 1);

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
                for (let i = 0; i < this.markf.length; i++)
                {
                    const mr = this.markf[i];
                    const t = offset + i * (1 / this.#glTl.fps);
                    const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);
                    const a = CABLES.map(oneframePixel, 5, 15, 0.04, 1.0);

                    mr.setSize(oneframePixel - 2, this.height / 2);
                    mr.setPosition(x + 1, this.height / 2);
                    mr.setColor(0.13, 0.13, 0.13, a);

                    if (t < 0)
                        this.markf[i].setSize(0, 0);
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

        if (this.#glTl.cfg.showBeats)
        {
            const bps = this.#glTl.bpm / 60;
            const onebeatPixel = this.#glTl.view.timeToPixel(1 / bps);
            const spb = 1 / bps;
            for (let i = 0; i < this.markBeats.length; i++)
            {
                const mr = this.markBeats[i];
                const t = offset + i * (1 / bps);
                const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);
                mr.setSize(onebeatPixel - 2, 5);
                mr.setPosition(x, 1);

                // const absBeat = Math.floor(t / (spb));
                let shade = 0.5;
                // if (absBeat % 4 == 0)shade = 0.8;

                mr.setColor(shade, shade, shade, 1);

                if (t < 0) mr.setSize(0, 0);
            }
        }
        else
        {
            for (let i = 0; i < this.markBeats.length; i++) this.markBeats[i].setSize(0, 0);
        }

        for (let i = 0; i < this.marks.length; i++)
        {
            const mr = this.marks[i];
            let h = 10;
            let x = 0;
            let a = 0.4;
            let title = null;
            titleCounter %= this.titles.length;

            let time = 0;

            if (this.#glTl.displayUnits == "Seconds")
            {

                if (pixelScale > 50)
                {
                    time = offset + i * 0.1;
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 1 == 0.5)
                    {
                        h = 25;
                    }
                    if (time % 1 == 0) // full seconds
                    {
                        h = 15;
                        a = 1;
                        title = (time) + "s";
                    }
                }
                else
                if (pixelScale < 4)
                {
                    time = offset + (i * 10);
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 30 == 0)
                    {
                        h = 20;
                        title = (time) + "s";
                        a = 1;
                    }
                }
                else
                if (pixelScale < 8)
                {
                    time = offset + (i * 10);
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 10 == 0)
                    {
                        h = 20;
                        title = (time) + "s";
                        a = 1;
                    }
                }
                else
                if (pixelScale < 50)
                {
                    time = offset + i;
                    x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                    if (time % 1 == 0)
                    {
                        h = 10;
                    }
                    if (time % 10 == 0)
                    {
                        h = 20;
                        title = (time) + "s";
                    }
                    else if (time % 5 == 0)
                    {
                        h = 15;
                        title = (time) + "s";
                        a = 1;
                    }
                }
            }
            if (this.#glTl.displayUnits == "Frames")
            {
                time = (offset + i);
                x = this.#glTl.view.timeToPixel(time - this.#glTl.view.offset);
                h = 20;
                title = i * this.#glTl.fps + "f";
            }

            if (time < 0 || time > this.#glTl.duration)mr.setColor(0, 0, 0, a);
            else mr.setColor(1, 1, 1, a);
            mr.setSize(1, h);
            mr.setPosition(x, this.height - h, -0.35);

            if (title && x < this.#glTl.width)
            {
                if (time < 0 || time > this.#glTl.duration) this.titles[titleCounter].setColor(0, 0, 0, 1);
                else this.titles[titleCounter].setColor(1, 1, 1, 1);

                this.titles[titleCounter].text = title;
                this.titles[titleCounter].setParentRect(this._glRectBg);
                // this.titles[titleCounter].setPosition(0, 50);
                this.titles[titleCounter].setPosition(x, this.height - h - 30, -0.35);

                titleCounter++;
            }
        }
    }

    setWidth(w)
    {
        this.width = w;
        this._glRectBg.setSize(this.width, this.height);

    }
}
