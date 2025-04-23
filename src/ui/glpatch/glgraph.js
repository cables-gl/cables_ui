import GlSplineDrawer from "../gldraw/glsplinedrawer";

export default class GlGraph
{

    /**
     * @param {GlSplineDrawer} splineRenderer
     */
    constructor(splineRenderer)
    {
        this.numValues = 22;

        this._splineRenderer = splineRenderer;
        this._values = [];
        this._points = [];

        for (let i = 0; i < this.numValues; i++) this._values[i] = 0;
        for (let i = 0; i < this.numValues * 3; i++) this._points[i] = Math.random();

        this._scaleX = 6.01;
        this._scaleY = 31.01;

        this._width = 20;
        this._height = 10;

        this._idx = this._splineRenderer.getSplineIndex();
        this._splineRenderer.setSpline(this._idx, this._points);
        this._splineRenderer.setSplineColor(this._idx, [1, 1, 1, 1]);

        const z = 0.1;
        const zeroLine = this._splineRenderer.getSplineIndex();
        this._splineRenderer.setSpline(zeroLine, [0, 0, z, this._width * this._scaleX, 0, z]);
        this._splineRenderer.setSplineColor(zeroLine, [0.5, 0.5, 0.5, 1]);

        const upperLimitLine = this._splineRenderer.getSplineIndex();
        this._splineRenderer.setSpline(upperLimitLine, [0, this._height * this._scaleY, 0, this._width * this._scaleX, this._height * this._scaleY, 0]);
        this._splineRenderer.setSplineColor(upperLimitLine, [0.5, 0.5, 0.5, 1]);

        const leftLine = this._splineRenderer.getSplineIndex();
        this._splineRenderer.setSpline(leftLine, [0, 0, 0, 0, this._height * this._scaleY, 0]);
        this._splineRenderer.setSplineColor(leftLine, [0.5, 0.5, 0.5, 1]);

        const rightLine = this._splineRenderer.getSplineIndex();
        this._splineRenderer.setSpline(rightLine, [this._width * this._scaleX, 0, 0, this._width * this._scaleX, this._height * this._scaleY, 0]);
        this._splineRenderer.setSplineColor(rightLine, [0.5, 0.5, 0.5, 1]);

        this._splineRenderer.setWidth(0.12);
    }

    set(value)
    {
        // const points = [];
        // const start = Math.floor(this._anim.getLength() - 10);

        // for (let i = Math.floor(this._anim.getLength() * 10) / 10; i > 0; i -= 0.033)
        // {
        //     const x = 10 * this._scaleX + (i) * this._scaleX;
        //     if (x > 0) points.push(x, this._height * this._scaleY - this._anim.getValue(i) * this._scaleY, 0);
        // }

        // this._anim.clearBefore(time - 10);

        // this._splineRenderer.setSpline(this._idx, points);
        // this._anim.setValue(time, value);

        for (let i = this._values.length - 1; i > 0; i--)
        {
            this._values[i] = this._values[i - 1];
        }

        this._values[0] = value;
        // this._values.push(value);
        const points = [];

        for (let i = 0; i < this._values.length; i++)
        {
            points.push(i * this._scaleX, this._height * this._scaleY - this._values[i] * this._scaleY, 0);
            // points.push((i + 1) * this._scaleX, this._height * this._scaleY - this._values[i] * this._scaleY, 0);
        }

        this._splineRenderer.setSpline(this._idx, points);
        // this._splineRenderer.setSplineColor(this._idx, [0.5, 0.5, 0.5, 1]);
    }

    render(resX, resY, scrollX, scrollY, zoom)
    {
        this._splineRenderer.render(resX, resY, scrollX, scrollY, zoom);
    }
}
