import { Events, Logger } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";
import GlTimeline from "./gltimeline.js";

/**
 * gltl ruler display
 *
 * @export
 * @class glTlRuler
 * @extends {Events}
 */
export default class glTlRuler extends Events
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
        this._offset = 0;

        this._glRectBg = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
        this._glRectBg.setSize(222, this.height);
        this._glRectBg.setColor(0.5, 0.3, 0.3, 1);
        this._glRectBg.setPosition(0, this.y);

        this._glRectBg.on("drag", (r, ox, oy) =>
        {
            this._offset = ox / 100;
            this.#glTl.updateAllElements();
        });

        this.markf = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this.#glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2, 1);
            mr.setParent(this._glRectBg);
            this.markf.push(mr);
        }

        this.markBeats = [];
        for (let i = 0; i < 100; i++)
        {
            const mr = this.#glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2, 1);
            mr.setParent(this._glRectBg);
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

    get offset()
    {
        return this._offset;
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
        let pixel1 = this.#glTl.timeToPixel(1);
        let titleCounter = 0;
        let offset = -Math.floor(this._offset);
        let offsetPixel = this.#glTl.timeToPixelScreen(this._offset % 1);

        for (let i = 0; i < this.titles.length; i++)
        {
            this.titles[i].text = "";
            this.titles[i].setParentRect(null);
        }

        const oneframePixel = this.#glTl.timeToPixel(1 / this.#glTl.fps);
        if (oneframePixel >= 5)
        {
            for (let i = 0; i < this.markf.length; i++)
            {
                const mr = this.markf[i];
                const t = offset + i * (1 / this.#glTl.fps);
                const x = this.#glTl.timeToPixel(t - this._offset);
                const a = CABLES.map(oneframePixel, 5, 15, 0.04, 0.5);

                mr.setSize(oneframePixel - 1, this.height);
                mr.setPosition(x, 0);
                mr.setColor(0.2, 0.2, 0.2, a);
            }
        }
        else
        {
            for (let i = 0; i < this.markf.length; i++)
                this.markf[i].setSize(0, 0);
        }
        const bps = this.#glTl.bpm / 60;
        const onebeatPixel = this.#glTl.timeToPixel(1 / bps - offset);
        for (let i = 0; i < this.markBeats.length; i++)
        {
            const mr = this.markBeats[i];
            const t = offset + i * 1 / bps;
            const x = this.#glTl.timeToPixel(t - this._offset);

            mr.setSize(onebeatPixel - 2, 5);
            mr.setPosition(x, 0);

            let shade = 0.2;
            if (i % 4 == 0)shade = 0;

            mr.setColor(shade, shade, shade, 1);
        }

        for (let i = 0; i < this.marks.length; i++)
        {
            const mr = this.marks[i];
            let h = 10;
            let x = 0;
            let title = null;
            titleCounter %= this.titles.length;

            if (this.#glTl.displayUnits == "Seconds")
            {
                if (pixel1 > 50)
                {
                    const t = offset + i * 0.1;
                    x = this.#glTl.timeToPixel(t - this._offset);
                    if (t % 1 == 0.5)
                    {
                        h = 20;
                    }
                    if (t % 1 == 0) // full seconds
                    {
                        h = 15;
                        title = (t - offset) + "s";
                    }
                }
                else
                if (pixel1 < 4)
                {
                    const t = offset + (i * 10);
                    x = this.#glTl.timeToPixel(t) - offsetPixel;
                    if (t % 30 == 0)
                    {
                        h = 20;
                        title = (t - offset) + "s";
                    }
                }
                else
                if (pixel1 < 8)
                {
                    const t = offset + (i * 10);
                    x = this.#glTl.timeToPixel(t) - offsetPixel;
                    if (t % 10 == 0)
                    {
                        h = 20;
                        title = (t - offset) + "s";
                    }
                }
                else
                if (pixel1 < 50)
                {
                    const t = offset + i;
                    x = this.#glTl.timeToPixel(t) - offsetPixel;
                    if (t % 1 == 0)
                    {
                        h = 10;
                    }
                    if (t % 10 == 0)
                    {
                        h = 20;
                        title = (t - offset) + "s";
                    }
                    else if (t % 5 == 0)
                    {
                        h = 15;
                        title = (t - offset) + "s";
                    }
                }
            }
            if (this._units == 1)
            {
                const t = (offset + i);
                x = this.#glTl.timeToPixel(t) - offsetPixel;
                h = 20;
                title = i * this.#glTl.fps + "f";
            }
            mr.setColor(1, 1, 1, 0.4);
            mr.setSize(1, h);
            mr.setPosition(x, this.height - h);

            if (title && x < this.#glTl.width)
            {
                this.titles[titleCounter].setParentRect(mr);
                this.titles[titleCounter].text = title;
                this.titles[titleCounter].setPosition(0, 20);
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
