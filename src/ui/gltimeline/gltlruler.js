import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";

export default class glTlRuler extends Events
{
    constructor(glTl)
    {
        super();
        this._glTl = glTl;

        this._glRectBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectBg.setSize(21000, 50);
        this._glRectBg.setColor(0.3, 0.3, 0.3, 1);


        this.markf = [];
        for (let i = 0; i < 300; i++)
        {
            const mr = this._glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2, 1);
            this.markf.push(mr);
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

    update()
    {
        let pixel1 = this._glTl.timeToPixel(1);
        let titleCounter = 0;
        for (let i = 0; i < this.titles.length; i++)
        {
            this.titles[i].text = "";
            this.titles[i].setParentRect(null);
        }

console.log(this._glTl.width)
        const oneframePixel = this._glTl.timeToPixel(1 / 30);
        if (oneframePixel >= 5)
        {
            for (let i = 0; i < this.markf.length; i++)
            {
                const mr = this.markf[i];
                const t = this._glTl.offsetSeconds + i * (1 / 30);
                const x = this._glTl.timeToPixel(t);
                const a = CABLES.map(oneframePixel, 5, 15, 0.04, 1);


                mr.setSize(oneframePixel - 1, 50);
                mr.setPosition(x, 0);
                mr.setColor(0.2, 0.2, 0.2, a);
            }
        }
        else
        {
            for (let i = 0; i < this.markf.length; i++)
                this.markf[i].setSize(0, 0);
        }

        for (let i = 0; i < this.marks.length; i++)
        {
            const mr = this.marks[i];
            let h = 10;
            let x = 0;
            let title = null;
            titleCounter %= this.titles.length;

            if (pixel1 > 50)
            {
                const t = this._glTl.offsetSeconds + i * 0.1;
                x = this._glTl.timeToPixel(t);
                if (t % 1 == 0.5)
                {
                    h = 15;
                }
                if (t % 1 == 0) // full seconds
                {
                    h = 20;
                    title = t + "s";
                }
            }
            else
            if (pixel1 < 4)
            {
                const t = this._glTl.offsetSeconds + (i * 10);
                x = this._glTl.timeToPixel(t);
                if (t % 30 == 0)
                {
                    h = 20;
                    title = t + "s";
                }
            }
            else
            if (pixel1 < 8)
            {
                const t = this._glTl.offsetSeconds + (i * 10);
                x = this._glTl.timeToPixel(t);
                if (t % 10 == 0)
                {
                    h = 20;
                    title = t + "s";
                }
            }
            else
            if (pixel1 < 50)
            {
                const t = this._glTl.offsetSeconds + i;
                x = this._glTl.timeToPixel(t);
                if (t % 1 == 0)
                {
                    h = 10;
                }
                if (t % 10 == 0)
                {
                    h = 20;
                    title = t + "s";
                }
                else if (t % 5 == 0)
                {
                    h = 15;
                    title = t + "s";
                }
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
