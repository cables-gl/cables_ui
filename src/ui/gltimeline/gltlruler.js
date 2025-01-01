import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";

export default class glTlRuler extends Events
{
    constructor(glTl)
    {
        super();
        this._glTl = glTl;

        this._glRectBg = this._glTl.rects.createRect({ "draggable": false });
        this._glRectBg.setSize(1000, 50);
        this._glRectBg.setColor(0.3, 0.3, 0.3, 1);


        this.markf = [];
        for (let i = 0; i < 100; i++)
        {
            const mr = this._glTl.rects.createRect({ "draggable": false });
            mr.setColor(0.2, 0.2, 0.2);
            this.markf.push(mr);
        }


        this.marks = [];
        for (let i = 0; i < 100; i++)
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
        let titleCounter = 0;
        for (let i = 0; i < this.titles.length; i++)
            this.titles[i].setParentRect(null);


        const oneframePixel = this._glTl.timeToPixel(1 / 30);
        if (oneframePixel >= 5)
        {
            for (let i = 0; i < this.markf.length; i++)
            {
                const mr = this.markf[i];
                const t = this._glTl.offsetSeconds + i * (1 / 30);
                const x = this._glTl.timeToPixel(t);
                const a = CABLES.map(oneframePixel, 5, 15, 0.04, 1);

                console.log(oneframePixel, a);

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
            const t = this._glTl.offsetSeconds + i * 0.1;
            let x = this._glTl.timeToPixel(t);
            let h = 10;

            if (t % 1 == 0) // full seconds
            {
                h = 20;
                this.titles[titleCounter].setParentRect(mr);
                this.titles[titleCounter].text = t + "s";
                this.titles[titleCounter].setPosition(0, h);
                titleCounter++;
            }

            mr.setColor(1, 1, 1, 0.4);
            mr.setSize(1, h);

            mr.setPosition(x, 0);
        }
    }
}
