CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlRectDragLine = class
{
    constructor(linedrawer, glpatch)
    {
        this._rect = null;
        this._lineDrawer = linedrawer;

        this._lineIdx0 = this._lineDrawer.getIndex();
        this._glPatch = glpatch;
        this._patchDragWasAllowed = this._glPatch.allowDragging;

        this._startPortOpId = null;
        this._startPortName = null;

        this._startGlPorts = [];
        this._lineIndices = [];

        glpatch.on("mouseup", (e) =>
        {
            if (this.isActive) this.stop();
        });

        glpatch.on("mouseDownOverPort", (glport, opid, portName) =>
        {
            this.setPort(glport, opid, portName);
        });

        glpatch.on("mouseDownRightOverPort", (glport, opid, portName) =>
        {
            this.setPort(glport, opid, portName);
            const glports = this._glPatch.getConnectedGlPorts(opid, portName);
            console.log(glports);
            glpatch.patchAPI.unlinkPort(opid, glport.id);

            this._startGlPorts = glports;
        });

        glpatch.on("mouseUpOverOp", (e, opid) =>
        {
            if (!this.isActive) return;

            if (this._startGlPorts.length === 0)
            {
                gui.patchView.linkPortToOp(
                    e,
                    this._startPortOpId,
                    this._startPortName,
                    opid);
            }
            else
            {
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
                gui.patchView.linkPorts(this._startPortOpId, this._startPortName, opid, portName);
            }
            else
            {
                for (let i = 0; i < this._startGlPorts.length; i++)
                {
                    gui.patchView.linkPorts(this._startPortOpId,
                        this._startPortName,
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
            this._port = this._rect = null;
            this._lineDrawer.setLine(this._lineIdx0, 0, 0, 0, 0);
            return;
        }

        this._startPortOpId = opid;
        this._startPortName = portName;

        this._rect = p.rect;
        this._port = p;
        this._lineDrawer.setColor(this._lineIdx0, 1, 1, 1, 1);

        this._patchDragWasAllowed = this._glPatch.allowDragging;
        this._glPatch.allowDragging = false;

        this._update();
    }

    _update()
    {
        let i = 0;
        for (i = 0; i < this._lineIndices.length; i++)
        {
            this._lineDrawer.setLine(this._lineIndices[i], 0, 0, 0, 0);
        }

        if (this._startGlPorts.length)
        {
            for (i = 0; i < this._startGlPorts.length; i++)
            {
                if (i > this._lineIndices.length - 1) this._lineIndices[i] = this._lineDrawer.getIndex();

                this._lineDrawer.setColor(this._lineIndices[i], 0, 1, 0, 1);

                this._lineDrawer.setLine(this._lineIndices[i],
                    this._startGlPorts[i].glOp.x + this._startGlPorts[i].rect.x + CABLES.GLGUI.VISUALCONFIG.portWidth / 2,
                    this._startGlPorts[i].glOp.y + this._startGlPorts[i].rect.y + CABLES.GLGUI.VISUALCONFIG.portHeight / 2,
                    this._x,
                    this._y);
            }
        }
        else
        {
            if (this._rect && this._port)
            {
                this._lineDrawer.setLine(this._lineIdx0,
                    this._port.glOp.x + this._rect.x + CABLES.GLGUI.VISUALCONFIG.portWidth / 2,
                    this._port.glOp.y + this._rect.y + CABLES.GLGUI.VISUALCONFIG.portHeight / 2,
                    this._x,
                    this._y);
            }
        }
    }

    get isActive()
    {
        return this._port != null;
    }

    stop()
    {
        this._startGlPorts.length = 0;
        this.setPort(null);
        this._glPatch.allowDragging = this._patchDragWasAllowed;
    }

    setPosition(x, y)
    {
        this._x = x;
        this._y = y;
        this._update();
    }

    setColor(r, g, b, a)
    {
        this._lineDrawer.setColor(this._lineIdx0, r, g, b, a);
    }
};
