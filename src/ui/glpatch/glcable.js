import GlUiConfig from "./gluiconfig";
import Logger from "../utils/logger";
import text from "../text";
import userSettings from "../components/usersettings";
import GlOp from "./glop";
import GlPort from "./glport";

export default class GlCable
{
    constructor(glPatch, splineDrawer, buttonRect, type, link, subpatch)
    {
        this.LINETYPE_CURVED = 0;
        this.LINETYPE_STRAIGHT = 1;
        this.LINETYPE_SIMPLE = 2;
        this.LINETYPE_HANGING = 3;

        this._log = new Logger("glcable");

        this._x = 0;
        this._y = 0;
        this._x2 = 0;
        this._y2 = 0;

        this._points = [];



        this._buttonSize = gui.theme.patch.cableButtonSize || 17;
        this._linetype = this.LINETYPE_CURVED;

        this._subPatch = subpatch;
        this._glPatch = glPatch;
        this._buttonRect = buttonRect;
        this._type = type;
        this._disposed = false;
        this._visible = true;
        if (link) this._visible = link.visible;

        this._link = link;

        this._splineDrawer = splineDrawer;
        this._splineIdx = this._splineDrawer.getSplineIndex();

        this._buttonRect.setShape(1);
        this._buttonRect.visible = false;

        this._buttonRect.on("hover", () =>
        {
            this.setCloseToMouse(true);
            this._link.cableHoverChanged(this, true);
            this.updateColor();
        });

        this._buttonRect.on("unhover", () =>
        {
            this._unHover();
        });

        gui.on("themeChanged", () =>
        {
            this._oldx = this._oldy = this._oldx2 = this._oldy2 = 0;
            this._buttonSize = gui.theme.patch.cableButtonSize || 17;
            this._setPositionButton();
            this._updateLinePos();
        });

        this._distFromPort = 0;
        this._updateDistFromPort();

        this.updateMouseListener();

        this.updateLineStyle();
        this.updateColor();
    }

    get subPatch() { return this._subPatch; }

    updateLineStyle()
    {
        this._oldx = this._oldy = this._oldx2 = this._oldy2 = 0;
        this._tension = 0.1;
        this._curvedSimple = false;
        const oldLineType = this._linetype;
        this._linetype = this.LINETYPE_CURVED;

        if (userSettings.get("linetype") == "simple") this._linetype = this.LINETYPE_SIMPLE;
        if (userSettings.get("linetype") == "straight") this._linetype = this.LINETYPE_STRAIGHT;
        if (userSettings.get("linetype") == "h1")
        {
            this._linetype = this.LINETYPE_HANGING;
            this._tension = 0.0;
        }
        if (userSettings.get("linetype") == "h2")
        {
            this._linetype = this.LINETYPE_HANGING;
            this._tension = 0.2;
        }
        if (userSettings.get("linetype") == "h3")
        {
            this._linetype = this.LINETYPE_HANGING;
            this._tension = 0.3;
        }

        this._updateDistFromPort();
        this._updateLinePos();
    }

    updateMouseListener()
    {
        if (this._visible)
        {
            if (!this._listenerMousemove)
                this._listenerMousemove = this._glPatch.on("mousemove", this._checkCollide.bind(this));
        }

        if ((!this._visible || this._disposed) && this._listenerMousemove)
        {
            this._glPatch.off(this._listenerMousemove);
            this._listenerMousemove = null;
        }
    }

    setCloseToMouse(b)
    {
        if (this._buttonRect.interactive != b)
        {
            this._buttonRect.visible =
            this._buttonRect.interactive = b;
            if (!b) this._unHover();
        }
    }

    _unHover()
    {
        this.setCloseToMouse(false);
        this._link.cableHoverChanged(this, false);
        this.updateColor();
    }

    updateVisible()
    {
        const old = this._visible;
        this._visible = (this._subPatch == this._glPatch.getCurrentSubPatch());
        if (this._disposed) this._visible = false;

        if (old != this._visible)
        {
            if (!this._visible) this.setCloseToMouse(false);
            this.updateMouseListener();
        }
    }

    set visible(v)
    {
        // is this even needed ? all cables are drawn because the splinedrawer is bound to a specific subpatch anyway....
        if (this._visible != v) this._oldx = null;
        this._visible = v;
        this._updateLinePos();
    }

    _checkCollide(e)
    {
        if (this._disposed) return;
        if (this._glPatch.isAreaSelecting) return;
        if (!this._visible) return false;
        if (this._subPatch != this._glPatch.getCurrentSubPatch()) return false;

        if (this._glPatch.isDraggingOps())
        {
            if (this._glPatch.getNumSelectedOps() == 1)
            {
                const op = this._glPatch.getOnlySelectedOp();
                const glop = this._glPatch.getGlOp(op);
                if (glop._displayType === glop.DISPLAY_SUBPATCH)
                {
                    // const portsIn = gui.patchView.getSubPatchExposedPorts(op.patchId.get(), CABLES.PORT_DIR_IN);
                    // const portsOut = gui.patchView.getSubPatchExposedPorts(op.patchId.get(), CABLES.PORT_DIR_OUT);

                    // if (portsIn.length < 1 || portsOut.lengh < 1 || !portsIn[0] || !portsOut[0]) return false;
                    // if (!(portsIn[0].type == portsOut[0].type == this._type)) return false;
                }
                else
                if (
                    op.portsIn.length > 0 &&
                    op.portsOut.length > 0)
                {
                    if (!(
                        op.portsIn[0].type == this._type &&
                        op.portsOut[0].type == this._type))
                        return false;
                }
            }
        }
        // else
        this.collideMouse(e, this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort, this._glPatch.viewBox.mousePatchX, this._glPatch.viewBox.mousePatchY, this._buttonSize * 0.4);
    }

    dispose()
    {
        this._disposed = true;

        this._splineDrawer.setSplineColor(this._splineIdx, [0, 0, 0, 1]);
        this._buttonRect.setColor(0, 0, 0, 1);

        this._splineDrawer.deleteSpline(this._splineIdx);
        this.updateVisible();
        this.updateMouseListener();
    }

    _updateDistFromPort()
    {
        if (this._linetype == this.LINETYPE_SIMPLE || this._curvedSimple)
        {
            this._distFromPort = 0;
            return;
        }
        if (Math.abs(this._y - this._y2) < GlUiConfig.portHeight * 2) this._distFromPort = GlUiConfig.portHeight * 0.5;
        else this._distFromPort = GlUiConfig.portHeight * 2.9; // magic number...?!
    }

    _subdivide(inPoints, divs)
    {
        const arr = [];
        const subd = divs || 4;
        let newLen = (inPoints.length - 4) * (subd - 1);

        if (newLen != arr.length) arr.length = Math.floor(Math.abs(newLen));
        let count = 0;

        function ip(x0, x1, x2, t)// Bezier
        {
            const r = (x0 * (1 - t) * (1 - t) + 2 * x1 * (1 - t) * t + x2 * t * t);
            return r;
        }

        for (let i = 3; i < inPoints.length - 3; i += 3)
        {
            for (let j = 0; j < subd; j++)
            {
                for (let k = 0; k < 3; k++)
                {
                    const p = ip(
                        (inPoints[i + k - 3] + inPoints[i + k]) / 2,
                        inPoints[i + k + 0],
                        (inPoints[i + k + 3] + inPoints[i + k + 0]) / 2,
                        j / subd
                    );
                    arr[count] = p;
                    count++;
                }
            }
        }

        return arr;
    }

    _updateLinePos()
    {
        if (this._disposed) return;
        this._updateDistFromPort();

        // "hanging" cables
        // this._splineDrawer.setSpline(this._splineIdx,
        //     this._subdivide(
        //         [
        //             this._x, this._y, 0,
        //             this._x, this._y, 0,
        //             this._x, this._y - this._distFromPort * 2.0, 0,
        //             this._x2, this._y2 + Math.abs((this._y2 - this._y)) * 1.7, 0,
        //             this._x2, this._y2, 0,
        //             this._x2, this._y2, 0,
        //         ]));


        if (this._oldx != this._x || this._oldy != this._y || this._oldx2 != this._x2 || this._oldy2 != this._y2)
        {
            let posX = this._oldx = this._x;
            let posX2 = this._oldy = this._y;
            this._oldx2 = this._x2;
            this._oldy2 = this._y2;

            if (this._x !== this._x2 !== 0)
            {
                posX = this._x + GlUiConfig.portWidth / 2 - 5;
                posX2 = this._x2 + GlUiConfig.portWidth / 2 - 5;
            }

            if (this._linetype == this.LINETYPE_CURVED)
            {
                if (this._x == this._x2 || Math.abs(this._x - this._x2) < 50)
                {
                    this._curvedSimple = true;
                    this._updateDistFromPort();

                    this._points = //this._subdivide(
                        [
                            posX, this._y, 0,
                            // posX, this._y, 0,
                            // posX2, this._y2, 0,
                            posX2, this._y2, 0
                        ];
                        //);

                    this._splineDrawer.setSpline(this._splineIdx, this._points);
                }
                else
                {
                    if (this._curvedSimple)
                    {
                        this._curvedSimple = false;
                        this._updateDistFromPort();
                    }

                    const distY = Math.abs(this._y - this._y2);

                    this._points =
                        [
                            posX, this._y, 0,
                            posX, this._y, 0,
                            posX, this._y - (distY * 0.002) - this._distFromPort * (gui.theme.patch.cablesCurveY || 1.25), 0,

                            (posX + posX2) * 0.5, (this._y + this._y2) * 0.5, 0, // center point

                            posX2, this._y2 + (distY * 0.002) + this._distFromPort * (gui.theme.patch.cablesCurveY || 1.25), 0,
                            posX2, this._y2, 0,
                            posX2, this._y2, 0,
                        ];


                    for (let i = 0; i < (gui.theme.patch.cablesSubDivde); i++)
                        this._points = this._subdivide(this._points);

                    this._splineDrawer.setSpline(this._splineIdx, this._points);
                }
            }
            else if (this._linetype == this.LINETYPE_HANGING)
            {
                if (this._x == this._x2 || Math.abs(this._x - this._x2) < 30)
                {
                    this._curvedSimple = true;
                    this._updateDistFromPort();
                    this.points = this._subdivide(
                        [
                            posX, this._y, 0,
                            posX, this._y, 0,
                            posX, this._y, 0,
                            posX2, this._y2, 0,
                            posX2, this._y2, 0,
                            posX2, this._y2, 0
                        ]);
                    this._splineDrawer.setSpline(this._splineIdx, this._points);
                }
                else
                {
                    if (this._curvedSimple)
                    {
                        this._curvedSimple = false;
                        this._updateDistFromPort();
                    }

                    const distY = Math.abs(this._y - this._y2);
                    const distX = Math.abs(this._x - this._x2);

                    let hang = (distX * 2.3 - (distY * 0.4)) * this._tension;


                    let centerX = (posX * 0.3 + posX2 * 0.7);
                    if (this._y > this._y2)centerX = (posX * 0.7 + posX2 * 0.3);

                    this._points = this._subdivide(
                        [
                            posX, this._y, 0,
                            posX, this._y, 0,
                            (posX * 0.99 + posX2 * 0.01), this._y - this._distFromPort * 0.5, 0, // TOP

                            centerX, (Math.max(this._y, this._y2) * 0.75 + Math.min(this._y, this._y2) * 0.3) + hang, 0, // * 0.5 - (0.001 * distY), 0,

                            posX2, this._y2 - this._distFromPort * 0.5, 0, // BOTTOM
                            posX2, this._y2, 0,
                            posX2, this._y2, 0,
                        ], 8);

                    this._splineDrawer.setSpline(
                        this._splineIdx,
                        this._points);
                // }
                }
            }
            else if (this._linetype == this.LINETYPE_STRAIGHT)
            {
                // straight lines...

                this._points = [
                    posX, this._y, 0,
                    posX, this._y - this._distFromPort, 0,
                    posX2, this._y2 + this._distFromPort, 0,
                    posX2, this._y2, 0
                ];

                this._splineDrawer.setSpline(this._splineIdx,
                    this._points);
            }
            if (this._linetype == this.LINETYPE_SIMPLE)
            {
                this._points = [
                    posX, this._y, 0,
                    posX, this._y, 0,
                    posX2, this._y2, 0,
                    posX2, this._y2, 0
                ];

                this._splineDrawer.setSpline(this._splineIdx, this._points);
            }
        }
        if (this._visible)
        {

            // this._lineDrawer.setLine(this._lineIdx0, this._x, this._y, this._x, this._y - this._distFromPort);
            // this._lineDrawer.setLine(this._lineIdx1, this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort);
            // this._lineDrawer.setLine(this._lineIdx2, this._x2, this._y2 + this._distFromPort, this._x2, this._y2);
        }
        else
        {
            // this._splineDrawer.hideSpline(this._splineIdx);

            // this._splineDrawer.setSpline(this._splineIdx,
            //     [
            //         0, 0, 0,
            //         0, 0, 0,
            //         0, 0, 0,
            //         0, 0, 0
            //     ]);


            // this._lineDrawer.setLine(this._lineIdx0, 0, 0, 0, 0);
            // this._lineDrawer.setLine(this._lineIdx1, 0, 0, 0, 0);
            // this._lineDrawer.setLine(this._lineIdx2, 0, 0, 0, 0);
        }
    }


    _setPositionButton()
    {
        this._buttonRect.setShape(1);
        this._buttonRect.setSize(this._buttonSize, this._buttonSize);
        this._buttonRect.setPosition(
            this._x + ((this._x2 - this._x) / 2) - this._buttonSize / 2,
            (this._y + this._buttonSize) + (((this._y2 - this._buttonSize) - (this._y + this._buttonSize)) / 2) - this._buttonSize / 2,
            GlUiConfig.zPosCableButtonRect);
    }

    setPosition(x, y, x2, y2)
    {
        if (!(this._x != x || this._y != y || this._x2 != x2 || this._y2 != y2)) return;

        this._x = x;
        this._y = y;
        this._x2 = x2;
        this._y2 = y2;

        this._updateLinePos();
        this._setPositionButton();

        this._buttonRect.visible = false;
    }

    get hovering()
    {
        return this._buttonRect._hovering || (this._glOpIn && this._glOpIn.hovering) || (this._glOpOut && this._glOpOut.hovering);
    }

    updateColor()
    {
        if (this._disposed)
        {
            // console.log((new Error()).stack);
            return;
        }

        let hover = this.hovering;
        let selected = false;

        if (this._link)
        {
            if (this._link.isAPortHovering())hover = true;
            if (this._link.isAOpSelected())selected = true;
        }


        const col = GlPort.getColor(this._link.type, false, false);

        this._splineDrawer.setSplineColor(this._splineIdx, col);
        this._splineDrawer.setSplineColorInactive(this._splineIdx, GlPort.getInactiveColor(this._link.type));
        this._splineDrawer.setSplineColorBorder(this._splineIdx, GlPort.getColorBorder(this._link.type, hover, selected));

        this._buttonRect.setColor(col[0], col[1], col[2], col[3]);
    }

    setColor(r, g, b, a)
    {
        this.updateColor();
    }

    isHoveredButtonRect()
    {
        if (this._glPatch.isDraggingPort()) return false;
        return this.collideMouse(null, this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort, this._glPatch.viewBox.mousePatchX, this._glPatch.viewBox.mousePatchY, 7);
    }

    setSpeed(speed)
    {
        this._splineDrawer.setSplineSpeed(this._splineIdx, speed);
    }

    collideLine(x1, y1, x2, y2)
    {
        if (!this._visible) return;
        for (let i = 0; i < this._points.length - 3; i += 3)
        {
            const found = this.collideLineLine(x1, y1, x2, y2, this._points[i + 0], this._points[i + 1], this._points[i + 3], this._points[i + 4]);

            if (found) return true;
        }
        return false;
    }

    collideMouse(e, x1, y1, x2, y2, cx, cy, r)
    {
        // if (this._glPatch.isDraggingPort()) return;
        // if (this._glPatch.isDraggingPort()) this._glPatch.showOpCursor(false);
        // canlink ???

        if (this._disposed)
        {
            this._log.warn("disposed already!!!?!");
        }

        const perf = CABLES.UI.uiProfiler.start("glcable collideMouse");

        // is either end INSIDE the circle?
        // if so, return true immediately
        const inside1 = this._collidePointCircle(x1, y1, cx, cy, r);
        const inside2 = this._collidePointCircle(x2, y2, cx, cy, r);
        if (inside1 || inside2)
        {
            perf.finish();
            return true;
        }

        // get length of the line
        let distX = x1 - x2;
        let distY = y1 - y2;
        const len = Math.sqrt((distX * distX) + (distY * distY));

        // get dot product of the line and circle
        const dot = (((cx - x1) * (x2 - x1)) + ((cy - y1) * (y2 - y1))) / len ** 2;

        // find the closest point on the line
        const closestX = x1 + (dot * (x2 - x1));
        const closestY = y1 + (dot * (y2 - y1));

        // is this point actually on the line segment?
        // if so keep going, but if not, return false
        const onSegment = this._collideLinePoint(x1, y1, x2, y2, closestX, closestY);

        if (!onSegment)
        {
            this.setCloseToMouse(false);

            perf.finish();
            return false;
        }

        // get distance to closest point
        distX = closestX - cx;
        distY = closestY - cy;

        const distance = Math.sqrt((distX * distX) + (distY * distY));
        const mouseOverLineAndOpButNotDragging = this._glPatch.isMouseOverOp() && !this._glPatch.isDraggingOps();


        if (distance <= r && !mouseOverLineAndOpButNotDragging)
        {
            const selectedOp = gui.patchView.getSelectedOps()[0];
            if (selectedOp && (!selectedOp.portsIn || !selectedOp.portsOut || selectedOp.portsIn.length == 0 || selectedOp.portsOut.length == 0)) return;



            if (
                this._glPatch.isDraggingOps() &&
                gui.patchView.getSelectedOps().length == 1 &&

                (
                    (this._link._glOpIn.op.id == selectedOp.id) ||
                    (this._link._glOpOut.op.id == selectedOp.id)
                )
            )
            {
                // no self hovering/linking


                return false;
            }

            // this.setColor();
            this.updateColor();
            this._buttonRect.setPosition(closestX - this._buttonSize / 2, closestY - this._buttonSize / 2, GlUiConfig.zPosCableButtonRect);

            this._glPatch._cablesHoverButtonRect = this._buttonRect;


            this.setCloseToMouse(true);

            this.updateColor();

            this._glPatch.setHoverLink(e, this._link);
            this._glPatch._dropInCircleRect = this._buttonRect;
            this._glPatch._dropInCircleLink = this._link;

            if (this._glPatch.cablesHoverText) this._glPatch.cablesHoverText.setPosition(closestX + 10, closestY - 10);

            gui.showInfo(text.linkAddCircle);

            perf.finish();
            return true;
        }
        else
        {
            if (this._buttonRect.visible) this._glPatch.setHoverLink(e, null);

            this.setCloseToMouse(false);

            perf.finish();
            return false;
        }
    }

    setText(t)
    {
        if (this._buttonRect._hovering && this._glPatch.cablesHoverText)
        {
            this._glPatch.cablesHoverText.text = t || "";
        }
    }

    _dist(x, y, x2, y2)
    {
        const distX = x - x2;
        const distY = y - y2;
        return Math.sqrt((distX * distX) + (distY * distY));
    }

    // POINT/CIRCLE
    _collidePointCircle(px, py, cx, cy, r)
    {
        // get distance between the point and circle's center
        // using the Pythagorean Theorem
        // const distX = px - cx;
        // const distY = py - cy;
        // const distance = Math.sqrt((distX * distX) + (distY * distY));
        const distance = this._dist(px, py, cx, cy);

        // if the distance is less than the circle's
        // radius the point is inside!
        if (distance <= r)
        {
            return true;
        }
        return false;
    }


    // LINE/POINT
    _collideLinePoint(x1, y1, x2, y2, px, py)
    {
        // get distance from the point to the two ends of the line
        const d1 = this._dist(px, py, x1, y1);
        const d2 = this._dist(px, py, x2, y2);

        // get the length of the line
        const lineLen = this._dist(x1, y1, x2, y2);

        // since  are so minutely accurate, add
        // a little buffer zone that will give collision
        const buffer = 0.1; // higher # = less accurate

        // if the two distances are equal to the line's
        // length, the point is on the line!
        // note we use the buffer here to give a range,
        // rather than one #
        if (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer)
        {
            return true;
        }
        return false;
    }

    collideLineLine(x1, y1, x2, y2, x3, y3, x4, y4)
    {
        // calculate the distance to intersection point
        let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

        // if uA and uB are between 0-1, lines are colliding
        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1)
        {
            // optionally, draw a circle where the lines meet
            let intersectionX = x1 + (uA * (x2 - x1));
            let intersectionY = y1 + (uA * (y2 - y1));
            //   fill(255,0,0);
            //   noStroke();
            //   ellipse(intersectionX,intersectionY, 20,20);

            return true;
        }
        return false;
    }
}
