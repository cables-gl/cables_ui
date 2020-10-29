CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlOp = class extends CABLES.EventTarget
{
    constructor(glPatch, instancer, op)
    {
        super();

        this._id = op.id;
        this._visible = true;
        this._glPatch = glPatch;
        this._op = op;
        this._instancer = instancer;
        this._width = CABLES.GLGUI.VISUALCONFIG.opWidth;
        this._height = CABLES.GLGUI.VISUALCONFIG.opHeight;
        this._needsUpdate = true;
        this._textWriter = null;
        this._glTitleExt = null;
        this._glTitle = null;
        this._glComment = null;
        this._glPorts = [];
        this.opUiAttribs = {};
        this._links = {};
        this._transparent = false;
        this.uiAttribs = op.uiAttribs;
        this._visPort = null;
        this._glRectContent = null;
        this._passiveDragStartX = null;
        this._passiveDragStartY = null;
        this._dragOldUiAttribs = null;
        this._rectDecoration = 0;

        this._glRectBg = instancer.createRect({ "draggable": true });
        this._glRectBg.setSize(CABLES.GLGUI.VISUALCONFIG.opWidth, CABLES.GLGUI.VISUALCONFIG.opHeight);
        this._glRectBg.setColor(CABLES.GLGUI.VISUALCONFIG.colors.opBgRect);

        this._setupPorts(this._op.portsIn);
        this._setupPorts(this._op.portsOut);

        this._glRectBg.on("drag", this._onBgRectDrag.bind(this));
        this._glRectBg.on("dragEnd", this._onBgRectDragEnd.bind(this));
        this._glRectBg.on("mousedown", this._onMouseDown.bind(this));
        this._glRectBg.on("mouseup", this._onMouseUp.bind(this));


        this.setHover(false);
    }

    get isDragging() { return this._glRectBg.isDragging; }

    _onBgRectDrag(rect)
    {
        const glOps = this._glPatch.selectedGlOps;
        const ids = Object.keys(glOps);

        if (!glOps || ids.length == 0) return;
        if (this._glPatch.isDraggingPort()) return;

        if (!glOps[ids[0]].isPassiveDrag())
            for (const i in glOps)
                glOps[i].startPassiveDrag();

        const offX = this._glRectBg.dragOffsetX;
        const offY = this._glRectBg.dragOffsetY;

        for (const i in glOps)
            glOps[i].setPassiveDragOffset(offX, offY);
    }

    _onBgRectDragEnd(rect)
    {
        const glOps = this._glPatch.selectedGlOps;
        for (const i in glOps) glOps[i].endPassiveDrag();

        const undoAdd = (function (scope, oldUiAttribs)
        {
            const newUiAttr = JSON.stringify(scope._op.uiAttribs);
            CABLES.undo.add({
                "title": "Move op",
                undo()
                {
                    try
                    {
                        const u = JSON.parse(oldUiAttribs);
                        // scope._glRectBg.setPosition(u.translate.x, u.translate.y);

                        scope._glPatch.patchAPI.setOpUiAttribs(scope._id, "translate", { "x": u.translate.x, "y": u.translate.y });
                    }
                    catch (e) {}
                },
                redo()
                {
                    const u = JSON.parse(newUiAttr);
                    scope._glPatch.patchAPI.setOpUiAttribs(scope._id, "translate", { "x": u.translate.x, "y": u.translate.y });
                    // scope.op.uiAttribs.translate = { "x": u.translate.x, "y": u.translate.y };
                    // scope._glRectBg.setPosition(u.translate.x, u.translate.y);
                }
            });
        }(this, this._dragOldUiAttribs + ""));
    }

    _onMouseDown(e)
    {
        if (this.isHovering()) this._glPatch.patchAPI.showOpParams(this._id);

        if (!this.selected)
        {
            if (!e.shiftKey) this._glPatch.unselectAll();
            this._glPatch.selectOpId(this.id);
        }

        this._dragOldUiAttribs = JSON.stringify(this._op.uiAttribs);
        this._glPatch.quickLinkSuggestion.longPressPrepare(this._op, this.x + this.w / 2, this.y + this.h);
    }

    _onMouseUp(e)
    {
        this._glPatch.emitEvent("mouseUpOverOp", e, this._id);

        if (this.isPassiveDrag()) return;
        if (this._glPatch.quickLinkSuggestion.isActive()) this._glPatch.quickLinkSuggestion.finish(e, this._op);
    }

    get selected() { return this.opUiAttribs.selected; }

    get x() { return this.opUiAttribs.translate.x; }

    get y() { return this.opUiAttribs.translate.y; }

    get w() { return this._width; }

    get h() { return this._height; }

    get id() { return this._id; }

    get title() { return this.opUiAttribs.title; }

    get glPatch() { return this._glPatch; }

    get op()
    {
        return this._op;
    }

    set uiAttribs(attr)
    {
        if (attr && !this.opUiAttribs.selected && attr.selected) this._glPatch.selectOpId(this._id);

        this.opUiAttribs = attr;
        this._needsUpdate = true;
    }

    get uiAttribs()
    {
        return this.opUiAttribs;
    }

    setTitle(title, textWriter)
    {
        if (textWriter) this._textWriter = textWriter;

        if (!this._glTitle)
        {
            this._glTitle = new CABLES.GLGUI.Text(this._textWriter, title);
            this._glTitle.setParentRect(this._glRectBg);

            this._OpNameSpaceColor = this._glPatch.getOpNamespaceColor(this._op.objName);


            if (this._op.objName.indexOf("Ops.Ui.SubPatch") === 0)
            {
                this._rectDecoration = 2;
            }

            if (this._op.objName.indexOf("Ops.Ui.Comment") === 0)
            {
                this._glTitle.scale = 4;
                this._glTitle.setColor(CABLES.GLGUI.VISUALCONFIG.colors.patchComment);
                this._transparent = true;
            }
            this._updateColors();
        }
        else
        {
            this._glTitle.text = String(title);
        }

        this.updateSize();
    }

    updateSize()
    {
        this._width = Math.max(this._getTitleWidth(), this._glRectBg.w);
        this._width = Math.max(this._width, Math.max(this._op.portsIn.length, this._op.portsOut.length) * (CABLES.GLGUI.VISUALCONFIG.portWidth + CABLES.GLGUI.VISUALCONFIG.portPadding));
        this._height = Math.max(this._glTitle.height + 5, this._glRectBg.h);

        this._glRectBg.setSize(this._width, this._height);

        if (this._glComment) this._glComment.setPosition(this._width, 0);
    }

    addLink(l)
    {
        this._links[l.id] = l;
        l.visible = this.visible;
    }

    isHovering()
    {
        if (this._glRectBg) return this._glRectBg.isHovering();
    }

    mouseMove(x, y)
    {
        // const wasHovering=this._isHovering;
        // this.setHover(this._glRectBg.isPointInside(x,y));

        // if(this._isHovering)
        // {
        //     for(var i=0;i<this._portRects.length;i++)
        //     {
        //         this._portRects[i].setOutline(this._portRects[i].isPointInside(x,y));
        //         // if( this._portRects[i].isPointInside(x,y) ) this._portRects[i].setColor(1,0,0,1);
        //         // else this._portRects[i].setColor(0,0,0,1);
        //     }
        // }

        // if(wasHovering && !this._isHovering)
        // {
        //     for(var i=0;i<this._portRects.length;i++)
        //         this._portRects[i].setOutline(false);
        // }
    }

    setHover(h)
    {
        if (!this._isHovering && h) this.emitEvent("hoverStart");
        if (this._isHovering && !h) this.emitEvent("hoverEnd");

        this._isHovering = h;
    }

    dispose()
    {
        if (this._glRectBg) this._glRectBg.dispose();
        if (this._glTitle) this._glTitle.dispose();
        for (let i = 0; i < this._glPorts.length; i++) this._glPorts[i].dispose();

        this._op = null;
        this._glPorts.length = 0;
        this._glRectBg = null;
        this._instancer = null;
    }

    removeLink(linkId)
    {
        const l = this._links[linkId];
        if (l)
        {
            delete this._links[linkId];
            this.update();
        }
    }

    _setupPorts(ports)
    {
        let count = 0;
        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].uiAttribs.display == "dropdown") continue;
            if (ports[i].uiAttribs.hidePort) continue;

            this._setupPort(count, ports[i]);
            count++;
        }
    }

    _setupPort(i, p)
    {
        const glp = new CABLES.GLGUI.GlPort(this._glPatch, this, this._instancer, p, i, this._glRectBg);
        this._glPorts.push(glp);
    }

    updatePosition()
    {
        if (!this._glRectBg) return;
        this._glRectBg.setPosition(this.opUiAttribs.translate.x, this.opUiAttribs.translate.y);

        if (this._glTitle) this._glTitle.setPosition(this._getTitlePosition(), 0);
        if (this._glTitleExt) this._glTitleExt.setPosition(this._getTitleExtPosition(), 0);
        if (this._glComment) this._glComment.setPosition(this.w + 10, 0);
    }

    getUiAttribs()
    {
        return this.opUiAttribs;
    }


    _getTitleWidth()
    {
        let w = 0;
        if (this._glTitleExt)w += this._glTitleExt.width;
        if (this._glTitle)w += this._glTitle.width;

        w += CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight * 2.0;

        return w;
    }

    _getTitlePosition()
    {
        return CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight;
    }

    _getTitleExtPosition()
    {
        return CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight + this._glTitle.width + CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight / 2;
    }

    updateVisible()
    {
        this._setVisible();
    }

    set visible(v)
    {
        this._setVisible(v);
    }

    isInCurrentSubPatch()
    {
        return this.opUiAttribs.subPatch == this._glPatch.subPatch;
    }

    _setVisible(v)
    {
        if (v !== undefined) this._visible = v;

        let visi = this._visible;

        if (!this.isInCurrentSubPatch())
        {
            visi = false;
        }

        if (this._glRectBg) this._glRectBg.visible = visi;
        if (this._glTitle) this._glTitle.visible = visi;
        if (this._glTitleExt) this._glTitleExt.visible = visi;
        if (this._glComment) this._glComment.visible = visi;

        for (const i in this._links) this._links[i].visible = visi;

        if (!visi) this._isHovering = false;
    }

    get visible()
    {
        if (!this.isInCurrentSubPatch()) return false;
        return this._visible;
    }

    update()
    {
        if (this.opUiAttribs.extendTitle && !this._glTitleExt)
        {
            this._glTitleExt = new CABLES.GLGUI.Text(this._textWriter, " | " + this.opUiAttribs.extendTitle);
            this._glTitleExt.setParentRect(this._glRectBg);
            this._glTitleExt.setColor(CABLES.GLGUI.VISUALCONFIG.colors.opTitleExt);
            this.updatePosition();
        }
        else if (!this.opUiAttribs.extendTitle && this._glTitleExt)
        {
            this._glTitleExt = null;
        }

        if (this.opUiAttribs.comment)
        {
            if (!this._glComment)
            {
                this._glComment = new CABLES.GLGUI.Text(this._textWriter, this.opUiAttribs.comment);
                this._glComment.setParentRect(this._glRectBg);
                this._glComment.setColor(CABLES.GLGUI.VISUALCONFIG.colors.patchComment);
            }

            if (this.opUiAttribs.comment != this._glComment.text) this._glComment.text = this.opUiAttribs.comment;
            this._glComment.visible = this._visible;
        }

        if (this.opUiAttribs.title && this.opUiAttribs.title != this._glTitle.text) this.setTitle(this.opUiAttribs.title);
        if (this._glTitleExt && this.opUiAttribs.extendTitle != this._glTitleExt.text) this._glTitleExt.text = this.opUiAttribs.extendTitle;

        if (this.opUiAttribs.glPreviewTexture)
        {
            if (!this._glRectContent)
            {
                this._glRectContent = this._instancer.createRect();
                this._glRectContent.setParent(this._glRectBg);
                this._glRectContent.setPosition(0, this._height);
                this._glRectContent.setColor(255, 0, 220, 1);

                const p = this._op.getPort("Texture");
                this._visPort = p;

                this._visPort.onChange = () =>
                {
                    const t = this._visPort.get();

                    if (t)
                    {
                        const asp = this._width / t.width * 2.5;
                        this._glRectContent.setSize(t.width * asp, t.height * asp);
                        this._glRectContent.setTexture(this._visPort.get());
                    }
                };
            }
            if (this._visPort)
            {
            }
        }


        this.updatePosition();
        for (const i in this._links) if (this._links[i]) this._links[i].update();
        this._glPatch.needsRedraw = true;
    }

    _updateColors()
    {
        if (this.opUiAttribs.selected)
        {
            this._glRectBg.setDecoration(3);
            this._glTitle.setColor(1, 1, 1);
        }
        else
        {
            this._glTitle.setColor(this._OpNameSpaceColor[0], this._OpNameSpaceColor[1], this._OpNameSpaceColor[2]);
            this._glRectBg.setDecoration(this._rectDecoration);
            if (this._transparent) this._glRectBg.setColor(CABLES.GLGUI.VISUALCONFIG.colors.transparent);
            else
            {
                this._glRectBg.setColor(CABLES.GLGUI.VISUALCONFIG.colors.opBgRect);
            }
        }
    }

    set selected(s)
    {
        this.opUiAttribs.selected = s;
        this._updateColors();
    }

    getPortPos(id)
    {
        for (let i = 0; i < this._op.portsIn.length; i++)
        {
            if (this._op.portsIn[i].id == id)
                return i * (CABLES.GLGUI.VISUALCONFIG.portWidth + CABLES.GLGUI.VISUALCONFIG.portPadding) + CABLES.UI.uiConfig.portSize * 0.5;
        }

        for (let i = 0; i < this._op.portsOut.length; i++)
        {
            if (this._op.portsOut[i].id == id)
                return i * (CABLES.GLGUI.VISUALCONFIG.portWidth + CABLES.GLGUI.VISUALCONFIG.portPadding) + CABLES.UI.uiConfig.portSize * 0.5;
        }

        return 100;
    }

    isPassiveDrag()
    {
        return !(this._passiveDragStartX == null && this._passiveDragStartY == null);
    }

    endPassiveDrag()
    {
        this._passiveDragStartX = null;
        this._passiveDragStartY = null;
    }

    startPassiveDrag()
    {
        this._passiveDragStartX = this.x;
        this._passiveDragStartY = this.y;
    }

    setPassiveDragOffset(x, y)
    {
        if (!this._passiveDragStartX) this.startPassiveDrag();

        x = this._passiveDragStartX + x;
        y = this._passiveDragStartY + y;

        if (CABLES.UI.userSettings.get("snapToGrid"))
        {
            x = gui.patchView.snapOpPosX(x);
            y = gui.patchView.snapOpPosY(y);
        }

        this._glPatch.patchAPI.setOpUiAttribs(this._id, "translate", { "x": x, "y": y });
        this.updatePosition();
    }

    getGlPort(name)
    {
        for (let i = 0; i < this._glPorts.length; i++)
            if (this._glPorts[i].name == name)
                return this._glPorts[i];
    }

    getGlPortsLinkedToPort(opid, portname)
    {
        const ports = [];

        for (const i in this._links)
        {
            if (this._links[i].nameInput == portname && this._links[i].opIdInput == opid)
            {
                const op = this._glPatch.getOp(this._links[i].opIdOutput);
                ports.push(op.getGlPort(this._links[i].nameOutput));
            }
            if (this._links[i].nameOutput == portname && this._links[i].opIdOutput == opid)
            {
                const op = this._glPatch.getOp(this._links[i].opIdInput);
                ports.push(op.getGlPort(this._links[i].nameInput));
            }
        }

        return ports;
    }
};
