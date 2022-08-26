import glUiConfig from "./gluiconfig";
import Logger from "../utils/logger";
import MouseState from "./mousestate";
import Gui from "../gui";

export default class glEditableSpline
{
    constructor(splineDrawer, rectInstancer, )
    {
        this._rectInstancer = rectInstancer;
        this._splineDrawer = splineDrawer;
        this._points3d = [];
        this._rects = [];
        this.snapToGrid = true;

        this._splineIdx = this._splineDrawer.getSplineIndex();
        this._splineDrawer.setSplineColor(this._splineIdx, [1, 0, 0, 1]);
        this.setPoints([
            30, 0,
            50, 20,
            100, 100,
            -10, -10]);
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

    snapX(x)
    {
        if (this.snapToGrid) return gui.patchView.snapOpPosX(x);
        else return x;
    }

    snapY(y)
    {
        if (this.snapToGrid) return gui.patchView.snapOpPosY(y);
        else return y;
    }

    setPoints(arr2d)
    {
        if (this.snapToGrid)
        {
            for (let i = 0; i < arr2d.length / 2; i++)
            {
                arr2d[i * 2 + 0] = this.snapX(arr2d[i * 2 + 0]);
                arr2d[i * 2 + 1] = this.snapY(arr2d[i * 2 + 1]);
            }
        }

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
            rect.setPosition(this.snapX(x), this.snapY(y));
            rect.setColor(1, 1, 1, 1);
            rect.interactive = true;
            rect.draggableMove = true;
            this._rects.push(rect);

            rect.on("drag", (e) =>
            {
                if (this.snapToGrid)
                {
                    rect.setPosition(this.snapX(e.x), this.snapY(e.y));
                    this._points3d[idx + 0] = this.snapX(e.x);
                    this._points3d[idx + 1] = this.snapY(e.y);
                }
                else
                {
                    this._points3d[idx + 0] = e.x;
                    this._points3d[idx + 1] = e.y;
                }
                this._points3d[idx + 0] += sizeHalf;
                this._points3d[idx + 1] += sizeHalf;
                this.updatePoints();
            });
        }
        this.updatePoints();
    }
}
