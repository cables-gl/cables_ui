import glUiConfig from "./gluiconfig";
import Logger from "../utils/logger";
import MouseState from "./mousestate";
import Gui from "../gui";

export default class glSpline
{
    constructor(splineDrawer, rectInstancer,)
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

        // const lastPointIdx = this._rects.length * 3;
        // this._points3d.length = this._rects.length * 3;
        // this._points3d[lastPointIdx - 2] = this._points3d[lastPointIdx - 5];
        // this._points3d[lastPointIdx - 1] = this._points3d[lastPointIdx - 4];
        // this._points3d[lastPointIdx - 0] = this._points3d[lastPointIdx - 3];

        this._splineDrawer.setSpline(this._splineIdx, this._points3d);
    }

    setPoints(arr2d)
    {
        this._points3d = [];
        const size = 10;
        const sizeHalf = size / 2;
        for (let i = 0; i < arr2d.length / 2; i++)
        {
            let x = arr2d[i * 2 + 0];
            let y = arr2d[i * 2 + 1];
            this._points3d.push(x + sizeHalf, y + sizeHalf, 0);

            const idx = i * 3;

            const rect = this._rectInstancer.createRect({ "draggable": true });
            rect.setSize(10, 10);
            rect.setPosition(x, y);
            rect.setColor(1, 1, 1, 1);
            rect.interactive = true;
            rect.draggableMove = true;
            this._rects.push(rect);

            rect.on("drag", (e) =>
            {
                this._points3d[idx + 0] = e.x + sizeHalf;
                this._points3d[idx + 1] = e.y + sizeHalf;
                this.updatePoints();
            });
        }
        this.updatePoints();
    }
}
