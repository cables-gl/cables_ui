import { Logger } from "cables-shared-client";
import gluiconfig from "./gluiconfig.js";
import { GuiText } from "../text.js";
import GlPort from "./glport.js";
import Gui, { gui } from "../gui.js";
import { userSettings } from "../components/usersettings.js";
import GlPatch from "./glpatch.js";
import { GlSplineDrawer } from "../gldraw/glsplinedrawer.js";
import GlRect from "../gldraw/glrect.js";
import GlLink from "./gllink.js";

/**
 * rendering cables for links
 *
 * @export
 * @class GlCable
 */
export default class GlCable
{
    LINETYPE_CURVED = 0;
    LINETYPE_STRAIGHT = 1;
    LINETYPE_SIMPLE = 2;
    LINETYPE_HANGING = 3;

    #buttonSize;
    #x = 0;
    #y = 0;
    #x2 = 0;
    #y2 = 0;
    #linetype = this.LINETYPE_CURVED;
    #points = [];
    #disposed = false;
    #visible = true;
    #distFromPort = 0;

    #buttonRect = null;

    /** @type {GlLink} */
    #link = null;
    #tension = 0.1;
    #curvedSimple = false;
    #log = null;

    /** @type {GlPatch} */
    #glPatch = null;
    #subPatch = null;
    #type = null;
    #splineIdx = null;

    /** @type {GlSplineDrawer} */
    #splineDrawer = null;

    /**
     * @param {GlPatch} glPatch
     * @param {GlSplineDrawer} splineDrawer
     * @param {GlRect} buttonRect
     * @param {number} type
     * @param {GlLink} link
     * @param {String} subpatch
     */
    constructor(glPatch, splineDrawer, buttonRect, type, link, subpatch)
    {
        this.#log = new Logger("glcable");

        this.#buttonSize = gui.theme.patch.cableButtonSize || 17;

        this.#subPatch = subpatch;
        this.#glPatch = glPatch;
        this.#buttonRect = buttonRect;
        this.#type = type;
        if (link) this.#visible = link.visible;

        this.#link = link;

        this.#splineDrawer = splineDrawer;
        this.#splineIdx = this.#splineDrawer.getSplineIndex();

        this.#buttonRect.setShape(1);
        this.#buttonRect.visible = false;

        this.#buttonRect.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            this.setCloseToMouse(true);
            this.#link.cableHoverChanged();
            this.updateColor();
        });

        this.#buttonRect.on(GlRect.EVENT_POINTER_UNHOVER, () =>
        {
            this.setCloseToMouse(false);
            this.#link.cableHoverChanged();
            this.#unHover();
        });

        gui.on(Gui.EVENT_THEMECHANGED, () =>
        {
            this._oldx = this._oldy = this._oldx2 = this._oldy2 = 0;
            this.#buttonSize = gui.theme.patch.cableButtonSize || 17;
            this.#setPositionButton();
            this.#updateLinePos();
        });

        this.#updateDistFromPort();

        this.updateMouseListener();

        this.updateLineStyle();
        this.updateColor();
    }

    get subPatch() { return this.#subPatch; }

    updateLineStyle()
    {
        this._oldx = this._oldy = this._oldx2 = this._oldy2 = 0;
        // const oldLineType = this._linetype;
        this.#linetype = this.LINETYPE_CURVED;

        if (userSettings.get("linetype") == "simple") this.#linetype = this.LINETYPE_SIMPLE;
        if (userSettings.get("linetype") == "straight") this.#linetype = this.LINETYPE_STRAIGHT;
        if (userSettings.get("linetype") == "h1")
        {
            this.#linetype = this.LINETYPE_HANGING;
            this.#tension = 0.0;
        }
        if (userSettings.get("linetype") == "h2")
        {
            this.#linetype = this.LINETYPE_HANGING;
            this.#tension = 0.2;
        }
        if (userSettings.get("linetype") == "h3")
        {
            this.#linetype = this.LINETYPE_HANGING;
            this.#tension = 0.3;
        }

        this.#updateDistFromPort();
        this.#updateLinePos();
    }

    updateMouseListener()
    {
        if (this.#visible)
        {
            if (!this._listenerMousemove)
                this._listenerMousemove = this.#glPatch.on("mousemove", this._checkCollide.bind(this));
        }

        if ((!this.#visible || this.#disposed) && this._listenerMousemove)
        {
            this.#glPatch.off(this._listenerMousemove);
            this._listenerMousemove = null;
        }
    }

    /**
     * @param {boolean} b
     */
    setCloseToMouse(b)
    {
        if (this.#buttonRect.interactive != b)
        {
            this.#buttonRect.visible =
            this.#buttonRect.interactive = b;
            if (!b) this.#unHover();

        }
    }

    #unHover()
    {
        this.setCloseToMouse(false);
        this.#link.cableHoverChanged();
        this.updateColor();
    }

    updateVisible()
    {
        const old = this.#visible;
        this.#visible = (this.#subPatch == this.#glPatch.getCurrentSubPatch());
        if (this.#disposed) this.#visible = false;

        if (old != this.#visible)
        {
            if (!this.#visible) this.setCloseToMouse(false);
            this.updateMouseListener();
        }
    }

    /**
     * @param {boolean} v
     */
    set visible(v)
    {
        // is this even needed ? all cables are drawn because the splinedrawer is bound to a specific subpatch anyway....
        if (this.#visible != v) this._oldx = null;
        this.#visible = v;
        this.#updateLinePos();
    }

    _checkCollide(e)
    {
        if (this.#disposed) return;
        if (this.#glPatch.isAreaSelecting) return;
        if (!this.#visible) return false;
        if (this.#subPatch != this.#glPatch.getCurrentSubPatch()) return false;

        if (this.#glPatch.isDraggingOps())
        {
            if (this.#glPatch.getNumSelectedOps() == 1)
            {
                const op = this.#glPatch.getOnlySelectedOp();
                const glop = this.#glPatch.getGlOp(op);
                if (glop.displayType === glop.DISPLAY_SUBPATCH)
                {
                }
                else
                if (op.portsIn.length > 0 && op.portsOut.length > 0)
                {
                    if (!(
                        op.getFirstPortIn() &&
                        op.getFirstPortOut() &&
                        op.getFirstPortIn().type == this.#type &&
                        op.getFirstPortOut().type == this.#type))
                        return false;
                }
            }
        }

        this.collideMouse(e, this.#x, this.#y - this.#distFromPort, this.#x2, this.#y2 + this.#distFromPort, this.#glPatch.viewBox.mousePatchX, this.#glPatch.viewBox.mousePatchY, this.#buttonSize * 0.4);
    }

    dispose()
    {
        this.#disposed = true;

        this.#splineDrawer.setSplineColor(this.#splineIdx, [0, 0, 0, 1]);
        this.#buttonRect.setColor(0, 0, 0, 1);

        this.#splineDrawer.deleteSpline(this.#splineIdx);
        this.updateVisible();
        this.updateMouseListener();
        return null;
    }

    #updateDistFromPort()
    {
        if (this.#linetype == this.LINETYPE_SIMPLE || this.#curvedSimple)
        {
            this.#distFromPort = 0;
            return;
        }
        if (Math.abs(this.#y - this.#y2) < gluiconfig.portHeight * 2) this.#distFromPort = gluiconfig.portHeight * 0.5;
        else this.#distFromPort = gluiconfig.portHeight * 2.9; // magic number...?!
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

        arr.push(inPoints[inPoints.length - 3], inPoints[inPoints.length - 2], inPoints[inPoints.length - 1]);
        arr.unshift(inPoints[0], inPoints[1], inPoints[2]);

        return arr;
    }

    #updateLinePos()
    {
        if (this.#disposed) return;
        this.#updateDistFromPort();

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

        if (this._oldx != this.#x || this._oldy != this.#y || this._oldx2 != this.#x2 || this._oldy2 != this.#y2)
        {
            let posX = this._oldx = this.#x;
            let posX2 = this._oldy = this.#y;
            this._oldx2 = this.#x2;
            this._oldy2 = this.#y2;

            if (this.#x !== 0 && this.#x2 !== 0)
            {
                posX = this.#x + gluiconfig.portWidth / 2 - 5;
                posX2 = this.#x2 + gluiconfig.portWidth / 2 - 5;
            }

            if (this.#linetype == this.LINETYPE_CURVED)
            {
                if (this.#x == this.#x2 || Math.abs(this.#x - this.#x2) < 50)
                {
                    this.#curvedSimple = true;
                    this.#updateDistFromPort();

                    this.#points = // this._subdivide(
                        [
                            posX, this.#y, gluiconfig.zPosCables,
                            // posX, this._y, gluiconfig.zPosCables,
                            posX2, this.#y2, gluiconfig.zPosCables,
                            posX2, this.#y2, gluiconfig.zPosCables
                        ];
                    // );

                    this.#splineDrawer.setSpline(this.#splineIdx, this.#points);
                }
                else
                {
                    if (this.#curvedSimple)
                    {
                        this.#curvedSimple = false;
                        this.#updateDistFromPort();
                    }

                    const distY = Math.abs(this.#y - this.#y2);

                    this.#points =
                        [
                            posX, this.#y, gluiconfig.zPosCables,
                            posX, this.#y - (distY * 0.002) - this.#distFromPort * (gui.theme.patch.cablesCurveY || 1.25), gluiconfig.zPosCables,

                            (posX + posX2) * 0.5, (this.#y + this.#y2) * 0.5, gluiconfig.zPosCables, // center point

                            posX2, this.#y2 + (distY * 0.002) + this.#distFromPort * (gui.theme.patch.cablesCurveY || 1.25), gluiconfig.zPosCables,
                            posX2, this.#y2, gluiconfig.zPosCables,
                            posX2, this.#y2, gluiconfig.zPosCables

                        ];

                    // console.log(gui.theme.patch.cablesSubDivde);
                    // for (let i = 0; i < (gui.theme.patch.cablesSubDivde); i++)
                    this.#points = this._subdivide(this.#points, 5);

                    // this._points.unshift(posX, this._y, 0);
                    // this._points.unshift(posX, this._y, 0);
                    // this._points.unshift(posX, this._y, 0);
                    // this._points.unshift(posX, this._y, 0);
                    // this._points.push(posX2, this._y2, 0);
                    // this._points.push(posX2, this._y2, 0);

                    this.#splineDrawer.setSpline(this.#splineIdx, this.#points);
                }
            }
            else if (this.#linetype == this.LINETYPE_STRAIGHT)
            {
                // straight lines...

                this.#points = [
                    posX, this.#y, gluiconfig.zPosCables,
                    posX, this.#y - this.#distFromPort, gluiconfig.zPosCables,
                    posX2, this.#y2 + this.#distFromPort, gluiconfig.zPosCables,
                    posX2, this.#y2, gluiconfig.zPosCables
                ];

                this.#splineDrawer.setSpline(this.#splineIdx, this.#points);
            }
            if (this.#linetype == this.LINETYPE_SIMPLE)
            {
                this.#points = [
                    posX, this.#y, gluiconfig.zPosCables,
                    posX, this.#y, gluiconfig.zPosCables,
                    posX2, this.#y2, gluiconfig.zPosCables,
                    posX2, this.#y2, gluiconfig.zPosCables
                ];

                this.#splineDrawer.setSpline(this.#splineIdx, this.#points);
            }
        }
        if (this.#visible)
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

    #setPositionButton()
    {
        this.#buttonRect.setShape(1);
        this.#buttonRect.setSize(this.#buttonSize, this.#buttonSize);
        this.#buttonRect.setPosition(
            this.#x + ((this.#x2 - this.#x) / 2) - this.#buttonSize / 2,
            (this.#y + this.#buttonSize) + (((this.#y2 - this.#buttonSize) - (this.#y + this.#buttonSize)) / 2) - this.#buttonSize / 2,
            gluiconfig.zPosCableButtonRect);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} x2
     * @param {number} y2
     */
    setPosition(x, y, x2, y2)
    {
        if (!(this.#x != x || this.#y != y || this.#x2 != x2 || this.#y2 != y2)) return;

        this.#x = x;
        this.#y = y;

        this.#x2 = x2;
        this.#y2 = y2;

        this.#updateLinePos();
        this.#setPositionButton();

        this.#buttonRect.visible = false;
    }

    get hovering()
    {
        const h = this.#buttonRect.isHovering();// || (this.#link.opIn && this.#link.opIn.isHovering()) || (this.#link.opOut && this.#link.opOut.isHovering());
        return h;
    }

    updateColor()
    {
        if (this.#disposed) return;

        let hover = this.hovering;
        let selected = false;

        if (this.#link)
        {
            if (this.#link.isAPortHovering())hover = true;
            if (this.#link.isAOpSelected())selected = true;
        }

        const col = GlPort.getColor(this.#link.type, false, false);

        this.#splineDrawer.setSplineColor(this.#splineIdx, col);
        this.#splineDrawer.setSplineColorInactive(this.#splineIdx, GlPort.getInactiveColor(this.#link.type));
        this.#splineDrawer.setSplineColorBorder(this.#splineIdx, GlPort.getCableColorBorder(this.#link.type, hover, selected));

        this.#buttonRect.setColor(col[0], col[1], col[2], col[3]);
    }

    setColor()
    {
        this.updateColor();
    }

    isHoveredButtonRect()
    {
        if (this.#glPatch.isDraggingPort()) return false;
        return this.collideMouse(null, this.#x, this.#y - this.#distFromPort, this.#x2, this.#y2 + this.#distFromPort, this.#glPatch.viewBox.mousePatchX, this.#glPatch.viewBox.mousePatchY, 7);
    }

    /**
     * @param {number} speed
     */
    setSpeed(speed)
    {
        if (this.#glPatch.vizFlowMode != 0)
            this.#splineDrawer.setSplineSpeed(this.#splineIdx, speed);
    }

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    collideLine(x1, y1, x2, y2)
    {
        if (!this.#visible) return;
        for (let i = 0; i < this.#points.length - 3; i += 3)
        {
            const found = this.collideLineLine(x1, y1, x2, y2, this.#points[i + 0], this.#points[i + 1], this.#points[i + 3], this.#points[i + 4]);

            if (found) return true;
        }
        return false;
    }

    /**
     * @param {MouseEvent} e
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} cx
     * @param {number} cy
     * @param {number} r
     */
    collideMouse(e, x1, y1, x2, y2, cx, cy, r)
    {
        // if (this._glPatch.isDraggingPort()) return;
        // if (this._glPatch.isDraggingPort()) this._glPatch.showOpCursor(false);
        // canlink ???

        if (this.#disposed)
        {
            this.#log.warn("disposed already!!!?!");
        }

        const perf = gui.uiProfiler.start("glcable collideMouse");

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
        const mouseOverLineAndOpButNotDragging = this.#glPatch.isMouseOverOp() && !this.#glPatch.isDraggingOps();

        if (distance <= r && !mouseOverLineAndOpButNotDragging)
        {
            const selectedOp = gui.patchView.getSelectedOps()[0];
            if (selectedOp && (!selectedOp.portsIn || !selectedOp.portsOut || selectedOp.portsIn.length == 0 || selectedOp.portsOut.length == 0)) return;

            if (
                this.#glPatch.isDraggingOps() &&
                gui.patchView.getSelectedOps().length == 1 &&

                (
                    (this.#link.opIn.op.id == selectedOp.id) ||
                    (this.#link.opOut.op.id == selectedOp.id)
                )
            )
            {
                // no self hovering/linking
                return false;
            }

            this.updateColor();
            this.#buttonRect.setPosition(closestX - this.#buttonSize / 2, closestY - this.#buttonSize / 2, gluiconfig.zPosCableButtonRect);

            this.#glPatch._cablesHoverButtonRect = this.#buttonRect;

            this.setCloseToMouse(true);

            this.updateColor();

            this.#glPatch.setHoverLink(e, this.#link);
            this.#glPatch._dropInCircleRect = this.#buttonRect;
            this.#glPatch._dropInCircleLink = this.#link;

            if (this.#glPatch.cablesHoverText) this.#glPatch.cablesHoverText.setPosition(closestX + 10, closestY - 10);

            gui.showInfo(GuiText.linkAddCircle);

            perf.finish();
            return true;
        }
        else
        {
            if (this.#buttonRect.visible) this.#glPatch.setHoverLink(e, null);

            this.setCloseToMouse(false);

            perf.finish();
            return false;
        }
    }

    /**
     * @param {string} t
     */
    setText(t)
    {
        if (this.#buttonRect.isHovering && this.#glPatch.cablesHoverText)
        {
            this.#glPatch.cablesHoverText.text = t || "";
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} x2
     * @param {number} y2
     */
    _dist(x, y, x2, y2)
    {
        const distX = x - x2;
        const distY = y - y2;
        return Math.sqrt((distX * distX) + (distY * distY));
    }

    // POINT/CIRCLE
    /**
     * @param {number} px
     * @param {number} py
     * @param {number} cx
     * @param {number} cy
     * @param {number} r
     */
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
    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} px
     * @param {number} py
     */
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

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {number} x4
     * @param {number} y4
     */
    collideLineLine(x1, y1, x2, y2, x3, y3, x4, y4)
    {
        // calculate the distance to intersection point
        let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

        // if uA and uB are between 0-1, lines are colliding
        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1)
        {
            // optionally, draw a circle where the lines meet
            // let intersectionX = x1 + (uA * (x2 - x1));
            // let intersectionY = y1 + (uA * (y2 - y1));

            return true;
        }
        return false;
    }
}
