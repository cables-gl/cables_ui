CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlCable = class
{
    constructor(glPatch, splineDrawer, buttonRect, type)
    {
        this._buttonSize = 12;

        this._glPatch = glPatch;
        this._buttonRect = buttonRect;
        this._type = type;

        this._splineDrawer = splineDrawer;
        this._splineIdx = this._splineDrawer.getSplineIndex();

        this._buttonRect.setDecoration(1);
        this._buttonRect.visible = false;

        this._x = 0;
        this._y = 0;
        this._y2 = 0;
        this._x2 = 0;

        this._distFromPort = 0;
        this._updateDistFromPort();

        this._glPatch.on("mousemove", (e) =>
        {
            if (this._visible)
                this.collideMouse(this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort, this._glPatch.viewBox.mousePatchX, this._glPatch.viewBox.mousePatchY, 10);
        });
    }

    set visible(v)
    {
        this._visible = v;
        this._updateLinePos();
    }

    dispose()
    {
        this.setColor(0, 0, 0, 0);
        this._splineDrawer.deleteSpline(this._splineIdx);
    }

    _updateDistFromPort()
    {
        if (Math.abs(this._y - this._y2) < CABLES.GLGUI.VISUALCONFIG.portHeight * 2) this._distFromPort = CABLES.GLGUI.VISUALCONFIG.portHeight * 0.5;
        else this._distFromPort = CABLES.GLGUI.VISUALCONFIG.portHeight * 2.4; // magic number...?!
    }

    _updateLinePos()
    {
        this._updateDistFromPort();

        this._splineDrawer.setSpline(this._splineIdx,
            [
                this._x, this._y, 0,
                this._x, this._y - this._distFromPort, 0,
                this._x2, this._y2 + this._distFromPort, 0,
                this._x2, this._y2, 0,
            ]);

        if (this._visible)
        {
            // this._lineDrawer.setLine(this._lineIdx0, this._x, this._y, this._x, this._y - this._distFromPort);
            // this._lineDrawer.setLine(this._lineIdx1, this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort);
            // this._lineDrawer.setLine(this._lineIdx2, this._x2, this._y2 + this._distFromPort, this._x2, this._y2);
        }
        else
        {
            // this._lineDrawer.setLine(this._lineIdx0, 0, 0, 0, 0);
            // this._lineDrawer.setLine(this._lineIdx1, 0, 0, 0, 0);
            // this._lineDrawer.setLine(this._lineIdx2, 0, 0, 0, 0);
        }
    }

    setPosition(x, y, x2, y2)
    {
        this._x = x;
        this._y = y;
        this._x2 = x2;
        this._y2 = y2;

        this._updateLinePos();

        // circle button

        this._buttonRect.setDecoration(1);
        this._buttonRect.setSize(this._buttonSize, this._buttonSize);
        this._buttonRect.setPosition(
            x + ((x2 - x) / 2) - this._buttonSize / 2,
            (y + this._h) + (((y2 - this._h) - (y + this._h)) / 2) - this._buttonSize / 2,
            0.96
        );
    }


    setColor(r, g, b, a)
    {
        this._splineDrawer.setSplineColor(this._splineIdx, [r, g, b, a]);
        // this._lineDrawer.setColor(this._lineIdx0, r, g, b, a);
        // this._lineDrawer.setColor(this._lineIdx1, r, g, b, a);
        // this._lineDrawer.setColor(this._lineIdx2, r, g, b, a);

        this._buttonRect.setColor(r, g, b, a);
    }

    setSpeed(speed)
    {
        this._splineDrawer.setSplineSpeed(this._splineIdx, speed);
        // this._lineDrawer.setSpeed(this._lineIdx0, speed);
        // this._lineDrawer.setSpeed(this._lineIdx1, speed);
        // this._lineDrawer.setSpeed(this._lineIdx2, speed);
    }

    collideMouse(x1, y1, x2, y2, cx, cy, r)
    {
        // is either end INSIDE the circle?
        // if so, return true immediately
        const inside1 = this._collidePointCircle(x1, y1, cx, cy, r);
        const inside2 = this._collidePointCircle(x2, y2, cx, cy, r);
        if (inside1 || inside2) return true;

        // get length of the line
        let distX = x1 - x2;
        let distY = y1 - y2;
        const len = Math.sqrt((distX * distX) + (distY * distY));

        // get dot product of the line and circle
        const dot = (((cx - x1) * (x2 - x1)) + ((cy - y1) * (y2 - y1))) / Math.pow(len, 2);

        // find the closest point on the line
        const closestX = x1 + (dot * (x2 - x1));
        const closestY = y1 + (dot * (y2 - y1));

        // is this point actually on the line segment?
        // if so keep going, but if not, return false
        const onSegment = this._collideLinePoint(x1, y1, x2, y2, closestX, closestY);
        if (!onSegment) return false;

        // optionally, draw a circle at the closest
        // point on the line
        // fill(255, 0, 0);
        // noStroke();
        // ellipse(closestX, closestY, 20, 20);

        // get distance to closest point
        distX = closestX - cx;
        distY = closestY - cy;
        const distance = Math.sqrt((distX * distX) + (distY * distY));

        if (distance <= r)
        {
            this._buttonRect.setPosition(closestX - this._buttonSize / 2, closestY - this._buttonSize / 2);
            this._buttonRect.visible = true;
            this._buttonRect.interactive = true;
            this._buttonRect._hovering = true;

            return true;
        }
        else
        {
            this._buttonRect.setPosition(0, 0);

            this._buttonRect.interactive = false;
            this._buttonRect.visible = false;
            this._buttonRect._hovering = false;
            return false;
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
};
