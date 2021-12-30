import GlUiConfig from "./gluiconfig";
import GlPort from "./glport";
import GlText from "../gldraw/gltext";
import GlArea from "./glarea";

export default class GlOp extends CABLES.EventTarget
{
    constructor(glPatch, instancer, op)
    {
        super();
        this.DISPLAY_DEFAULT = 0;
        this.DISPLAY_COMMENT = 1;
        this.DISPLAY_UI_AREA = 2;
        this.DISPLAY_UI_AREA_INSTANCER = 3;
        this.DISPLAY_SUBPATCH = 3;

        this._id = op.id;
        this._visible = true;
        this._glPatch = glPatch;
        this._op = op;
        this._glRectNames = [];
        this._instancer = instancer;
        this._width = GlUiConfig.opWidth;
        this._height = GlUiConfig.opHeight;
        this._needsUpdate = true;
        this._textWriter = null;
        this._resizableArea = null;
        this._glRectNames.push("_resizableArea");

        this._glTitleExt = null;
        this._glRectNames.push("_glTitleExt");

        this._glTitle = null;
        this._glRectNames.push("_glTitle");

        this._glComment = null;
        this._glRectNames.push("_glComment");

        this._hidePorts = false;
        this._hideBgRect = false;

        this._posZ = Math.random() * -0.3 + -0.1;

        this._displayType = 0;

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

        this._glDotError = null;
        this._glDotWarning = null;
        this._glDotHint = null;
        this._glRectRightHandle = null;

        if (this._op)
        {
            if (this._op.objName.indexOf("Ops.Ui.SubPatch") === 0) this._displayType = this.DISPLAY_SUBPATCH;
            if (this._op.objName.indexOf("Ops.Ui.Comment") === 0) this._displayType = this.DISPLAY_COMMENT;// todo: better use uiattr comment_title
            if (this._op.objName.indexOf("Ops.Ui.Area") === 0) this._displayType = this.DISPLAY_UI_AREA;
        }
        this._wasInited = false;

        this._initGl();
    }

    _initGl()
    {
        this._glRectBg = this._instancer.createRect({ "draggable": true });
        this._glRectBg.setSize(GlUiConfig.opWidth, GlUiConfig.opHeight);
        this._glRectBg.setColor(GlUiConfig.colors.opBgRect);
        this._glRectNames.push("_glRectBg");

        this.refreshPorts();

        this._glRectBg.on("drag", this._onBgRectDrag.bind(this));
        this._glRectBg.on("dragEnd", this._onBgRectDragEnd.bind(this));
        this._glRectBg.on("mousedown", this._onMouseDown.bind(this));
        this._glRectBg.on("mouseup", this._onMouseUp.bind(this));

        this._wasInited = true;

        this.setHover(false);
        this.updateVisible();
    }

    get glPatch() { return this._glPatch; }

    get isDragging() { if (this._glRectBg) return this._glRectBg.isDragging; else return false; }

    get selected() { return this.opUiAttribs.selected; }

    get x() { if (this.opUiAttribs.translate) return this.opUiAttribs.translate.x; else return 0; }

    get y() { if (this.opUiAttribs.translate) return this.opUiAttribs.translate.y; else return 0; }

    get w() { return this._width; }

    get h() { return this._height; }

    get id() { return this._id; }

    get title() { return this.opUiAttribs.title; }

    get op() { return this._op; }

    _onBgRectDrag(rect)
    {
        if (!this._glRectBg) return;

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

        this._glPatch.opShakeDetector.move(offX);

        if (gui.patchView.getSelectedOps().length == 1)
        {
            this._glTitle.setOpacity(0.5);
            this._glRectBg.setOpacity(0.8);
            this._preDragPosZ = this._glRectBg.z;
            this._posZ = -0.5;
            this.updatePosition();
        }
    }

    sendNetPos()
    {
        gui.emitEvent("netOpPos", {
            "opId": this._op.id,
            "x": this._op.uiAttribs.translate.x,
            "y": this._op.uiAttribs.translate.y });
    }

    _onBgRectDragEnd(rect)
    {


        const glOps = this._glPatch.selectedGlOps;

        const oldUiAttribs = JSON.parse(this._dragOldUiAttribs);

        if (!this._op || !oldUiAttribs || !oldUiAttribs.translate) return;

        let changed =
            oldUiAttribs.translate.x != this._op.uiAttribs.translate.x ||
            oldUiAttribs.translate.y != this._op.uiAttribs.translate.y;

        if (this._preDragPosZ != this._glRectBg.z)
            this._glRectBg.setPosition(this._glRectBg.x, this._glRectBg.y, this._preDragPosZ);

        if (changed)
        {
            const undoGroup = CABLES.UI.undo.startGroup();

            for (const i in glOps) glOps[i].endPassiveDrag();


            const undoAdd = (function (scope, _oldUiAttribs)
            {
                if (!scope._op) return;

                const newUiAttr = JSON.stringify(scope._op.uiAttribs);
                CABLES.UI.undo.add({
                    "title": "Move op",
                    undo()
                    {
                        try
                        {
                            const u = JSON.parse(_oldUiAttribs);
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

            CABLES.UI.undo.endGroup(undoGroup, "Move Ops");

        }
    }

    _onMouseDown(e)
    {
        if (!this._op)
        {
            console.log("glop no op", this);
            return;
        }
        if (this._op.objName == CABLES.UI.DEFAULTOPNAMES.uiArea)
        {
            this._glPatch._selectOpsInRect(
                this.opUiAttribs.translate.x,
                this.opUiAttribs.translate.y,
                this.opUiAttribs.translate.x + this.opUiAttribs.area.w,
                this.opUiAttribs.translate.y + this.opUiAttribs.area.h
            );
        }

        this._glPatch.opShakeDetector.down(e.offsetX, e.offsetY);
        if (this.isHovering()) this._glPatch.patchAPI.showOpParams(this._id);

        if (e.altKey || e.metaKey)
        {
            if (!e.shiftKey) this._glPatch.unselectAll();
            gui.patchView.selectChilds(this.op.id);
        }

        if (!this.selected)
        {
            if (!e.shiftKey) this._glPatch.unselectAll();
            this._glPatch.selectOpId(this.id);
        }

        if (this._op && this._op.uiAttribs)
        {
            this._dragOldUiAttribs = JSON.stringify(this._op.uiAttribs);
            this._glPatch.quickLinkSuggestion.longPressPrepare(this._op, this.x + this.w / 2, this.y + this.h);
        }
    }

    _onMouseUp(e)
    {
        this._glPatch.opShakeDetector.up();
        this._glPatch.emitEvent("mouseUpOverOp", e, this._id);

        if (this.isPassiveDrag()) return;
        if (this._glPatch.quickLinkSuggestion.isActive()) this._glPatch.quickLinkSuggestion.finish(e, this._op);
    }


    set uiAttribs(attr)
    {
        if (attr.selected) this._glPatch.selectOpId(this._id);
        if (attr && !this.opUiAttribs.selected && attr.selected) this._glPatch.selectOpId(this._id);

        this.opUiAttribs = attr;

        if (attr && attr.hasOwnProperty("hidden")) this.updateVisible();
        if (attr.color) this._updateColors();

        this._needsUpdate = true;
    }

    get uiAttribs()
    {
        return this.opUiAttribs;
    }

    updateIfNeeded()
    {
        if (this._needsUpdate) this.update();
        this._needsUpdate = false;
    }

    setTitle(title, textWriter)
    {
        if (title == "") title = " ";
        if (textWriter) this._textWriter = textWriter;

        if (!this._glTitle)
        {
            this._glTitle = new GlText(this._textWriter, title);
            this._glTitle.setParentRect(this._glRectBg);
            this._OpNameSpaceColor = this._glPatch.getOpNamespaceColor(this._op.objName);

            if (this._op.objName.indexOf("Ops.Ui.SubPatch") === 0)
            {
                this._rectDecoration = 2;
            }

            if (this._op.objName.indexOf("Ops.Ui.Comment") === 0)
            {
                this._displayType = this.DISPLAY_COMMENT;
                this._hidePorts = true;
                this._hideBgRect = true;
                this._transparent = true;
            }

            if (this.opUiAttribs.comment_title) // this._op.objName.indexOf("Ops.Ui.Comment") === 0
            {
                this._hidePorts = true;
                this._glTitle.scale = 4;
                this._glTitle.setColor(GlUiConfig.colors.patchComment);
            }
            this._updateColors();
        }
        else
        {
            this._glTitle.text = String(title);
        }

        this.updateSize();
    }

    _updateCommentPosition()
    {
        if (this._glComment)
            if (!this._hideBgRect) this._glComment.setPosition(this.w + 10, this._posZ);
            else this._glComment.setPosition(0, this._height + 20, this._posZ);
    }

    updateSize()
    {
        let portsWidthIn = 0;
        let portsWidthOut = 0;

        if (!this._glRectBg) return;

        const oldHeight = this._height;
        for (let i = 0; i < this._glPorts.length; i++)
        {
            if (this._glPorts[i].direction == CABLES.PORT_DIR_IN) portsWidthIn += this._glPorts[i].width + GlUiConfig.portPadding;
            else portsWidthOut += this._glPorts[i].width + GlUiConfig.portPadding;
        }

        if (portsWidthIn != 0) portsWidthIn -= GlUiConfig.portPadding;
        if (portsWidthOut != 0) portsWidthOut -= GlUiConfig.portPadding;

        // this._width = Math.max(this._getTitleWidth(), this._glRectBg.w);
        this._width = this._getTitleWidth();
        this._width = Math.max(this._width, Math.max(portsWidthOut, portsWidthIn));
        this._height = Math.max(this._glTitle.height + 5, this._glRectBg.h);

        if (this.opUiAttribs.height) this._height = this.opUiAttribs.height;
        // if (this._displayType == this.DISPLAY_UI_AREA) this._width = this._height = 20;
        if (this.opUiAttribs.widthOnlyGrow) this._width = Math.max(this._width, this._glRectBg.w);

        this._glRectBg.setSize(this._width, this._height);

        if (oldHeight != this._height)
            for (let i = 0; i < this._glPorts.length; i++)
                this._glPorts[i].updateSize();

        this._updateCommentPosition();
        this._updateSizeRightHandle();
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

    _disposeDots()
    {
        if (this._glDotError) this._glDotError.dispose();
        if (this._glDotWarning) this._glDotWarning.dispose();
        if (this._glDotHint) this._glDotHint.dispose();
        this._glDotError = null;
        this._glDotWarning = null;
        this._glDotHint = null;
    }

    dispose()
    {
        if (this._glRectBg) this._glRectBg.dispose();
        if (this._glTitle) this._glTitle.dispose();
        if (this._glComment)
        {
            this._glComment.dispose();
            this._glComment = null;
        }
        if (this._glTitleExt) this._glTitleExt.dispose();
        if (this._glRectRightHandle) this._glRectRightHandle.dispose();
        if (this._resizableArea) this._resizableArea.dispose();
        this._disposeDots();

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

    refreshPorts()
    {
        for (let i = 0; i < this._glPorts.length; i++) this._glPorts[i].dispose();
        this._glPorts.length = 0;

        if (this._op) this._setupPorts(this._op.portsIn);
        if (this._op) this._setupPorts(this._op.portsOut);
    }

    _setupPorts(ports)
    {
        let count = 0;
        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].uiAttribs.display == "dropdown") continue;
            if (ports[i].uiAttribs.display == "readonly") continue;
            if (ports[i].uiAttribs.hidePort) continue;

            this._setupPort(count, ports[i]);
            count++;
        }
    }

    _setupPort(i, p)
    {
        const glp = new GlPort(this._glPatch, this, this._instancer, p, i, this._glRectBg);
        this._glPorts.push(glp);
    }

    updatePosition()
    {
        if (!this._glRectBg) return;
        if (!this.opUiAttribs.translate) return;
        this._glRectBg.setPosition(this.opUiAttribs.translate.x, this.opUiAttribs.translate.y, this._posZ);

        if (this._glTitle) this._glTitle.setPosition(this._getTitlePosition(), 0, this._posZ);
        if (this._glTitleExt) this._glTitleExt.setPosition(this._getTitleExtPosition(), 0, this._posZ);
        this._updateCommentPosition();
        this._updateErrorDots();
        for (const i in this._links) if (this._links[i]) this._links[i].update();
    }

    getUiAttribs()
    {
        return this.opUiAttribs;
    }

    _getTitleWidth()
    {
        let w = 0;
        if (this._glTitleExt) w += this._glTitleExt.width + GlUiConfig.OpTitlePaddingExtTitle;
        if (this._glTitle) w += this._glTitle.width;

        w += GlUiConfig.OpTitlePaddingLeftRight * 2.0;

        return w;
    }

    _getTitlePosition()
    {
        return GlUiConfig.OpTitlePaddingLeftRight;
    }

    _getTitleExtPosition()
    {
        return GlUiConfig.OpTitlePaddingLeftRight + this._glTitle.width + GlUiConfig.OpTitlePaddingExtTitle;
    }

    updateVisible()
    {
        this._setVisible();
    }

    set visible(v)
    {
        this._setVisible(v);
    }

    getSubPatch()
    {
        return this.opUiAttribs.subPatch;
    }

    isInCurrentSubPatch()
    {
        return this.opUiAttribs.subPatch == this._glPatch.subPatch;
    }

    _setVisible(v)
    {
        if (v !== undefined) this._visible = v;

        let visi = this._visible;

        if (this.opUiAttribs.hidden || !this.isInCurrentSubPatch()) visi = false;

        for (let i = 0; i < this._glRectNames.length; i++)
            if (this[this._glRectNames[i]])
                this[this._glRectNames[i]].visible = visi;

        this._updateErrorDots();

        for (const i in this._links) this._links[i].visible = visi;

        if (!visi) this._isHovering = false;
    }

    get visible()
    {
        if (!this.isInCurrentSubPatch()) return false;
        return this._visible;
    }

    _updateErrorDots()
    {
        if (!this.isInCurrentSubPatch())
        {
            if (this._glDotHint) this._glDotHint.visible = false;
            if (this._glDotWarnings) this._glDotWarnings.visible = false;
            if (this._glDotError) this._glDotError.visible = false;

            return;
        }

        if (this.opUiAttribs.uierrors && this.opUiAttribs.uierrors.length > 0)
        {
            let hasHints = false;
            let hasWarnings = false;
            let hasErrors = false;

            for (let i = 0; i < this.opUiAttribs.uierrors.length; i++)
            {
                if (this.opUiAttribs.uierrors[i].level == 0) hasHints = true;
                if (this.opUiAttribs.uierrors[i].level == 1) hasWarnings = true;
                if (this.opUiAttribs.uierrors[i].level == 2) hasErrors = true;
            }

            let dotX = 0 - GlUiConfig.OpErrorDotSize / 2;
            const dotY = this.h / 2 - GlUiConfig.OpErrorDotSize / 2;

            if (!this._glDotHint)
            {
                this._glDotHint = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glDotHint.setSize(GlUiConfig.OpErrorDotSize, GlUiConfig.OpErrorDotSize);
                this._glDotHint.setColor(GlUiConfig.colors.opErrorHint);
                this._glDotHint.setDecoration(6);

                this._glDotWarning = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glDotWarning.setSize(GlUiConfig.OpErrorDotSize, GlUiConfig.OpErrorDotSize);
                this._glDotWarning.setColor(GlUiConfig.colors.opErrorWarning);
                this._glDotWarning.setDecoration(6);

                this._glDotError = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glDotError.setSize(GlUiConfig.OpErrorDotSize, GlUiConfig.OpErrorDotSize);
                this._glDotError.setColor(GlUiConfig.colors.opError);
                this._glDotError.setDecoration(6);
            }

            if (hasHints)
            {
                this._glDotHint.setPosition(dotX, dotY, 0);
                this._glDotHint.visible = true;
                dotX += 2;
            }
            else this._glDotHint.visible = false;

            if (hasWarnings)
            {
                this._glDotWarning.setPosition(dotX, dotY, 0);
                this._glDotWarning.visible = true;
                dotX += 2;
            }
            else this._glDotWarning.visible = false;

            if (hasErrors)
            {
                this._glDotError.setPosition(dotX, dotY, 0);
                this._glDotError.visible = true;
                dotX += 2;
            }
            else this._glDotError.visible = false;
        }

        if (
            (!this.opUiAttribs.uierrors || this.opUiAttribs.uierrors.length == 0) &&
            (this._glDotError || this._glDotWarning || this._glDotHint))
        {
            this._disposeDots();
        }
    }

    update()
    {
        let doUpdateSize = false;

        if (this._displayType == this.DISPLAY_UI_AREA)
            if (!this._resizableArea)
                this._resizableArea = new GlArea(this._instancer, this);
        this._glRectNames.push("_glTitle");

        if (this.opUiAttribs.hasOwnProperty("extendTitle") && !this._glTitleExt)
        {
            this._glTitleExt = new GlText(this._textWriter, " ???");
            this._glTitleExt.setParentRect(this._glRectBg);
            this._glTitleExt.setColor(GlUiConfig.colors.opTitleExt);
            this._glTitleExt.visible = this.visible;
        }
        if ((!this.opUiAttribs.hasOwnProperty("extendTitle") || !this.opUiAttribs.extendTitle) && this._glTitleExt)
        {
            this._glTitleExt.dispose();
            this._glTitleExt = null;
        }

        const comment = this.opUiAttribs.comment || this.opUiAttribs.comment_text;

        if (comment)
        {
            if (!this._glComment)
            {
                this._glComment = new GlText(this._textWriter, comment);
                this._glComment.setParentRect(this._glRectBg);
                this._glComment.setColor(GlUiConfig.colors.patchComment);
            }

            if (comment != this._glComment.text) this._glComment.text = comment;
            this._glComment.visible = this.visible;
        }
        else
        {
            if (this._glComment)
            {
                this._glComment.dispose();
                this._glComment = null;
            }
        }

        if (this.opUiAttribs.hasOwnProperty("comment_title")) this.setTitle(this.opUiAttribs.comment_title);
        else if (this.opUiAttribs.title && this.opUiAttribs.title != this._glTitle.text) this.setTitle(this.opUiAttribs.title);


        if (this._glTitleExt && this.opUiAttribs.hasOwnProperty("extendTitle") && this.opUiAttribs.extendTitle != this._glTitleExt.text)
        {
            this._glTitleExt.text = " " + this.opUiAttribs.extendTitle || "!?!?!";
            doUpdateSize = true;
        }

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
        }

        if (doUpdateSize) this.updateSize();
        this.updatePosition();
        this._updateColors();
        this._updateErrorDots();

        for (const i in this._links) if (this._links[i]) this._links[i].update();
        this._glPatch.needsRedraw = true;
    }

    _updateSizeRightHandle()
    {
        if (!this._glRectRightHandle) return;
        this._glRectRightHandle.setPosition(this.w, 0);
        this._glRectRightHandle.setSize(5, this.h);
    }

    _updateColors()
    {
        if (!this._glRectBg || !this._glTitle) return;

        if (this.opUiAttribs.comment_title)
        {
            if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color) this._glTitle.setColor(chroma.hex(this.opUiAttribs.color).gl());
            else this._glTitle.setColor(1, 1, 1);
        }
        else
        {
            this._glTitle.setColor(this._OpNameSpaceColor[0], this._OpNameSpaceColor[1], this._OpNameSpaceColor[2]);
        }

        this._glRectBg.setDecoration(this._rectDecoration);
        if (this._transparent) this._glRectBg.setColor(GlUiConfig.colors.transparent);
        else
        {
            if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color)
            {
                this._glRectBg.setColor(chroma.hex(this.opUiAttribs.color).darken(4).gl());


                if (!this._glRectRightHandle && this._displayType != this.DISPLAY_UI_AREA)
                {
                    this._glRectRightHandle = this._instancer.createRect();
                    this._glRectRightHandle.setParent(this._glRectBg);
                    this._updateSizeRightHandle();
                }

                if (this._glRectRightHandle) this._glRectRightHandle.setColor(chroma.hex(this.opUiAttribs.color).gl());
            }
            else
            {
                this._glRectBg.setColor(GlUiConfig.colors.opBgRect);
                if (this._glRectRightHandle && this.opUiAttribs.color == null)
                {
                    this._glRectRightHandle.dispose();
                    this._glRectRightHandle = null;
                }
            }
        }

        if (this.opUiAttribs.selected)
        {
            this._glRectBg.setDecoration(3);
            this._glTitle.setColor(GlUiConfig.colors.opTitleSelected);
        }


        if (this._displayType === this.DISPLAY_UI_AREA)
        {
            this._glRectBg.setColor(0, 0, 0, 0.15);
            // this._glTitle.setOpacity(0.8);
        }
        else
        if (!this._op.enabled)
        {
            this._glRectBg.setOpacity(0.2);
            this._glTitle.setOpacity(0.2);
        }
        else
        {
            this._glRectBg.setOpacity(1.0);
            this._glTitle.setOpacity(1.0);
        }

        if (this._hideBgRect)
        {
            this._glRectBg.setOpacity(0.0);
        }
        if (this._hidePorts) for (let i = 0; i < this._glPorts.length; i++) this._glPorts[i].rect.setOpacity(0);
        if (this._resizableArea) this._resizableArea._updateColor();
        this._glRectNames.push("_glTitle");
    }

    set selected(s)
    {
        if (s != this.opUiAttribs.selected)
        {
            this.opUiAttribs.selected = s;
            this._updateColors();
        }
    }

    getPortPos(id)
    {
        // for cable position
        let count = 0;
        for (let i = 0; i < this._op.portsIn.length; i++)
        {
            if (this._op.portsIn[i].id == id) return count * (GlUiConfig.portWidth + GlUiConfig.portPadding) + CABLES.UI.uiConfig.portSize * 0.5;
            if (this._op.portsIn[i].isHidden() ||
                this._op.portsIn[i].uiAttribs.display == "dropdown" ||
                this._op.portsIn[i].uiAttribs.display == "readonly" ||
                this._op.portsIn[i].uiAttribs.hidePort) continue;

            count++;
        }

        for (let i = 0; i < this._op.portsOut.length; i++)
        {
            if (this._op.portsOut[i].id == id) return i * (GlUiConfig.portWidth + GlUiConfig.portPadding) + CABLES.UI.uiConfig.portSize * 0.5;
        }

        return 100;
    }

    isPassiveDrag()
    {
        return !(this._passiveDragStartX == null && this._passiveDragStartY == null);
    }

    endPassiveDrag()
    {
        if(this._passiveDragStartX!=this.x || this._passiveDragStartY!=this.y)
        {
            const undmove = (function (scope, newX,newY,oldX,oldY)
            {
                CABLES.UI.undo.add({
                    "title": "Move op",
                    undo()
                    {
                        try
                        {
                            scope._glPatch.patchAPI.setOpUiAttribs(scope._id, "translate", { "x": newX, "y": newY });
                        }
                        catch (e) {}
                    },
                    redo()
                    {
                        scope._glPatch.patchAPI.setOpUiAttribs(scope._id, "translate", { "x": oldX, "y": oldY });
                    }
                });

            }(this, this._passiveDragStartX,this._passiveDragStartY,this.x,this.y));

        }

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
            x = this._glPatch.snapLines.snapX(x);
            y = this._glPatch.snapLines.snapY(y);
        }

        this._glPatch.patchAPI.setOpUiAttribs(this._id, "translate", { "x": x, "y": y });
        this.emitEvent("drag");
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
}
