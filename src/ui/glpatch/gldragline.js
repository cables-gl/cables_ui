CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlRectDragLine = class
{
    constructor(splineDrawer, glpatch)
    {
        this._rect = null;

        this._splineDrawer = splineDrawer;
        this._splineIdx = this._splineDrawer.getSplineIndex();

        this._glPatch = glpatch;
        this._patchDragWasAllowed = this._glPatch.allowDragging;

        this._startPortOpId = null;
        this._startPortName = null;

        this._startGlPorts = [];
        this._lineIndices = [];
        this._clearSpline();
        glpatch.on("mouseup", (e) =>
        {
            if (!this.isActive) return;

            if (this._button == CABLES.UI.MOUSE_BUTTON_LEFT)
            {
                console.log("undo rightclick...");
            }

            if (this._button == CABLES.UI.MOUSE_BUTTON_LEFT && this._glPort && this._glPort.port)
            {
                gui.opSelect().show(
                    {
                        "subPatch": this._glPatch.subPatch,
                        "x": this._glPatch.viewBox.mousePatchX,
                        "y": this._glPatch.viewBox.mousePatchY
                    }, this._glPort.port.parent, this._glPort.port);
            }

            this.stop();
        });

        glpatch.on("mouseDownOverPort", (glport, opid, portName, button) =>
        {
            this._button = button;

            if (button == CABLES.UI.MOUSE_BUTTON_LEFT)
            {
                this.setPort(glport, opid, portName);
            }
            else
            if (button == CABLES.UI.MOUSE_BUTTON_RIGHT)
            {
                this.setPort(glport, opid, portName);
                const glports = this._glPatch.getConnectedGlPorts(opid, portName);

                gui.patchView.unlinkPort(opid, glport.id);

                this._startGlPorts = glports;
            }
        });


        glpatch.on("mouseUpOverOp", (e, opid) =>
        {
            if (!this.isActive) return;

            if (this._startGlPorts.length === 0)
            {
                // left click
                gui.patchView.linkPortToOp(
                    e,
                    this._startPortOpId,
                    this._startPortName,
                    opid);
            }
            else
            {
                // right click
                const opids = [];
                const portnames = [];
                for (let i = 0; i < this._startGlPorts.length; i++)
                {
                    opids.push(this._startGlPorts[i].glOp.id);
                    portnames.push(this._startGlPorts[i].name);
                }

                gui.patchView.linkPortsToOp(e, opid, opids, portnames);
            }
            this.stop();
        });


        glpatch.on("mouseUpOverPort", (opid, portName) =>
        {
            console.log("mouseUpOverPort",
                this._startPortOpId,
                this._startPortName,
                opid,
                portName);

            if (this._startGlPorts.length === 0)
            {
                // left click
                gui.patchView.linkPorts(this._startPortOpId, this._startPortName, opid, portName);
            }
            else
            {
                // right click
                for (let i = 0; i < this._startGlPorts.length; i++)
                {
                    gui.patchView.linkPorts(opid,
                        portName,
                        this._startGlPorts[i].glOp.id,
                        this._startGlPorts[i].name);
                }
            }

            this.stop();
        });
    }


    setPort(p, opid, portName)
    {
        if (!p)
        {
            this._glPort = this._rect = null;
            // this._lineDrawer.setLine(this._lineIdx0, 0, 0, 0, 0);

            this._splineDrawer.setSpline(this._splineIdx,
                [
                    0, 0, 0,
                    0, 0, 0
                ]);

            return;
        }

        this._startPortOpId = opid;
        this._startPortName = portName;

        this._rect = p.rect;
        this._glPort = p;

        console.log(p.type);
        // this._lineDrawer.setColor(this._lineIdx0, 1, 1, 1, 1);

        this._patchDragWasAllowed = this._glPatch.allowDragging;
        this._glPatch.allowDragging = false;

        this._update();
    }

    _clearSpline()
    {
        for (let i = 0; i < this._lineIndices.length; i++)
        {
            this._splineDrawer.setSpline(this._lineIndices[i], [0, 0, 0, 0, 0, 0]);
            this._splineDrawer.setSplineColor(this._lineIndices[i], [0, 0, 0, 0]);
        }
        this._splineDrawer.setSplineColor(this._splineIdx, [0, 0, 0, 0]);
        this._splineDrawer.setSpline(this._splineIdx, [0, 0, 0, 0, 0, 0]);
    }

    _update()
    {
        if (!this.isActive) return;

        // if (!this._glPort && !this._startGlPorts.length)
        // {
        this._clearSpline();
        // }


        if (this._glPort)
        {
            this._glPatch.setDrawableColorByType(this, this._glPort.type);
        }

        if (this._startGlPorts.length)
        {
            for (let i = 0; i < this._startGlPorts.length; i++)
            {
                if (i > this._lineIndices.length - 1) this._lineIndices[i] = this._splineDrawer.getSplineIndex();

                // this._lineDrawer.setColor(this._lineIndices[i], 0, 1, 0, 1);

                this._splineDrawer.setSpline(this._lineIndices[i],
                    [
                        this._startGlPorts[i].glOp.x + this._startGlPorts[i].rect.x + CABLES.GLGUI.VISUALCONFIG.portWidth / 2,
                        this._startGlPorts[i].glOp.y + this._startGlPorts[i].rect.y + CABLES.GLGUI.VISUALCONFIG.portHeight / 2,
                        0,
                        this._x,
                        this._y,
                        0
                    ]);

                // this._lineDrawer.setLine(this._lineIndices[i],
                //     this._startGlPorts[i].glOp.x + this._startGlPorts[i].rect.x + CABLES.GLGUI.VISUALCONFIG.portWidth / 2,
                //     this._startGlPorts[i].glOp.y + this._startGlPorts[i].rect.y + CABLES.GLGUI.VISUALCONFIG.portHeight / 2,
                //     this._x,
                //     this._y);
            }
        }
        else
        {
            if (this._rect && this._glPort)
            {
                // this._lineDrawer.setLine(this.-111_lineIdx111,


                this._splineDrawer.setSpline(this._splineIdx,
                    [
                        this._glPort.glOp.x + this._rect.x + CABLES.GLGUI.VISUALCONFIG.portWidth / 2,
                        this._glPort.glOp.y + this._rect.y + CABLES.GLGUI.VISUALCONFIG.portHeight / 2,
                        0,
                        this._x,
                        this._y,
                        0]);

                this._splineDrawer.setSplineColor(this._splineIdx, [1, 1, 1, 1]);
            }
        }
    }

    get isActive()
    {
        return this._glPort != null;
    }

    stop()
    {
        this._startGlPorts.length = 0;
        this.setPort(null);
        this._glPatch.allowDragging = this._patchDragWasAllowed;
        this._clearSpline();
    }

    setPosition(x, y)
    {
        this._x = x;
        this._y = y;
        this._update();
    }

    setColor(r, g, b, a)
    {
        for (let i = 0; i < this._lineIndices.length; i++)
        {
            this._splineDrawer.setSplineColor(this._lineIndices[i], [r, g, b, a]);
        }

        this._splineDrawer.setSplineColor(this._splineIdx, [r, g, b, a]);
        // console.log("set color dragline", r, g, b, a);
    }
};
