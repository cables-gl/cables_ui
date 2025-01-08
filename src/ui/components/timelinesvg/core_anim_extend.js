import uiconfig from "../../uiconfig.js";
import undo from "../../utils/undo.js";

export default function extendCoreAnim()
{
    CABLES.ANIM.Key.prototype.isUI = true;
    CABLES.ANIM.Key.prototype.circle = null;
    CABLES.ANIM.Key.prototype.circleBezierOut = null;
    CABLES.ANIM.Key.prototype.circleBezierIn = null;
    CABLES.ANIM.Key.prototype.selected = false;
    CABLES.ANIM.Key.prototype.showCircle = true;

    CABLES.ANIM.Key.prototype.setAttribs = function (sel)
    {
        this.circle.node.classList.add("timeline-key");
        this.circle.attr({ "cx": this.x, "cy": this.y }); // ,"fill-opacity":opa,fill:fill

        if (this.selected) this.circle.node.classList.add("timeline-key-selected"); // this.circle.attr({ fill:"white" });
        else this.circle.node.classList.remove("timeline-key-selected");
    };

    CABLES.ANIM.Key.prototype.setSelected = function (sel)
    {
        this.selected = sel;
        this.setAttribs();
    };

    CABLES.ANIM.Key.prototype.removeUi = function ()
    {
        if (this.bezierControlLineOut)
        {
            this.bezierControlLineOut.undrag();
            this.bezierControlLineOut.remove();
            this.bezierControlLineOut = false;
        }

        if (this.bezierControlLineIn)
        {
            this.bezierControlLineIn.undrag();
            this.bezierControlLineIn.remove();
            this.bezierControlLineIn = false;
        }

        if (this.circleBezierOut)
        {
            this.circleBezierOut.undrag();
            this.circleBezierOut.remove();
            this.circleBezierOut = false;
        }

        if (this.circleBezierIn)
        {
            this.circleBezierIn.undrag();
            this.circleBezierIn.remove();
            this.circleBezierIn = false;
        }

        if (this.circle)
        {
            this.circle.undrag();
            this.circle.remove();
            this.circle = false;
        }
    };


    CABLES.ANIM.Key.prototype.isMainAnim = false;

    CABLES.ANIM.Key.prototype.updateCircle = function (_isMainAnim)
    {
        if (_isMainAnim !== undefined) this.isMainAnim = _isMainAnim;

        if (!gui.timeLine()) return;
        if (!this.circle) this.initUI();
        if (this.getEasing() == CABLES.ANIM.EASING_CUBICSPLINE && !this.circleBezierOut) this.initUI();

        if (isNaN(this.value)) this.value = 0;

        this.x = this.time * CABLES.ANIM.TIMESCALE;
        this.y = this.value * -CABLES.ANIM.VALUESCALE;

        if (!this.showCircle) this.circle.hide();
        else this.circle.show();

        if (this.getEasing() == CABLES.ANIM.EASING_CUBICSPLINE)
        {
            const posBezX = this.x + this.bezTime * CABLES.ANIM.TIMESCALE;
            const posBezY = this.y + this.bezValue * CABLES.ANIM.VALUESCALE;
            this.circleBezierOut.attr({ "cx": posBezX, "cy": posBezY });

            const posBezXIn = this.x + this.bezTimeIn * CABLES.ANIM.TIMESCALE;
            const posBezYIn = this.y + this.bezValueIn * CABLES.ANIM.VALUESCALE;
            this.circleBezierIn.attr({ "cx": posBezXIn, "cy": posBezYIn });

            const pathOut = "M " + this.x + " " + this.y + " L " + posBezX + " " + posBezY;
            const pathIn = "M " + this.x + " " + this.y + " L " + posBezXIn + " " + posBezYIn;

            this.bezierControlLineOut.attr({ "path": pathOut, "stroke": "#888", "stroke-width": 1 });
            this.bezierControlLineIn.attr({ "path": pathIn, "stroke": "#888", "stroke-width": 1 });
        }

        if (isNaN(this.x))
        {
            this.x = 0;
            console.log("key this.x NaN");
        }
        if (isNaN(this.y))
        {
            this.y = 0;
            console.log("key this.x NaN");
        }

        this.setAttribs();
        if (this.isMainAnim) this.circle.toFront();
    };

    CABLES.ANIM.Key.prototype.initUI = function ()
    {
        if (!gui.timeLine()) return;
        const self = this;

        this.x = this.time * CABLES.ANIM.TIMESCALE;
        this.y = this.value * -CABLES.ANIM.VALUESCALE;

        this.bezX = this.x + this.bezTime * CABLES.ANIM.TIMESCALE;
        this.bezY = this.y + this.bezValue * CABLES.ANIM.VALUESCALE;

        const discattr = { "fill": uiconfig.colorKey, "stroke": "none" };

        if (this.circle)
        {
            this.removeUi();
        }

        if (this.getEasing() == CABLES.ANIM.EASING_CUBICSPLINE)
        {
            if (!this.circleBezierOut)
                this.circleBezierOut = gui.timeLine().getPaper().circle(this.bezX, this.bezY, 7);

            this.circleBezierOut.attr({ "fill": "#fff", "fill-opacity": 0.7 });

            if (!this.circleBezierIn)
                this.circleBezierIn = gui.timeLine().getPaper().circle(this.bezXIn, this.bezYIn, 7);

            this.circleBezierIn.attr({ "fill": "#f00", "fill-opacity": 0.7 });

            if (!this.bezierControlLineOut)
                this.bezierControlLineOut = gui.timeLine().getPaper().path("M 0 0 ");

            if (!this.bezierControlLineIn)
                this.bezierControlLineIn = gui.timeLine().getPaper().path("M 0 0 ");
        }

        this.circle = gui.timeLine().getPaper().circle(this.x, this.y, 5);
        this.circle.attr(discattr);
        this.circle.toFront();

        this.circle.node.onclick = function (e)
        {
            ele.byId("timeline").focus();
            if (!e.shiftKey) gui.timeLine().unselectKeys();

            if (e.shiftKey && self.selected) self.setSelected(false);
            else self.setSelected(true);
        };

        let oldValues = {};

        let startMoveX = -1;
        let startMoveY = -1;

        this.doMoveFinished = function ()
        {
            startMoveX = -1;
            startMoveY = -1;
            if (gui.metaKeyframes)gui.metaKeyframes.update();
            self.isDragging = false;
        };


        this.doMove = function (dx, dy, a, b, e, newPos)
        {
            if (!this.showCircle) return;

            if (startMoveX == -1)
            {
                startMoveX = newPos.x - self.x;
                startMoveY = newPos.y - self.y;
            }

            newPos.x -= startMoveX;
            newPos.y -= startMoveY;

            let time = gui.timeLine().getTimeFromPaper(newPos.x);
            const frame = parseInt((time + 0.5 * 1 / gui.timeLine().getFPS()) * gui.timeLine().getFPS(), 10);
            time = frame / gui.timeLine().getFPS();


            if (CABLES.ANIM.MoveMode === 0)
            {
                self.set({ time, "value": self.value });
                // self.updateCircle();
            }
            if (CABLES.ANIM.MoveMode == 1)
            {
                self.set({ time, "value": newPos.y / -CABLES.ANIM.VALUESCALE });
                // self.updateCircle();
            }
            if (CABLES.ANIM.MoveMode == 2)
            {
                self.set({ time, "value": newPos.y / -CABLES.ANIM.VALUESCALE });
                // self.updateCircle();
            }
        };

        function move(dx, dy, a, b, e)
        {
            ele.byId("timeline").focus();

            self.isDragging = true;
            if (!self.selected)
            {
                gui.timeLine().unselectKeys();
                self.setSelected(true);
            }
            gui.timeLine().moveSelectedKeys(dx, dy, a, b, e);
        }

        function down()
        {
            if (!self.isDragging)
            {
                oldValues = self.getSerialized();
            }
            self.isDragging = true;
        }

        function up()
        {
            gui.timeLine().moveSelectedKeysFinished();

            undo.add({
                "title": "timeline move keys",
                undo()
                {
                    self.set(oldValues);
                    gui.timeLine().refresh();
                },
                redo()
                {
                }
            });

            if (gui.metaKeyframes)gui.metaKeyframes.update();

            self.isDragging = false;
        }

        this.circle.drag(move, down, up);

        // --------

        function moveBezierOut(dx, dy, a, b, e)
        {
            self.isDragging = true;
            const newPos = gui.timeLine().getCanvasCoordsMouse(e);
            const newTime = gui.timeLine().getTimeFromPaper(newPos.x);
            const t = self.time;
            const v = self.value;
            const newValue = newPos.y / CABLES.ANIM.VALUESCALE;

            self.setBezierControlOut(newTime - t, newValue + v);
            self.updateCircle();
        }

        function upBezierOut()
        {
            self.isDragging = false;
            self.x = -1;
            self.y = -1;
        }

        if (self.circleBezierOut) self.circleBezierOut.drag(moveBezierOut, upBezierOut);

        // --------

        function moveBezierIn(dx, dy, a, b, e)
        {
            self.isDragging = true;
            const newPos = gui.timeLine().getCanvasCoordsMouse(e);
            const newTime = gui.timeLine().getTimeFromPaper(newPos.x);
            const t = self.time;
            const v = self.value;
            const newValue = newPos.y / CABLES.ANIM.VALUESCALE;

            self.setBezierControlIn(newTime - t, newValue + v);
            self.updateCircle();
        }

        function upBezierIn()
        {
            self.isDragging = false;
            self.x = -1;
            self.y = -1;
        }

        if (self.circleBezierIn) self.circleBezierIn.drag(moveBezierIn, upBezierIn);
    };


    // -----------------------------------------------


    CABLES.Anim.prototype.hasSelectedKeys = function ()
    {
        for (const i in this.keys) if (this.keys[i].selected) return true;
    };

    CABLES.Anim.prototype.moveKeyAt = function (t, nt)
    {
        for (const i in this.keys)
            if (this.keys[i].time == t)
            {
                this.keys[i].time = nt;
                this.sortKeys();
            }
    };

    CABLES.Anim.prototype.show = function ()
    {
        if (gui.timeLine())
            if (!this.keyLine)
                this.keyLine = gui.timeLine().getPaper().path("M 0 0 L 0 1");
    };

    CABLES.Anim.prototype.removeUi = function ()
    {
        if (this.keyLine)
        {
            this.keyLine.hide();
            this.keyLine.remove();
            this.keyLine = false;
        }

        for (const i in this.keys)
            this.keys[i].removeUi();
    };

    CABLES.Anim.prototype.unselectKeys = function ()
    {
        for (const i in this.keys)
            this.keys[i].setSelected(false);
    };

    CABLES.Anim.prototype.deleteKeyAt = function (t)
    {
        for (const i in this.keys)
        {
            if (this.keys[i].time == t)
            {
                this.keys[i].removeUi();
                this.keys.splice(i, 1);
                return;
            }
        }
        if (gui.metaKeyframes)gui.metaKeyframes.update();
    };

    CABLES.Anim.prototype.deleteSelectedKeys = function ()
    {
        let found = true;

        function undofunc(anim, objKey)
        {
            undo.add({
                "title": "timeline delete keys",
                undo()
                {
                    anim.addKey(new CABLES.ANIM.Key(objKey));
                    anim.sortKeys();
                    gui.timeLine().refresh();
                },
                redo()
                {
                    anim.deleteKeyAt(objKey.t);
                    gui.timeLine().refresh();
                }
            });
        }

        while (found)
        {
            found = false;
            for (const i in this.keys)
            {
                if (this.keys[i].selected && this.keys[i].showCircle)
                {
                    undofunc(this, this.keys[i].getSerialized());

                    this.keys[i].removeUi();
                    this.keys.splice(i, 1);
                    found = true;
                }
            }
        }
        this.sortKeys();
        if (gui.metaKeyframes)gui.metaKeyframes.update();
    };
}
