import { Events } from "cables-shared-client";
import GlPort from "./glport.js";
import GlText from "../gldraw/gltext.js";
import GlArea from "./glarea.js";
import userSettings from "../components/usersettings.js";
import undo from "../utils/undo.js";
import MouseState from "./mousestate.js";
import gluiconfig from "./gluiconfig.js";
import GlPatch from "./glpatch.js";


export default class GlOp extends Events
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
        this._objName = op.objName;
        this._glRectNames = [];
        this._instancer = instancer;
        this._width = gluiconfig.opWidth;
        this._height = gluiconfig.opHeight;
        this._needsUpdate = true;
        this._textWriter = null;
        this._resizableArea = null;
        this._glRectNames.push("_resizableArea");

        this._glRectSelected = null;
        this._glRectBg = null;
        this._rectResize = null;
        this._glColorIndicator = null;
        this.minWidth = 10;

        this._origPosZ = gluiconfig.zPosOpSelected;// + (0.1 + Math.random() * 0.01);

        this._glRectArea = null;

        this._titleExtPortTimeout = null;
        this._titleExtPortLastTime = null;
        this._titleExtPort = null;
        this._titleExtPortListener = null;
        this._titleExt = null;
        this._glRectNames.push("_titleExt");

        this._glTitle = null;
        this._glRectNames.push("_glTitle");

        this._glComment = null;
        this._glRectNames.push("_glComment");

        this._hidePorts = false;
        this._hideBgRect = false;


        this._displayType = 0;

        this._glPorts = [];
        this.opUiAttribs = {};
        this._links = {};
        this._transparent = false;
        this.setUiAttribs({}, op.uiAttribs);
        this._visPort = null;
        this._glRectContent = null;
        this._passiveDragStartX = null;
        this._passiveDragStartY = null;
        this._dragOldUiAttribs = null;
        this._rectBorder = 0;

        this._glLoadingIndicator = null;
        this._glNotWorkingCross = null;
        this._glDotError = null;
        this._glDotWarning = null;
        this._glDotHint = null;
        // this._glRectRightHandle = null;

        if (this._op)
        {
            this._op.on("onStorageChange", () =>
            {
                this._storageChanged();
            });

            this._op.on("portOrderChanged", () =>
            {
                this.refreshPorts();
            });

            // if (defaultops.isSubPatchOpName(this._op.objName))
            // if (this._op.storage && this._op.storage.subPatchVer)
            // {
            //     this._displayType = this.DISPLAY_SUBPATCH;

            //     // this.emitEvent("patchLoadEnd", () =>
            //     // {
            //     //     console.log("refreshing ports...");
            //     //     this.refreshPorts();
            //     //     console.log("refreshing ports... done");
            //     // });
            // }
            if (this._op.objName.indexOf("Ops.Ui.Comment") === 0) this._displayType = this.DISPLAY_COMMENT;// todo: better use uiattr comment_title
            else if (this._op.objName.indexOf("Ops.Ui.Area") === 0) this._displayType = this.DISPLAY_UI_AREA;
        }
        this._wasInited = false;

        this._wasInCurrentSubpatch = false;

        this._initGl();

        this._glPatch.on("selectedOpsChanged", (num) =>
        {
            if (!this._visible) return;
            this._updateSelectedRect();
            if (this._glRectSelected) this.updateSize();
        });

        // this.refreshPorts();
        // if (this._displayType === this.DISPLAY_SUBPATCH)
        //     this._op.patch.on("patchLoadEnd", () =>
        //     {
        //         this.refreshPorts();
        //     });
    }

    _storageChanged()
    {
        if (this._op?.isSubPatchOp())
        {
            this._displayType = this.DISPLAY_SUBPATCH;
            this._rectBorder = 1;

            if (this._op.storage && this._op.storage.blueprintVer >= 2) this._rectBorder = gluiconfig.subPatchOpBorder;
            this._updateColors();
            this.refreshPorts();

            this._op.patch.on("subpatchExpose", (subpatchid) =>
            {
                if (this._op && this._op.patchId && this._op.patchId.get() === subpatchid) this.refreshPorts();
            });
        }
    }

    _initWhenFirstInCurrentSubpatch()
    {
        if (this._wasInCurrentSubpatch) return;
        if (!this.isInCurrentSubPatch()) return;

        this._wasInCurrentSubpatch = true;

        this._storageChanged();
        this.refreshPorts();

        if (this._glRectBg)
        {
            this._glRectBg.on("drag", this._onBgRectDrag.bind(this));
            this._glRectBg.on("dragEnd", this._onBgRectDragEnd.bind(this));
            this._glRectBg.on("mousedown", this._onMouseDown.bind(this));
            this._glRectBg.on("mouseup", this._onMouseUp.bind(this));
        }

        this._needsUpdate = true;

        this.setHover(false);
        this.updateVisible();
        this.updateSize();
    }


    _initGl()
    {
        this._glRectBg = this._instancer.createRect({ "draggable": true });
        this._glRectBg.setSize(gluiconfig.opWidth, gluiconfig.opHeight);
        this._glRectBg.setColor(gui.theme.colors_patch.opBgRect);

        this._glRectNames.push("_glRectBg");

        this._initWhenFirstInCurrentSubpatch();
        this._wasInited = true;
    }

    get objName() { return this._objName; }

    get glPatch() { return this._glPatch; }

    get isDragging() { if (this._glRectBg) return this._glRectBg.isDragging; else return false; }

    get x() { if (this.opUiAttribs.translate) return this.opUiAttribs.translate.x; else return 0; }

    get y() { if (this.opUiAttribs.translate) return this.opUiAttribs.translate.y; else return 0; }

    get w() { return this._width; }

    get h() { return this._height; }

    get id() { return this._id; }

    get title() { return this.opUiAttribs.title; }

    get op() { return this._op; }



    _onBgRectDrag(e)
    {
        if (gui.longPressConnector.isActive()) return;
        if (!this._glRectBg) return;
        if (window.gui.getRestriction() < gui.RESTRICT_MODE_FULL) return;

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
            this._glRectBg.setOpacity(0.8, false);
            // this._preDragPosZ = this._glRectBg.z;
            this.updatePosition();
        }
    }

    getPosZ()
    {
        if (this.selected) return gluiconfig.zPosOpSelected;
        return gluiconfig.zPosOpUnSelected;
    }

    sendNetPos()
    {
        if (this._op && this._op.uiAttribs && this._op.uiAttribs.translate)
        {
            gui.emitEvent("netOpPos", {
                "opId": this._op.id,
                "x": this._op.uiAttribs.translate.x,
                "y": this._op.uiAttribs.translate.y });
        }
    }

    _onBgRectDragEnd(rect)
    {
        const glOps = this._glPatch.selectedGlOps;

        const oldUiAttribs = JSON.parse(this._dragOldUiAttribs);

        if (!this._op || !oldUiAttribs || !oldUiAttribs.translate) return;

        let changed =
            oldUiAttribs.translate.x != this._op.uiAttribs.translate.x ||
            oldUiAttribs.translate.y != this._op.uiAttribs.translate.y;

        // if (this._preDragPosZ != this._glRectBg.z)
        // this._glRectBg.setPosition(this._glRectBg.x, this._glRectBg.y, this._preDragPosZ);

        if (changed)
        {
            const undoGroup = undo.startGroup();

            for (const i in glOps) glOps[i].endPassiveDrag();

            const undoAdd = (function (scope, _oldUiAttribs)
            {
                if (!scope._op) return;

                const newUiAttr = JSON.stringify(scope._op.uiAttribs);
                undo.add({
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


            gui.patchView.testCollision(this._op);

            undo.endGroup(undoGroup, "Move Ops");
        }
    }

    _onMouseDown(e)
    {
        CABLES.mouseButtonWheelDown = false;
        if (window.gui.getRestriction() < gui.RESTRICT_MODE_EXPLORER) return;

        if (!this._op)
        {
            console.warn("glop no op", this);
            return;
        }

        const perf = CABLES.UI.uiProfiler.start("[glop] mouseDown");

        if (this._op.objName == CABLES.UI.DEFAULTOPNAMES.uiArea)
        {
            if (this.opUiAttribs.translate)
                this._glPatch._selectOpsInRect(
                    this.opUiAttribs.translate.x,
                    this.opUiAttribs.translate.y,
                    this.opUiAttribs.translate.x + this.opUiAttribs.area.w,
                    this.opUiAttribs.translate.y + this.opUiAttribs.area.h
                );
        }

        this._glPatch.opShakeDetector.down(e.offsetX, e.offsetY);

        if (e.touchType == "mouse")
        {
            if (this.isHovering()) this._glPatch.patchAPI.showOpParams(this._id);
        }
        else
        {
            this._glPatch.patchAPI.showOpParams(this._id);
        }

        if (e.altKey || e.metaKey)
        {
            if (!e.shiftKey) this._glPatch.unselectAll();
            gui.patchView.selectChilds(this.op.id);
            this._glPatch.emitEvent("selectedOpsChanged", gui.patchView.getSelectedOps());
        }

        if (!this.selected)
        {
            if (!e.shiftKey) this._glPatch.unselectAll();
            this._glPatch.selectOpId(this.id);
        }


        if (this._op && this._op.uiAttribs)
        {
            this._dragOldUiAttribs = JSON.stringify(this._op.uiAttribs);

            if (e.buttons == MouseState.BUTTON_WHEEL)
            {
                CABLES.mouseButtonWheelDown = true;
                if (userSettings.get("quickLinkMiddleMouse")) gui.longPressConnector.longPressStart(this._op, e, { "delay": 10 });
            }
            else
            {
                if (userSettings.get("quickLinkLongPress")) gui.longPressConnector.longPressStart(this._op, e);
            }
        }

        perf.finish();
    }

    _onMouseUp(e)
    {
        if (CABLES.mouseButtonWheelDown)
        {
            if (gui.longPressConnector.isActive()) gui.longPressConnector.finish(e, this._op);
            this.mouseButtonWheelDown = false;
        }

        this._glPatch.opShakeDetector.up();
        this._glPatch.emitEvent("mouseUpOverOp", e, this._id);

        this.endPassiveDrag();
        this.glPatch.snap.update();
    }

    setUiAttribs(newAttribs, attr)
    {
        const perf = CABLES.UI.uiProfiler.start("[glop] setuiattribs");

        if (newAttribs && newAttribs.selected) this._glPatch.selectOpId(this._id);
        if (newAttribs && !this.opUiAttribs.selected && newAttribs.selected) this._glPatch.selectOpId(this._id);

        this.opUiAttribs = JSON.parse(JSON.stringify(attr));

        if (this.opUiAttribs.extendTitlePort && (!this._titleExtPort || this._titleExtPort.name != this.opUiAttribs.extendTitlePort))
        {
            if (this._titleExtPort)
            {
                this._titleExtPort.off(this._titleExtPortlister);
                this._titleExtPort = null;
            }
            this._titleExtPort = this._op.getPort(this.opUiAttribs.extendTitlePort);
            if (this._titleExtPort)
            {
                this._titleExtPortlister = this._titleExtPort.on("change", () =>
                {
                    clearTimeout(this._titleExtPortTimeout);
                    if (performance.now() - this._titleExtPortLastTime < 50)
                    {
                        this._titleExtPortTimeout = setTimeout(() => { this.update(); }, 50);
                    }
                    this.update();
                    this._titleExtPortLastTime = performance.now();
                });
            }
        }


        if (newAttribs.hasOwnProperty("hidden")) this.updateVisible();
        if (newAttribs.color) this._updateColors();

        if (newAttribs.translate) this.sendNetPos();
        if (newAttribs.hasOwnProperty("loading")) this._updateIndicators();
        if (newAttribs.hasOwnProperty("translate")) this.updatePosition();

        if (newAttribs.hasOwnProperty("resizable"))
        {
            this.updateSize();
            for (let i = 0; i < this._glPorts.length; i++)
                this._glPorts[i].updateSize();
        }



        perf.finish();
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
        const perf = CABLES.UI.uiProfiler.start("[glop] set title");

        if (!title) title = this._op.getTitle();
        if (textWriter) this._textWriter = textWriter;
        if (title === undefined)title = "";

        if (
            this._displayType != this.DISPLAY_COMMENT &&
            this._displayType != this.DISPLAY_UI_AREA &&
            title != "var set" &&
            title != "var get" &&
            title != "*" &&
            title != "/" &&
            title != "+" &&
            title != "-" &&
            title != this._op.shortName) title = "\"" + title + "\"";

        if (this.opUiAttribs.mathTitle)
        {
            let mathStr = "";

            if (!this._op.portsIn[0].isLinked()) mathStr += this._op.portsIn[0].get();
            else if (!this._op.portsIn[1].isLinked())mathStr += "x";

            if (this._op.objName.indexOf("Ops.Math.Sum") == 0) mathStr += "+";
            else if (this._op.objName.indexOf("Ops.Math.Multiply") == 0) mathStr += "*";
            else if (this._op.objName.indexOf("Ops.Math.Divide") == 0) mathStr += "/";
            else if (this._op.objName.indexOf("Ops.Math.Subtract") == 0) mathStr += "-";
            else if (this._op.objName.indexOf("Ops.Math.Compare.GreaterThan") == 0) mathStr += ">";
            else if (this._op.objName.indexOf("Ops.Math.Compare.LessThan") == 0) mathStr += "<";
            else mathStr += "?";

            if (!this._op.portsIn[1].isLinked()) mathStr += this._op.portsIn[1].get();
            else if (!this._op.portsIn[0].isLinked()) mathStr += "x";

            title = mathStr;
        }

        if (!this._glTitle)
        {
            this._glTitle = new GlText(this._textWriter, title);
            this._glTitle.setParentRect(this._glRectBg);
            this._OpNameSpaceColor = GlPatch.getOpNamespaceColor(this._op.objName);

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
            }
            this._updateColors();
        }
        else
        {
            if (this._glTitle.text != String(title)) this._glTitle.text = String(title);
        }

        perf.finish();
        this.updateSize();
    }

    _updateCommentPosition()
    {
        if (this._glComment)
        {
            let x = this.w + gluiconfig.portWidth;
            if (this._rectResize)x += this._rectResize.w;

            if (!this._hideBgRect) this._glComment.setPosition(x, 0, 0); // normal op comment
            else this._glComment.setPosition(12, this._height, 0, 0); // comment op (weird hardcoded values because of title scaling)
        }
    }


    _updateSelectedRect()
    {
        if (!this._visible || (!this.selected && this._glRectSelected))
        {
            this._glRectSelected.visible = false;
            return;
        }

        if (this.selected)
        {
            if (!this._glRectSelected)
            {
                if (!this._instancer) return; // how?

                this._glRectSelected = this._instancer.createRect({ "parent": this._glRectBg, "interactive": false });
                this._glRectSelected.setColor(gui.theme.colors_patch.selected);

                this.updateSize();
                this.updatePosition();
            }
            this._glRectSelected.visible = true;
        }
    }

    updateSize()
    {
        let portsWidthIn = 0;
        let portsWidthOut = 0;

        if (!this._glRectBg) return;

        const perf = CABLES.UI.uiProfiler.start("[glop] updatesize");


        let oldGroup = "";
        let groupIndex = 0;
        for (let i = 0; i < this._glPorts.length; i++)
        {
            if (this._glPorts[i]._port.uiAttribs.group != oldGroup)
            {
                oldGroup = this._glPorts[i]._port.uiAttribs.group;
                groupIndex++;
            }
            this._glPorts[i].groupIndex = groupIndex;
        }

        const oldHeight = this._height;
        for (let i = 0; i < this._glPorts.length; i++)
        {
            if (this._glPorts[i].direction == CABLES.PORT_DIR_IN) portsWidthIn += this._glPorts[i].width + gluiconfig.portPadding;
            else portsWidthOut += this._glPorts[i].width + gluiconfig.portPadding;
        }

        if (portsWidthIn != 0) portsWidthIn -= gluiconfig.portPadding;
        if (portsWidthOut != 0) portsWidthOut -= gluiconfig.portPadding;

        // this._width = Math.max(this._getTitleWidth(), this._glRectBg.w);
        this._width = this._getTitleWidth();
        this.minWidth = this._width = Math.max(this._width, Math.max(portsWidthOut, portsWidthIn));
        if (this._glTitle) this._height = Math.max(this._glTitle.height + 5, this._glRectBg.h);

        if (this.opUiAttribs.height) this._height = this.glPatch.snap.snapY(this.opUiAttribs.height);
        if (this.opUiAttribs.width) this._width = this.glPatch.snap.snapX(Math.max(this.minWidth, this.opUiAttribs.width));

        if (this._height < gluiconfig.opHeight) this._height = gluiconfig.opHeight;

        // if (this._displayType == this.DISPLAY_UI_AREA) this._width = this._height = 20;
        if (this.opUiAttribs.widthOnlyGrow) this._width = Math.max(this._width, this._glRectBg.w);


        if (oldHeight != this._height)
            for (let i = 0; i < this._glPorts.length; i++)
                this._glPorts[i].updateSize();

        if (this._rectResize)
            this._rectResize.setPosition(this._width, this._height - this._rectResize.h);

        let ext = 0;
        if (this._rectResize)ext = this._rectResize.w;
        this._glRectBg.setSize(this._width + ext, this._height);


        if (this._glColorIndicator)
        {
            this._glColorIndicator.setPosition(this._width, 0);
            this._glColorIndicator.setSize(this._height * 0.5, this._height);
            this._width += this._height * 0.5;
        }

        if (this._glRectSelected)
        {
            if (this._glPatch._numSelectedGlOps > 1)
            {
                this._glRectSelected.setSize(this._width + gui.theme.patch.selectedOpBorderX, this._height + gui.theme.patch.selectedOpBorderY);
            }
            else
            {
                this._glRectSelected.setSize(0, 0);
            }
        }

        perf.finish();
        this._updateCommentPosition();
    }

    addLink(l)
    {
        this._links[l.id] = l;
        l.updateVisible();
    }

    isHovering()
    {
        if (this._glRectBg) return this._glRectBg.isHovering();
    }

    mouseMove(x, y)
    {
    }

    setHover(h)
    {
        if (!this._isHovering && h) this.emitEvent("hoverStart");
        if (this._isHovering && !h) this.emitEvent("hoverEnd");

        this._isHovering = h;
    }

    _disposeDots()
    {
        if (this._glDotError) this._glDotError = this._glDotError.dispose();
        if (this._glDotWarning) this._glDotWarning = this._glDotWarning.dispose();
        if (this._glDotHint) this._glDotHint = this._glDotHint.dispose();
        if (this._glLoadingIndicator) this._glLoadingIndicator = this._glLoadingIndicator.dispose();
        if (this._glNotWorkingCross) this._glNotWorkingCross = this._glNotWorkingCross.dispose();
    }

    dispose()
    {
        this._disposed = true;

        if (this._glRectArea) this._glRectArea = this._glRectArea.dispose();
        if (this._glRectBg) this._glRectBg = this._glRectBg.dispose();
        if (this._glRectSelected) this._glRectSelected = this._glRectSelected.dispose();
        if (this._glTitle) this._glTitle = this._glTitle.dispose();
        if (this._glComment) this._glComment = this._glComment.dispose();
        if (this._titleExt) this._titleExt = this._titleExt.dispose();
        // if (this._glRectRightHandle) this._glRectRightHandle = this._glRectRightHandle.dispose();
        if (this._resizableArea) this._resizableArea = this._resizableArea.dispose();
        if (this._rectResize) this._rectResize = this._rectResize.dispose();
        if (this._glColorIndicator) this._glColorIndicator = this._glColorIndicator.dispose();

        this._disposeDots();

        for (let i = 0; i < this._glPorts.length; i++) this._glPorts[i].dispose();

        this._op = null;
        this._glPorts.length = 0;
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

        let portsIn = [];
        let portsOut = [];

        if (!this._op) return;

        portsIn = portsIn.concat(this._op.portsIn);

        if (this._displayType === this.DISPLAY_SUBPATCH)
        {
            const ports = gui.patchView.getSubPatchExposedPorts(this._op.patchId.get(), CABLES.PORT_DIR_IN);

            for (let i = 0; i < ports.length; i++)
                if (portsIn.indexOf(ports[i]) == -1) portsIn.push(ports[i]);
        }

        portsOut = portsOut.concat(this._op.portsOut);

        if (this._displayType === this.DISPLAY_SUBPATCH)
        {
            const ports = portsOut.concat(gui.patchView.getSubPatchExposedPorts(this._op.patchId.get(), CABLES.PORT_DIR_OUT));
            for (let i = 0; i < ports.length; i++)
                if (portsOut.indexOf(ports[i]) == -1) portsOut.push(ports[i]);
        }

        this._setupPorts(portsIn);
        this._setupPorts(portsOut);
        this._initColorIndicators();
    }

    _setPortIndexAttribs(ports)
    {
        ports = ports.sort((a, b) =>
        {
            return (a.uiAttribs.order || 0) - (b.uiAttribs.order || 0);
        });

        let count = 0;
        let emit = false;
        for (let i = 0; i < ports.length; i++)
        {
            // console.log(ports[i]);
            // console.log("this.op.getSubPatch() != ports[i].op.id", this.op.getSubPatch(), ports[i].op.id);

            if (this.op.getSubPatch() != ports[i].op.getSubPatch())
            {
                const key = "glPortIndex_" + (ports[i].uiAttribs.order || 0) + this.op.id;
                const o = {};
                o[key] = count;

                if (ports[i].uiAttribs[key] != count) emit = true;

                ports[i].setUiAttribs(o);
            }
            else
            {
                // console.log("noe");
                if (ports[i].uiAttribs.glPortIndex != count) emit = true;
                ports[i].setUiAttribs({ "glPortIndex": count });
            }

            if (ports[i].uiAttribs.display == "dropdown") continue;
            if (ports[i].uiAttribs.display == "readonly") continue;
            if (ports[i].uiAttribs.hidePort) continue;
            count++;
        }

        // if (ports[0])console.log(ports[0].op.objName);
        // for (let i = 0; i < ports.length; i++)
        // {
        //     console.log(i, ports[i].name, ports[i].uiAttribs.glPortIndex);
        // }

        if (emit)
        {
            ports[0].op.emitEvent("glportOrderChanged");
            if (this.op.getSubPatch() != ports[0].op.getSubPatch()) this._op.emitEvent("glportOrderChanged");
        }
        return ports;
    }

    _initColorIndicators()
    {
        const ports = this._op.portsIn;

        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].uiAttribs.colorPick && !this._glColorIndicator)
            {
                if (!this._glColorIndicator)
                {
                    const colorPorts = [ports[i], ports[i + 1], ports[i + 2], ports[i + 3]];

                    this._glColorIndicator = this._instancer.createRect({ "parent": this._glRectBg });
                    this._glColorIndicator.setShape(0);

                    this._glColorIndicator.setColor([colorPorts[0].get(), colorPorts[1].get(), colorPorts[2].get(), 1]);
                    this.updateSize();

                    const updateColorIndicator = () =>
                    {
                        this._glColorIndicator?.setColor([colorPorts[0]?.get(), colorPorts[1]?.get(), colorPorts[2]?.get(), colorPorts[3]?.get()]);
                    };

                    colorPorts[0].on("onUiAttrChange", (attrs, port) =>
                    {
                        if (attrs.hasOwnProperty("greyout"))
                        {
                            if (attrs.greyout)
                            {
                                if (this._glColorIndicator)
                                    this._glColorIndicator = this._glColorIndicator.dispose();
                            }
                            else
                            {
                                this._initColorIndicators();
                            }

                            this.updateSize();
                        }
                    });
                    colorPorts[0].on("change", updateColorIndicator);
                    colorPorts[1].on("change", updateColorIndicator);
                    colorPorts[2].on("change", updateColorIndicator);
                    if (colorPorts[3])colorPorts[3].on("change", updateColorIndicator);
                }
            }
        }
    }

    _setupPorts(ports)
    {
        let count = 0;

        ports = this._setPortIndexAttribs(ports);

        ports = ports.sort((a, b) =>
        {
            return (a.uiAttribs.order || 0) - (b.uiAttribs.order || 0);
        });

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
        if (!this._visible) return;

        this.opUiAttribs.translate.x = this.opUiAttribs.translate.x || 1;
        this.opUiAttribs.translate.y = this.opUiAttribs.translate.y || 1;
        this._glRectBg.setPosition(this.opUiAttribs.translate.x, this.opUiAttribs.translate.y, this.getPosZ());

        if (this._glRectSelected) this._glRectSelected.setPosition(-gui.theme.patch.selectedOpBorderX / 2, -gui.theme.patch.selectedOpBorderY / 2, gluiconfig.zPosGlRectSelected);

        if (this._glTitle) this._glTitle.setPosition(this._getTitlePosition(), 0, gluiconfig.zPosGlTitle);
        if (this._titleExt) this._titleExt.setPosition(this._getTitleExtPosition(), 0, gluiconfig.zPosGlTitle);
        this._updateCommentPosition();
        this._updateIndicators();

        if (this._oldPosx != this.opUiAttribs.translate.x || this._oldPosy != this.opUiAttribs.translate.y)
        {
            this._oldPosx = this.opUiAttribs.translate.x;
            this._oldPosy = this.opUiAttribs.translate.y;
            this.emitEvent("move");
        }
    }

    getUiAttribs()
    {
        return this.opUiAttribs;
    }

    _getTitleWidth()
    {
        let w = 0;
        if (this._titleExt) w += this._titleExt.width + gluiconfig.OpTitlePaddingExtTitle;
        if (this._glTitle) w += this._glTitle.width;

        w += gluiconfig.OpTitlePaddingLeftRight * 2.0;

        return w;
    }

    _getTitlePosition()
    {
        return gluiconfig.OpTitlePaddingLeftRight;
    }

    _getTitleExtPosition()
    {
        return gluiconfig.OpTitlePaddingLeftRight + this._glTitle.width + gluiconfig.OpTitlePaddingExtTitle;
    }

    updateVisible()
    {
        if (!this._wasInCurrentSubpatch && this.isInCurrentSubPatch())
        {
            if (!this._wasInited)
            {
                this._initGl();
            }
            this._initWhenFirstInCurrentSubpatch();
        }
        this._setVisible();
    }

    set visible(v)
    {
        this._setVisible(v);
    }

    get visible()
    {
        if (!this.isInCurrentSubPatch()) return false;
        return this._visible;
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
        let changed = false;
        if (this._visible == v) return;
        if (v !== undefined)
        {
            changed = true;
            this._visible = v;
        }

        let visi = this._visible;

        if (this.opUiAttribs.hidden || !this.isInCurrentSubPatch()) visi = false;

        for (let i = 0; i < this._glRectNames.length; i++)
            if (this[this._glRectNames[i]])
                this[this._glRectNames[i]].visible = visi;

        if (changed)
            this._updateIndicators();

        if (this._resizableArea) this._resizableArea.visible = visi;
        if (this._glColorIndicator) this._glColorIndicator.visible = visi;

        if (changed)
            for (const i in this._links) this._links[i].visible = true;

        if (!visi) this._isHovering = false;
    }


    _updateIndicators()
    {
        if (this._disposed) return;
        if (!this.isInCurrentSubPatch())
        {
            // if (this._glDotHint) this._glDotHint.visible = false;
            // if (this._glDotWarnings) this._glDotWarnings.visible = false;
            // if (this._glDotError) this._glDotError.visible = false;
            // if (this._glNotWorkingCross) this._glNotWorkingCross.visible = false;
            // if (this._glLoadingIndicator) this._glLoadingIndicator.visible = false;

            // return;
        }

        if (this.opUiAttribs.loading)
        {
            if (!this._glLoadingIndicator)
            {
                this._glLoadingIndicator = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glLoadingIndicator.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this._glLoadingIndicator.setColor(gui.theme.colors_patch.opErrorHint);
                this._glLoadingIndicator.setShape(8);

                this._glLoadingIndicator.setColor(1, 1, 1, 1);

                this._glLoadingIndicator.setPosition(-(this._height * 0.125), (this._height * 0.375), -0.05);
                this._glLoadingIndicator.visible = true;
            }
        }
        if (!this.opUiAttribs.loading && this._glLoadingIndicator)
        {
            this._glLoadingIndicator = this._glLoadingIndicator.dispose();
            // console.log("stop loading!", this._glLoadingIndicator);
        }

        if (this.opUiAttribs.uierrors && this.opUiAttribs.uierrors.length > 0)
        {
            let hasHints = false;
            let hasWarnings = false;
            let hasErrors = false;
            let notworking = false;

            for (let i = 0; i < this.opUiAttribs.uierrors.length; i++)
            {
                if (this.opUiAttribs.uierrors[i].level == 0) hasHints = true;
                if (this.opUiAttribs.uierrors[i].level == 1) hasWarnings = true;
                if (this.opUiAttribs.uierrors[i].level == 2) hasErrors = true;
                if (this.opUiAttribs.uierrors[i].level == 3) notworking = true;
            }

            let dotX = 0 - gui.theme.patch.opStateIndicatorSize / 2;
            const dotY = this.h / 2 - gui.theme.patch.opStateIndicatorSize / 2;

            if (hasHints && !this._glDotHint)
            {
                this._glDotHint = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glDotHint.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this._glDotHint.setColor(gui.theme.colors_patch.opErrorHint);
                this._glDotHint.setShape(6);
            }

            if (hasWarnings && !this._glDotWarning)
            {
                this._glDotWarning = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glDotWarning.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this._glDotWarning.setColor(gui.theme.colors_patch.opErrorWarning);
                this._glDotWarning.setShape(6);
            }

            if (hasErrors && !this._glDotError)
            {
                this._glDotError = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glDotError.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this._glDotError.setColor(gui.theme.colors_patch.opError);
                this._glDotError.setShape(6);
                this._glDotError.interactive = false;
            }

            if (notworking && !this._glNotWorkingCross)
            {
                this._glNotWorkingCross = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
                this._glNotWorkingCross.setSize(this._height * 0.25, this._height * 0.25);
                this._glNotWorkingCross.setColor(gui.theme.colors_patch.opNotWorkingCross);
                this._glNotWorkingCross.setShape(7);
                this._glNotWorkingCross.interactive = false;
            }

            if (hasHints)
            {
                this._glDotHint.setPosition(dotX, dotY, 0);
                this._glDotHint.visible = true;
                dotX += 2;
            }


            if (hasWarnings)
            {
                this._glDotWarning.setPosition(dotX, dotY, 0);
                this._glDotWarning.visible = true;
                dotX += 2;
            }

            if (hasErrors)
            {
                this._glDotError.setPosition(dotX, dotY, 0);
                this._glDotError.visible = true;
                dotX += 2;
            }

            if (notworking)
            {
                this._glNotWorkingCross.setPosition(-(this._height * 0.125), (this._height * 0.375));
                this._glNotWorkingCross.visible = true;
            }

            if (!hasHints && this._glDotHint) this._glDotHint = this._glDotHint.dispose();
            if (!hasWarnings && this._glDotWarning) this._glDotWarning = this._glDotWarning.dispose();
            if (!hasErrors && this._glDotError) this._glDotError = this._glDotError.dispose();
            if (!notworking && this._glNotWorkingCross) this._glNotWorkingCross = this._glNotWorkingCross.dispose();
            if (!hasHints && this._glDotHint) this._glDotHint = this._glDotHint.dispose();
        }
        else
        {
            if (this._glDotHint) this._glDotHint = this._glDotHint.dispose();
            if (this._glDotWarning) this._glDotWarning = this._glDotWarning.dispose();
            if (this._glDotError) this._glDotError = this._glDotError.dispose();
            if (this._glNotWorkingCross) this._glNotWorkingCross = this._glNotWorkingCross.dispose();
            if (this._glDotHint) this._glDotHint = this._glDotHint.dispose();
        }

        if (
            (!this.opUiAttribs.uierrors || this.opUiAttribs.uierrors.length == 0) &&
            (this._glDotError || this._glDotWarning || this._glDotHint))
        {
            this._disposeDots();
        }
    }

    _shortenExtTitle(str)
    {
        if (str.startsWith("data:") && str.indexOf(":") > -1)
        {
            const parts = str.split(";");
            str = parts[0];
        }
        if (str.length > 50)str.slice(0, 50);
        return str;
    }

    update()
    {
        if (this._disposed) return;
        if (!this._wasInCurrentSubpatch) return this._setVisible();
        let doUpdateSize = false;

        if ((this.opUiAttribs.hasArea || this._displayType == this.DISPLAY_UI_AREA) && !this._resizableArea)
            this._resizableArea = new GlArea(this._instancer, this);



        if (!this._titleExt &&
            (
                this.opUiAttribs.hasOwnProperty("extendTitle") ||
                this.opUiAttribs.hasOwnProperty("extendTitlePort")))
        {
            this._titleExt = new GlText(this._textWriter, " ???");
            this._titleExt.setParentRect(this._glRectBg);
            this._titleExt.visible = this.visible;
        }
        if (this._titleExt &&
            (!this.opUiAttribs.hasOwnProperty("extendTitle") || !this.opUiAttribs.extendTitle) &&
            (!this.opUiAttribs.hasOwnProperty("extendTitlePort") || !this.opUiAttribs.extendTitlePort))
        {
            this._titleExt.dispose();
            this._titleExt = null;
        }

        if (!this.opUiAttribs.resizable && this._rectResize)
        {
            this._rectResize.dispose();
            this._rectResize = null;

            this._op.setUiAttribs({
                "height": 1,
                "width": 0
            });
            this.updateSize();
        }

        if (this.opUiAttribs.hasArea && this._glRectArea)
        {
            this._glRectArea = this._instancer.createRect({ "parent": this._glRectBg, "draggable": false });
            this._glRectArea.setColor(0, 0, 0, 0.15);
        }


        if (this.opUiAttribs.resizable && !this._rectResize)
        {
            this._rectResize = this._instancer.createRect({ "parent": this._glRectBg, "draggable": true });
            this._rectResize.setShape(2);

            if (this.opUiAttribs.hasOwnProperty("resizableX")) this._rectResize.draggableX = this.opUiAttribs.resizableX;
            if (this.opUiAttribs.hasOwnProperty("resizableY")) this._rectResize.draggableY = this.opUiAttribs.resizableY;

            this._rectResize.setSize(gluiconfig.rectResizeSize, gluiconfig.rectResizeSize);
            this._rectResize.setPosition((this.opUiAttribs.width || 0) - this._rectResize.w, (this.opUiAttribs.height || 0) - this._rectResize.h);
            this._rectResize.setColor([0.24, 0.24, 0.24, 1]);

            this._rectResize.draggable = true;
            this._rectResize.draggableMove = true;
            this._rectResize.interactive = true;

            doUpdateSize = true;


            this._rectResize.on("drag", (e) =>
            {
                let w = this._rectResize.x - this.x;
                let h = this._rectResize.y - this.y;

                w = Math.max(this.minWidth, w);

                w = this.glPatch.snap.snapX(w);
                h = this.glPatch.snap.snapY(h);

                for (let i = 0; i < this._glPorts.length; i++)
                    this._glPorts[i].updateSize();

                if (this._op) this._op.setUiAttrib({ "height": h, "width": w });
                this.updateSize();
            });
        }


        const comment = this.opUiAttribs.comment || this.opUiAttribs.comment_text;

        if (comment)
        {
            if (!this._glComment)
            {
                this._glComment = new GlText(this._textWriter, comment);
                this._glComment.setParentRect(this._glRectBg);
                this._glComment.setColor(gui.theme.colors_patch.patchComment);
            }

            if (comment != this._glComment.text) this._glComment.text = comment;
            this._glComment.visible = this.visible;
        }
        else if (this._glComment) this._glComment = this._glComment.dispose();


        if (this.opUiAttribs.hasOwnProperty("comment_title")) this.setTitle(this.opUiAttribs.comment_title);
        else if (this.opUiAttribs.title != this._glTitle.text) this.setTitle(this.opUiAttribs.title);

        if (this._titleExt)
        {
            if (this.opUiAttribs.hasOwnProperty("extendTitlePort") && this.opUiAttribs.extendTitlePort)
            {
                const thePort = this._op.getPort(this.opUiAttribs.extendTitlePort);
                if (thePort)
                {
                    const str = this._shortenExtTitle(" " + thePort.getTitle() + ": " + thePort.get());

                    if (str != this._titleExt.text)
                    {
                        this._titleExt.text = str;
                        doUpdateSize = true;
                    }
                }
            }
            else
            if (this.opUiAttribs.hasOwnProperty("extendTitle") && this.opUiAttribs.extendTitle != this._titleExt.text)
            {
                const str = this._shortenExtTitle(" " + this.opUiAttribs.extendTitle || "!?");

                if (this._titleExt.text != str)
                {
                    this._titleExt.text = str;
                    doUpdateSize = true;
                }
            }
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
        this._updateIndicators();

        for (const i in this._links) if (this._links[i]) this._links[i].update();
        this._glPatch.needsRedraw = true;
    }

    // _updateSizeRightHandle()
    // {
    //     if (!this._glRectRightHandle) return;
    //     this._glRectRightHandle.setPosition(this.w, 0);
    //     this._glRectRightHandle.setSize(5, this.h);
    // }

    _updateColors()
    {
        if (!this._glRectBg || !this._glTitle) return;

        if (this.opUiAttribs.comment_title)
        {
            if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color) this._glTitle.setColor(chroma.hex(this.opUiAttribs.color).gl());
            else // this._glTitle.setColor(1, 1, 1);
                this._glTitle.setColor(gui.theme.colors_patch.patchComment);
        }
        else
        {
            if (this._OpNameSpaceColor)
                this._glTitle.setColor(this._OpNameSpaceColor[0], this._OpNameSpaceColor[1], this._OpNameSpaceColor[2]);
            else this._glTitle.setColor(0.8, 0.8, 0.8);
        }

        this._glRectBg.setBorder(this._rectBorder);

        if (this.opUiAttribs.selected)
        {
            this._glRectBg.setSelected(1);
            if (gui.theme.colors_patch.opBgRectSelected) this._glRectBg.setColor(gui.theme.colors_patch.opBgRectSelected);
        }
        else
        {
            this._glRectBg.setSelected(0);


            if (this._transparent)
            {
                this._glRectBg.setColor(gui.theme.colors_patch.transparent);
            }
            else
            {
                if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color)
                {
                    this._glRectBg.setColor(chroma.hex(this.opUiAttribs.color).darken(3.3).gl());

                    // if (!this._glRectRightHandle && this._displayType != this.DISPLAY_UI_AREA)
                    // {
                    //     this._glRectRightHandle = this._instancer.createRect();
                    //     this._glRectRightHandle.setParent(this._glRectBg);
                    //     this._updateSizeRightHandle();
                    // }

                    // if (this._glRectRightHandle) this._glRectRightHandle.setColor(chroma.hex(this.opUiAttribs.color).gl());
                }
                else
                {
                    this._glRectBg.setColor(gui.theme.colors_patch.opBgRect);
                    // if (this._glRectRightHandle && this.opUiAttribs.color == null)
                    // {
                    //     this._glRectRightHandle.dispose();
                    //     this._glRectRightHandle = null;
                    // }
                }
            }
        }


        if (this._displayType === this.DISPLAY_UI_AREA && !this.selected)
        {
            this._glRectBg.setColor(0, 0, 0, 0.15);
        }
        else
        if (!this._op.enabled)
        {
            this._glRectBg.setOpacity(0.15, false);
            this._glTitle.setOpacity(0.5);
        }
        else
        {
            this._glRectBg.setOpacity(0.9, false);
            this._glTitle.setOpacity(1);
        }

        if (this._glNotWorkingCross)
        {
            this._glTitle.setOpacity(0.7, false);
        }

        if (this._hideBgRect && !this.selected)
        {
            this._glRectBg.setOpacity(0.0, true);
        }

        if (this._hidePorts) for (let i = 0; i < this._glPorts.length; i++) this._glPorts[i].rect.setOpacity(0);
        if (this._resizableArea) this._resizableArea._updateColor();
    }

    get selected() { return this.opUiAttribs.selected; }

    set selected(s)
    {
        if (!this._op) return;
        if (this.selected != s || s != this.opUiAttribs.selected)
        {
            if (s != this.opUiAttribs.selected)
            {
                // if (!s) delete this.opUiAttribs.selected;
                // this.opUiAttribs.selected = s;
                this._op.setUiAttribs({ "selected": s });

                for (const i in this._links) this._links[i].updateColor();
                // this._updateColors();


                this._glPatch._updateNumberOfSelectedOps();
                this._glPatch.selectOpId(this._id);
                // console.log("_updateNumberOfSelectedOps");
            }

            this.updatePosition();
            this._updateSelectedRect();
        }
    }

    getPortPos(id, center = true)
    {
        if (!this._op) return;
        this._setPortIndexAttribs(this._op.portsIn);
        return this._op.getPortPosX(id, null, center, this.w);
    }

    isPassiveDrag()
    {
        return !(this._passiveDragStartX == null && this._passiveDragStartY == null);
    }

    endPassiveDrag()
    {
        if (this._passiveDragStartX !== null && this._passiveDragStartY !== null)
            if (this._passiveDragStartX != this.x || this._passiveDragStartY != this.y)
            {
                const undmove = (function (scope, newX, newY, oldX, oldY)
                {
                    undo.add({
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
                }(this, this._passiveDragStartX, this._passiveDragStartY, this.x, this.y));

                gui.savedState.setUnSaved("opDrag");
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

        x = this._glPatch.snap.snapOpX(x, this._op);
        y = this._glPatch.snap.snapY(y, this._glPatch._pressedCtrlKey);

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
                if (op)ports.push(op.getGlPort(this._links[i].nameInput));
            }
        }

        return ports;
    }

    updateTheme()
    {
        this._OpNameSpaceColor = GlPatch.getOpNamespaceColor(this._op.objName);
        this._updateColors();

        for (const i in this._links) this._links[i].updateTheme();

        this.update();
        this.updateSize();
        this._updateIndicators();

        if (this._titleExt) this._titleExt.setColor(gui.theme.colors_patch.opTitleExt);
        if (this._glRectSelected) this._glRectSelected.setColor(gui.theme.colors_patch.selected);

        if (this._glDotHint) this._glDotHint.setColor(gui.theme.colors_patch.opErrorHint);
        if (this._glDotWarning) this._glDotWarning.setColor(gui.theme.colors_patch.opErrorWarning);
        if (this._glDotError) this._glDotError.setColor(gui.theme.colors_patch.opError);
        if (this._glNotWorkingCross) this._glNotWorkingCross.setColor(gui.theme.colors_patch.opNotWorkingCross);


        if (this._glDotHint) this._glDotHint.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
        if (this._glDotWarning) this._glDotWarning.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
        if (this._glDotError) this._glDotError.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
        if (this._glLoadingIndicator) this._glLoadingIndicator.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
    }
}

