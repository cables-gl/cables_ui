import { Events, Logger } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";

/**
 * gltl ruler display
 *
 * @export
 * @class glTlRuler
 * @extends {Events}
 */
export default class glTlRuler extends Events
{
    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlRuler");
        this._glTl = glTl;
        this._units = 0;
        this._fps = 30;
        this._bpm = 180;
        this._height = 50;
        this._offset = 0;

        this._glRectBg = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this._glRectBg.setSize(21000, this._height);
        this._glRectBg.setColor(0.3, 0.3, 0.3, 1);
        // this._glRectBg.setColorHover(0.4,0.4,0.4)

        this._glRectBg.on("drag", (r, ox, oy) =>
        {
            this._log.log("rag", this._offset);
            this._offset = ox / 100;
            this.update();
        });

        this.markf = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this._glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2, 1);
            this.markf.push(mr);
        }

        this.markBeats = [];
        for (let i = 0; i < 100; i++)
        {
            const mr = this._glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2, 1);
            this.markBeats.push(mr);
        }

        this.marks = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this._glTl.rects.createRect({ "draggable": false });
            this.marks.push(mr);
        }

        this.titles = [];
        for (let i = 0; i < 100; i++)
        {
            const mt = new GlText(this._glTl.texts, "");
            this.titles.push(mt);
        }

        this.update();
    }

    get offset()
    {
        return this._offset;
    }

    update()
    {
        let pixel1 = this._glTl.timeToPixel(1);
        let titleCounter = 0;
        let offset = -Math.floor(this._offset);
        let offsetPixel = this._glTl.timeToPixel(this._offset % 1);

        for (let i = 0; i < this.titles.length; i++)
        {
            this.titles[i].text = "";
            this.titles[i].setParentRect(null);
        }

        const oneframePixel = this._glTl.timeToPixel(1 / this._fps);
        if (oneframePixel >= 5)
        {
            for (let i = 0; i < this.markf.length; i++)
            {
                const mr = this.markf[i];
                const t = offset + i * (1 / this._fps);
                const x = this._glTl.timeToPixel(t) - offsetPixel;
                const a = CABLES.map(oneframePixel, 5, 15, 0.04, 0.5);

                mr.setSize(oneframePixel - 1, this._height);
                mr.setPosition(x, 0);
                mr.setColor(0.2, 0.2, 0.2, a);
            }
        }
        else
        {
            for (let i = 0; i < this.markf.length; i++)
                this.markf[i].setSize(0, 0);
        }
        const bps = this._bpm / 60;
        const onebeatPixel = this._glTl.timeToPixel(1 / bps - offset);
        for (let i = 0; i < this.markBeats.length; i++)
        {
            const mr = this.markBeats[i];
            const t = offset + i * 1 / bps;
            const x = this._glTl.timeToPixel(t) - offsetPixel;

            mr.setSize(onebeatPixel - 2, 8);
            mr.setPosition(x, 50 - 5);

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

            if (this._units == 0)
            {
                if (pixel1 > 50)
                {
                    const t = offset + i * 0.1;
                    x = this._glTl.timeToPixel(t) - offsetPixel;
                    if (t % 1 == 0.5)
                    {
                        h = 15;
                    }
                    if (t % 1 == 0) // full seconds
                    {
                        h = 20;
                        title = (t - offset) + "s";
                    }
                }
                else
                if (pixel1 < 4)
                {
                    const t = offset + (i * 10);
                    x = this._glTl.timeToPixel(t) - offsetPixel;
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
                    x = this._glTl.timeToPixel(t) - offsetPixel;
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
                    x = this._glTl.timeToPixel(t) - offsetPixel;
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
                x = this._glTl.timeToPixel(t) - offsetPixel;
                h = 20;
                title = i * this._fps + "f";
            }
            mr.setColor(1, 1, 1, 0.4);
            mr.setSize(1, h);
            mr.setPosition(x, 0);

            if (title && x < this._glTl.width)
            {
                this.titles[titleCounter].setParentRect(mr);
                this.titles[titleCounter].text = title;
                this.titles[titleCounter].setPosition(0, 20);
                titleCounter++;
            }
        }
    }
}
