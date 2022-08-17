import glUiConfig from "./gluiconfig";
import Logger from "../utils/logger";
import MouseState from "./mousestate";
import Gui from "../gui";

export default class glSpline
{
    constructor(splineDrawer, rectInstancer, )
    {
        this._rectInstancer = rectInstancer;
        this._splineDrawer = splineDrawer;
        this._points3d = [];
        this._rects = [];

        this._splineIdx = this._splineDrawer.getSplineIndex();
        this._splineDrawer.setSplineColor(this._splineIdx, [1, 0, 0, 1]);
        this.setPoints([
            0, 0,
            500, 200,
            1000, 1000,
            -100, -100]);
    }

    updatePoints()
    {
        this._splineDrawer.setSpline(this._splineIdx, []); // TODO wtf is this needed
        this._splineDrawer.setSpline(this._splineIdx, this._points3d);
    }

    setPoints(arr2d)
    {
        this._points3d = [];
        for (let i = 0; i < arr2d.length / 2; i++)
        {
            let x = arr2d[i * 2 + 0];
            let y = arr2d[i * 2 + 1];
            this._points3d.push(x, y, 0);

            const idx = i * 3;

            const rect = this._rectInstancer.createRect({ "draggable": true });
            rect.setSize(10, 10);
            rect.setPosition(x, y);
            rect.setColor(0, 1, 0, 1);
            rect.interactive = true;
            rect.draggableMove = true;
            this._rects.push(rect);

            rect.on("drag", (e) =>
            {
                console.log(this._points3d);
                this._points3d[idx + 0] = e.x;
                this._points3d[idx + 1] = e.y;
                this.updatePoints();
            });
        }
        this.updatePoints();
    }
}
