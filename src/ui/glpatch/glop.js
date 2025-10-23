import { Logger, Events } from "cables-shared-client";
import { Port } from "cables";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import GlPort from "./glport.js";
import GlText from "../gldraw/gltext.js";
import GlArea from "./glarea.js";
import undo from "../utils/undo.js";
import gluiconfig from "./gluiconfig.js";
import GlPatch from "./glpatch.js";
import defaultOps from "../defaultops.js";
import Gui, { gui } from "../gui.js";
import GlRect from "../gldraw/glrect.js";
import GlTextWriter from "../gldraw/gltextwriter.js";
import { userSettings } from "../components/usersettings.js";
import { PortDir, portType } from "../core_constants.js";
import { UiOp } from "../core_extend_op.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import GlLink from "./gllink.js";
import SuggestionDialog from "../components/suggestiondialog.js";

/**
 * rendering of ops on the patchfield {@link GlPatch}
 *
 * @export
 * @class GlOp
 * @extends {Events}
 */
export default class GlOp extends Events
{

    static COLORINDICATOR_SPACING = 5;
    static COLORINDICATOR_WIDTH = 6;

    /** @type Logger */
    #log = new Logger("glop");

    /** @type Boolean */
    #visible = true;

    /** @type GlRectInstancer */
    #instancer;

    /** @type String */
    #id;

    /** @type {GlPatch} */
    #glPatch;

    /** @type {GlRect} */
    _glRectArea = null;

    _titleExtPortTimeout = null;
    _titleExtPortLastTime = null;

    /** @type {Port} */
    _titleExtPort = null;
    _titleExtPortListener = null;

    /** @type GlText */
    _titleExt = null;

    /** @type {Boolean} */
    _needsUpdate = true;

    /** @type {GlTextWriter} */
    #textWriter = null;

    /** @type {GlArea} */
    _resizableArea = null;

    /** @type {GlRect} */
    _glRectSelected = null;

    /** @type {GlRect} */
    #glRectHighlighted = null;

    /** @type {GlRect} */
    #glRectBg = null;

    /** @type {GlRect} */
    _rectResize = null;

    /** @type {GlRect} */
    _glColorSwatch = null;

    /** @type {GlRect} */
    _glColorIndicator = null;

    /** @type {GlRect} */
    _glColorIndicatorSpacing = null;

    /** @type {GlRect} */
    _glRerouteDot = null;

    minWidth = 10;

    /** @type GlText */
    #glTitle = null;

    /** @type GlText */
    _glComment = null;

    /** @type {Boolean} */
    _hidePorts = false;

    /** @type {Boolean} */
    _hideBgRect = false;

    displayType = 0;

    /** @type {GlPort[]} */
    #glPorts = [];

    /** @type {import("cables/src/core/core_patch.js").OpUiAttribs } */
    opUiAttribs = {};
    _links = {};
    _visPort = null;

    /** @type {GlRect} */
    _glRectContent = null;
    _passiveDragStartX = null;
    _passiveDragStartY = null;
    _dragOldUiAttribs = null;
    _rectBorder = 0;

    /** @type {GlRect} */
    #glLoadingIndicator = null;

    /** @type {GlRect} */
    #glNotWorkingCross = null;

    /** @type {GlRect} */
    #glDotError = null;

    /** @type {GlRect} */
    #glDotWarning = null;

    /** @type {GlRect} */
    #glDotHint = null;

    /** @type {Boolean} */
    _transparent = false;

    /** @type {Boolean} */
    #wasInited = false;

    /** @type {Boolean} */
    #wasInCurrentSubpatch = false;

    /** @type {UiOp} */
    #op;

    /**
     * @param {GlPatch} glPatch
     * @param {GlRectInstancer} instancer
     * @param {UiOp} op
     */
    constructor(glPatch, instancer, op)
    {

        super();

        this.DISPLAY_DEFAULT = 0;
        this.DISPLAY_COMMENT = 1;
        this.DISPLAY_UI_AREA = 2;
        this.DISPLAY_UI_AREA_INSTANCER = 3;
        this.DISPLAY_SUBPATCH = 3;
        this.DISPLAY_REROUTE_DOT = 4;

        this.#id = op.id;

        /** @type {GlPatch} */
        this.#glPatch = glPatch;

        this.#op = op;

        /** @type String */
        this._objName = op.objName;

        this.#instancer = instancer;

        /** @type {Number} */
        this._width = gluiconfig.opWidth;

        /** @type {Number} */
        this._height = gluiconfig.opHeight;

        this._origPosZ = gluiconfig.zPosOpSelected;// + (0.1 + Math.random() * 0.01);

        this.setUiAttribs({}, op.uiAttribs);
        if (this.#op)
        {
            this.#op.on("onStorageChange", () =>
            {
                this._storageChanged();
            });

            this.#op.on("portOrderChanged", () =>
            {
                this.refreshPorts();
            });

            this.#op.on("onPortRemoved", () =>
            {
                this.refreshPorts();
            });

            if (this.#op.objName.indexOf("Ops.Ui.Comment") === 0) this.displayType = this.DISPLAY_COMMENT;// todo: better use uiattr comment_title
            else if (this.#op.objName.indexOf("Ops.Ui.Area") === 0) this.displayType = this.DISPLAY_UI_AREA;
        }

        this._initGl();

        this.#glPatch.on("mouseOverPort", (_num) =>
        {
            this._onMouseHover();

        });
        this.#glPatch.on("mouseOverPortOut", (_num) =>
        {
            this._onMouseHover();

        });

        this.#glPatch.on("selectedOpsChanged", (_num) =>
        {
            if (!this.#visible) return;
            this._updateSelectedRect();
            if (this._glRectSelected) this.updateSize();
        });

    }

    _storageChanged()
    {
        if (this.#op?.isSubPatchOp())
        {
            this.displayType = this.DISPLAY_SUBPATCH;
            this._rectBorder = 1;

            if (this.#op.isSubPatchOp()) this._rectBorder = gluiconfig.subPatchOpBorder;
            this._updateColors();
            this.refreshPorts();

            this.#op.patch.on("subpatchExpose", (subpatchid) =>
            {
                if (this.#op && this.#op.patchId && this.#op.patchId.get() === subpatchid) this.refreshPorts();
            });
        }
    }

    _initWhenFirstInCurrentSubpatch()
    {
        if (this.#wasInCurrentSubpatch) return;
        if (!this.isInCurrentSubPatch()) return;

        this.#wasInCurrentSubpatch = true;

        this._storageChanged();
        this.refreshPorts();

        if (this.#glRectBg)
        {
            this.#glRectBg.on(GlRect.EVENT_DRAG, this._onBgRectDrag.bind(this));
            this.#glRectBg.on(GlRect.EVENT_DRAGEND, this._onBgRectDragEnd.bind(this));
            this.#glRectBg.on(GlRect.EVENT_POINTER_DOWN, this._onMouseDown.bind(this));

            this.#glRectBg.on(GlRect.EVENT_POINTER_HOVER, this._onMouseHover.bind(this));
            this.#glRectBg.on(GlRect.EVENT_POINTER_UNHOVER, this._onMouseUnHover.bind(this));
            this.#glRectBg.on(GlRect.EVENT_POINTER_UP, this._onMouseUp.bind(this));
        }

        this._needsUpdate = true;
        this.setHover(false);
        this.updateVisible();
        this.updateSize();
    }

    _initGl()
    {
        this.#glRectBg = this.#instancer.createRect({ "interactive": true, "draggable": true, "name": "opBg" });
        this.#glRectBg.setSize(gluiconfig.opWidth, gluiconfig.opHeight);
        this.#glRectBg.setColorArray(gui.theme.colors_patch.opBgRect);

        this._initWhenFirstInCurrentSubpatch();
        this.#wasInited = true;
    }

    get objName() { return this._objName; }

    get glPatch() { return this.#glPatch; }

    get isDragging() { if (this.#glRectBg) return this.#glRectBg.isDragging; else return false; }

    get x() { if (this.opUiAttribs.translate) return this.opUiAttribs.translate.x; else return 0; }

    get y() { if (this.opUiAttribs.translate) return this.opUiAttribs.translate.y; else return 0; }

    get w() { return this._width; }

    get h() { return this._height; }

    get id() { return this.#id; }

    get title() { return this.opUiAttribs.title; }

    get op() { return this.#op; }

    /**
     * @param {any} _rect
     * @param {any} _offx
     * @param {any} _offy
     * @param {any} _button
     * @param {any} _e
     */
    _onBgRectDrag(_rect, _offx, _offy, _button, _e)
    {
        if (gui.longPressConnector.isActive()) return;
        if (!this.#glRectBg) return;
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

        const glOps = this.#glPatch.selectedGlOps;
        const ids = Object.keys(glOps);

        if (!glOps || ids.length == 0) return;
        if (this.#glPatch.isDraggingPort()) return;

        if (!glOps[ids[0]].isPassiveDrag())
            for (const i in glOps)
                glOps[i].startPassiveDrag();

        let offX = this.#glRectBg.dragOffsetX;
        let offY = this.#glRectBg.dragOffsetY;

        if (this.glPatch.mouseState.shiftKey)
            if (Math.abs(offX) > Math.abs(offY)) offY = 0;
            else offX = 0;

        for (const i in glOps)
            glOps[i].setPassiveDragOffset(offX, offY);

        this.#glPatch.opShakeDetector.move(offX);

        if (gui.patchView.getSelectedOps().length == 1)
        {
            this.#glRectBg.setOpacity(0.8, false);
            this.updatePosition();
        }
    }

    getPosZ()
    {
        if (!this.op.isLinked()) return gluiconfig.zPosOpUnlinked;
        if (this.selected) return gluiconfig.zPosOpSelected;
        return gluiconfig.zPosOpUnSelected;
    }

    _onBgRectDragEnd()
    {
        const glOps = this.#glPatch.selectedGlOps;

        const oldUiAttribs = JSON.parse(this._dragOldUiAttribs);

        if (!this.#op || !oldUiAttribs || !oldUiAttribs.translate) return;

        let changed =
            oldUiAttribs.translate.x != this.#op.uiAttribs.translate.x ||
            oldUiAttribs.translate.y != this.#op.uiAttribs.translate.y;

        if (changed)
        {
            const undoGroup = undo.startGroup();

            for (const i in glOps) glOps[i].endPassiveDrag();

            (function (scope, _oldUiAttribs)
            {
                if (!scope.#op) return;

                const newUiAttr = JSON.stringify(scope.#op.uiAttribs);
                undo.add({
                    "title": "Move op",
                    undo()
                    {
                        try
                        {
                            const u = JSON.parse(_oldUiAttribs);
                            // scope._glRectBg.setPosition(u.translate.x, u.translate.y);
                            scope.#glPatch.patchAPI.setOpUiAttribs(scope.#id, "translate", { "x": u.translate.x, "y": u.translate.y });
                        }
                        catch (e) {}
                    },
                    redo()
                    {
                        const u = JSON.parse(newUiAttr);
                        scope.#glPatch.patchAPI.setOpUiAttribs(scope.#id, "translate", { "x": u.translate.x, "y": u.translate.y });

                    /*
                     * scope.op.uiAttribs.translate = { "x": u.translate.x, "y": u.translate.y };
                     * scope._glRectBg.setPosition(u.translate.x, u.translate.y);
                     */
                    }
                });
            }(this, this._dragOldUiAttribs + ""));

            gui.patchView.testCollision(this.#op);

            undo.endGroup(undoGroup, "Move Ops");
        }
    }

    /**
     * @param {MouseEvent} e
     */
    _onMouseDown(e)
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_EXPLORER) return;

        if (!this.#op)
        {
            this.#log.warn("glop no op", this);
            return;
        }

        const perf = gui.uiProfiler.start("[glop] mouseDown");

        if (this.#op.objName == defaultOps.defaultOpNames.uiArea)
        {
            if (this.opUiAttribs.translate)
                this.#glPatch._selectOpsInRect(
                    this.opUiAttribs.translate.x,
                    this.opUiAttribs.translate.y,
                    this.opUiAttribs.translate.x + this.opUiAttribs.area.w,
                    this.opUiAttribs.translate.y + this.opUiAttribs.area.h
                );
        }

        this.#glPatch.opShakeDetector.down(e.offsetX, e.offsetY);

        if (!e.shiftKey)
            if (e.touchType == "mouse")
            {
                if (this.isHovering()) this.#glPatch.patchAPI.showOpParams(this.#id);
            }
            else
            {
                this.#glPatch.patchAPI.showOpParams(this.#id);
            }

        if (e.altKey || e.metaKey)
        {
            if (!e.shiftKey) this.#glPatch.unselectAll();
            gui.patchView.selectChilds(this.op.id);
            this.#glPatch.emitEvent("selectedOpsChanged", gui.patchView.getSelectedOps());
        }

        if (!this.selected)
        {
            if (!e.shiftKey) this.#glPatch.unselectAll();
            this.#glPatch.selectOpId(this.id);
        }

        if (this.#op && this.#op.uiAttribs)
        {
            this._dragOldUiAttribs = JSON.stringify(this.#op.uiAttribs);

            if (this.#glPatch.mouseState.buttonMiddle)
            {
                if (userSettings.get("quickLinkMiddleMouse")) gui.longPressConnector.longPressStart(this.#op, e, { "delay": 10 });
            }
            else
            {
                if (userSettings.get("quickLinkLongPress")) gui.longPressConnector.longPressStart(this.#op, e);
            }
        }

        perf.finish();
    }

    _onMouseHover()
    {
        if (this.#glRectBg?.isHovering())
        {
            if (this.#glPatch.portDragLine?.isActive && this.#glPatch.portDragLine?.glOp != this && this.glPatch.hoverPort == null)
            {
                if (!this.#glPatch.suggestionTeaser)
                    this.#glPatch.suggestionTeaser = new SuggestionDialog([
                        { "name": "" },
                        { "name": "" },
                        { "name": "" }
                    ],
                    null,
                    { "clientX": 0, "clientY": 0 },
                    null,
                    null,
                    null,
                    null,
                    { "noAnim": false, "tease": true, "hide": true, "opacity": 0.5 });

                this.#glPatch.suggestionTeaser.show();
                this.#glPatch.suggestionTeaser.setPos(this.#glPatch.viewBox.mouseX, this.#glPatch.viewBox.mouseY);
            }
            if (this.glPatch.hoverPort != null) this._onMouseUnHover();
        }
    }

    _onMouseUnHover()
    {

        if (this.#glPatch.suggestionTeaser)
        {
            this.#glPatch.suggestionTeaser.close();
            this.#glPatch.suggestionTeaser = null;
        }
    }

    /**
     * @param {any} e
     */
    _onMouseUp(e)
    {
        if (this.#glPatch.mouseState.buttonMiddle)
        {
            if (gui.longPressConnector.isActive()) gui.longPressConnector.finish(e, this.#op);
        }

        this.#glPatch.opShakeDetector.up();
        this.#glPatch.emitEvent("mouseUpOverOp", e, this.#id);
        this._onMouseUnHover();

        this.endPassiveDrag();
        this.glPatch.snap.update();
    }

    /**
     * @param {import("cables/src/core/core_op.js").OpUiAttribs} newAttribs
     * @param {import("cables/src/core/core_op.js").OpUiAttribs} attr
     */
    setUiAttribs(newAttribs, attr)
    {
        const perf = gui.uiProfiler.start("[glop] setuiattribs");

        if (newAttribs && newAttribs.selected) this.#glPatch.selectOpId(this.#id);
        if (newAttribs && !this.opUiAttribs.selected && newAttribs.selected) this.#glPatch.selectOpId(this.#id);

        this.opUiAttribs = JSON.parse(JSON.stringify(attr));

        if (this.opUiAttribs.extendTitlePort && (!this._titleExtPort || this._titleExtPort.name != this.opUiAttribs.extendTitlePort))
        {
            if (this._titleExtPort)
            {
                this._titleExtPort.off(this._titleExtPortlister);
                this._titleExtPort = null;
            }
            this._titleExtPort = this.#op.getPort(this.opUiAttribs.extendTitlePort);
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

        if (this.opUiAttribs.display == "reroute")
        {
            this.displayType = this.DISPLAY_REROUTE_DOT;
            this._hideBgRect = true;
        }
        if (newAttribs.hasOwnProperty("highlighted")) this._updateHighlighted();
        if (newAttribs.hasOwnProperty("highlightedMore")) this._updateHighlighted();

        if (newAttribs.hasOwnProperty("hidden")) this.updateVisible();
        if (newAttribs.color) this._updateColors();

        if (newAttribs.hasOwnProperty("loading")) this._updateIndicators();
        if (newAttribs.hasOwnProperty("translate")) this.updatePosition();

        if (newAttribs.hasOwnProperty("resizable"))
        {
            for (let i = 0; i < this.#glPorts.length; i++) this.#glPorts[i].updateSize();
            this.updateSize();
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

    /**
     * @param {string} [title]
     * @param {GlTextWriter} [textWriter]
     */
    setTitle(title, textWriter)
    {
        const perf = gui.uiProfiler.start("[glop] set title");

        if (!title) title = this.#op.getTitle();
        if (textWriter) this.#textWriter = textWriter;
        if (title === undefined)title = "";

        if (
            this.displayType != this.DISPLAY_COMMENT &&
            this.displayType != this.DISPLAY_UI_AREA &&
            title != "var set" &&
            title != "var get" &&
            title != "*" &&
            title != "/" &&
            title != "+" &&
            title != "-" &&
            title != this.#op.shortName) title = "\"" + title + "\"";

        if (this.opUiAttribs.mathTitle)
        {
            let mathStr = "";

            if (!this.#op.portsIn[0].isLinked()) mathStr += this.#op.portsIn[0].get();
            else if (!this.#op.portsIn[1].isLinked())mathStr += "x";

            if (this.#op.objName.indexOf(defaultOps.defaultOpNames.Sum) == 0) mathStr += "+";
            else if (this.#op.objName.indexOf(defaultOps.defaultOpNames.Multiply) == 0) mathStr += "*";
            else if (this.#op.objName.indexOf(defaultOps.defaultOpNames.Divide) == 0) mathStr += "/";
            else if (this.#op.objName.indexOf(defaultOps.defaultOpNames.Subtract) == 0) mathStr += "-";
            else if (this.#op.objName.indexOf(defaultOps.defaultOpNames.GreaterThan) == 0) mathStr += ">";
            else if (this.#op.objName.indexOf(defaultOps.defaultOpNames.LessThan) == 0) mathStr += "<";
            else mathStr += "?";

            if (!this.#op.portsIn[1].isLinked()) mathStr += this.#op.portsIn[1].get();
            else if (!this.#op.portsIn[0].isLinked()) mathStr += "x";

            title = mathStr;
        }

        if (!this.#glTitle)
        {
            this.#glTitle = new GlText(this.#textWriter, title);
            this.#glTitle.setParentRect(this.#glRectBg);
            this._OpNameSpaceColor = GlPatch.getOpNamespaceColor(this.#op.objName);

            if (this.#op.objName.indexOf("Ops.Ui.Comment") === 0)
            {
                this.displayType = this.DISPLAY_COMMENT;
                this._hidePorts = true;
                this._hideBgRect = true;
                this._transparent = true;
            }

            if (this.opUiAttribs.comment_title) // this._op.objName.indexOf("Ops.Ui.Comment") === 0
            {
                this._hidePorts = true;
                this.#glTitle.scale = 4;
            }
            this._updateColors();
        }
        else
        {
            if (this.#glTitle.text != String(title)) this.#glTitle.text = String(title);
        }

        perf.finish();
        this.updateSize();
    }

    _updateCommentPosition()
    {
        if (this._glComment)
        {
            let x = this.w + gluiconfig.portWidth;
            if (this._rectResize) x += this._rectResize.w;
            if (this._glColorSwatch) x += this._height / 2;
            if (!this._hideBgRect) this._glComment.setPosition(x, 0, 0); // normal op comment
            else this._glComment.setPosition(12, this._height, 0); // comment op (weird hardcoded values because of title scaling)
        }
    }

    _updateSelectedRect()
    {
        if (!this.#visible || (!this.selected && this._glRectSelected))
        {
            this._glRectSelected.visible = false;
            return;
        }

        if (this.selected)
        {
            if (!this._glRectSelected)
            {
                if (!this.#instancer) return; // how?

                this._glRectSelected = this.#instancer.createRect({ "name": "rectSelected", "parent": this.#glRectBg, "interactive": false });
                this._glRectSelected.setColorArray(gui.theme.colors_patch.selected);

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

        if (!this.#glRectBg) return;

        const perf = gui.uiProfiler.start("[glop] updatesize");

        let oldGroup = "";
        let groupIndex = 0;
        for (let i = 0; i < this.#glPorts.length; i++)
        {
            if (this.#glPorts[i].port.uiAttribs.group != oldGroup)
            {
                oldGroup = this.#glPorts[i].port.uiAttribs.group;
                groupIndex++;
            }
            this.#glPorts[i].groupIndex = groupIndex;
        }

        const oldHeight = this._height;
        for (let i = 0; i < this.#glPorts.length; i++)
        {
            if (this.#glPorts[i].direction == Port.DIR_IN) portsWidthIn += this.#glPorts[i].width + gluiconfig.portPadding;
            else portsWidthOut += this.#glPorts[i].width + gluiconfig.portPadding;
        }

        if (portsWidthIn != 0) portsWidthIn -= gluiconfig.portPadding;
        if (portsWidthOut != 0) portsWidthOut -= gluiconfig.portPadding;

        this._width = this._getTitleWidth();
        this.minWidth = this._width = Math.max(this._width, Math.max(portsWidthOut, portsWidthIn));
        if (this.#glTitle) this._height = Math.max(this.#glTitle.height + 5, this.#glRectBg.h);

        if (this.opUiAttribs.height) this._height = this.glPatch.snap.snapY(this.opUiAttribs.height);
        if (this.opUiAttribs.width) this._width = this.glPatch.snap.snapX(Math.max(this.minWidth, this.opUiAttribs.width));

        if (this._height < gluiconfig.opHeight) this._height = gluiconfig.opHeight;

        // if (this.displayType == this.DISPLAY_UI_AREA) this._width = this._height = 20;

        if (this.displayType == this.DISPLAY_REROUTE_DOT)
        {
            this._hidePorts = true;
            this._width = this._height = gluiconfig.opHeight * 0.35;
        }

        if (oldHeight != this._height)
            for (let i = 0; i < this.#glPorts.length; i++)
                this.#glPorts[i].updateSize();

        if (this._rectResize)
            this._rectResize.setPosition(this._width, this._height - this._rectResize.h);

        if (this._glColorIndicator)
        {
            let h = this._height;
            if (this._glRectArea)h = this._glRectArea.h;
            if (this.opUiAttribs.area)h = this.opUiAttribs.area.h;

            this._glColorIndicator.setPosition(-GlOp.COLORINDICATOR_WIDTH - GlOp.COLORINDICATOR_SPACING, 0);
            this._glColorIndicator.setSize(GlOp.COLORINDICATOR_WIDTH,	 h);
            this._glColorIndicatorSpacing.setSize(GlOp.COLORINDICATOR_SPACING, h);
        }

        if (this._glColorIndicator && !this.opUiAttribs.color)
        {
            this._glColorIndicator.dispose();
            this._glColorIndicator = null;
            this._glColorIndicatorSpacing.dispose();
            this._glColorIndicatorSpacing = null;
        }

        let ext = 0;
        const indicSize = 0.4;
        if (this._rectResize)ext += this._rectResize.w;
        if (this._glColorSwatch)ext += this._height * (indicSize + indicSize);
        this.#glRectBg.setSize(this._width + ext, this._height);

        if (this._glColorSwatch)
        {
            this._glColorSwatch.setPosition(this._width + (this._height * indicSize * 0.5), this._height * ((1.0 - indicSize) / 2));
            this._glColorSwatch.setSize(this._height * indicSize, this._height * indicSize);
            this._width += this._height * indicSize;
        }

        if (this._glRectSelected)
        {
            if (this.#glPatch._numSelectedGlOps > 1)
            {
                this._glRectSelected.setSize(this._width + gui.theme.patch.selectedOpBorderX, this._height + gui.theme.patch.selectedOpBorderY);
            }
            else
            {
                this._glRectSelected.setSize(0, 0);
            }
        }
        if (this.opUiAttribs.widthOnlyGrow) this._width = Math.max(this._width, this.#glRectBg.w);

        perf.finish();
        this._updateHighlighted();
        this._updateCommentPosition();
    }

    /**
     * @param {GlLink} l
     */
    addLink(l)
    {
        if (!this.opUiAttribs.translate) this.opUiAttribs.translate = { "x": 0, "y": 0 };

        this._links[l.id] = l;
        l.updateVisible();
        this.updatePosition();
    }

    /**
     * @returns {Boolean}
     */
    isHovering()
    {
        if (this.#glRectBg) return this.#glRectBg.isHovering();
    }

    /**
     * @param {Boolean} h
     */
    setHover(h)
    {
        if (!this._isHovering && h) this.emitEvent("hoverStart");
        if (this._isHovering && !h) this.emitEvent("hoverEnd");

        this._isHovering = h;
    }

    _disposeDots()
    {
        if (this.#glDotError) this.#glDotError = this.#glDotError.dispose();
        if (this.#glDotWarning) this.#glDotWarning = this.#glDotWarning.dispose();
        if (this.#glDotHint) this.#glDotHint = this.#glDotHint.dispose();
        if (this.#glLoadingIndicator) this.#glLoadingIndicator = this.#glLoadingIndicator.dispose();
        if (this.#glNotWorkingCross) this.#glNotWorkingCross = this.#glNotWorkingCross.dispose();
    }

    dispose()
    {
        this._disposed = true;

        if (this._glRerouteDot) this._glRerouteDot = this._glRerouteDot.dispose();
        if (this._glRectArea) this._glRectArea = this._glRectArea.dispose();
        if (this.#glRectBg) this.#glRectBg = this.#glRectBg.dispose();
        if (this._glRectSelected) this._glRectSelected = this._glRectSelected.dispose();
        if (this.#glRectHighlighted) this.#glRectHighlighted = this.#glRectHighlighted.dispose();
        if (this.#glTitle) this.#glTitle = this.#glTitle.dispose();
        if (this._glComment) this._glComment = this._glComment.dispose();
        if (this._titleExt) this._titleExt = this._titleExt.dispose();
        // if (this._glRectRightHandle) this._glRectRightHandle = this._glRectRightHandle.dispose();
        if (this._resizableArea) this._resizableArea = this._resizableArea.dispose();
        if (this._rectResize) this._rectResize = this._rectResize.dispose();
        if (this._glColorSwatch) this._glColorSwatch = this._glColorSwatch.dispose();
        if (this._glColorIndicator) this._glColorIndicator = this._glColorIndicator.dispose();
        if (this._glColorIndicatorSpacing) this._glColorIndicatorSpacing = this._glColorIndicatorSpacing.dispose();

        this._disposeDots();

        for (let i = 0; i < this.#glPorts.length; i++) this.#glPorts[i].dispose();

        this.#op = null;
        this.#glPorts.length = 0;
        this.#instancer = null;
    }

    removeLink(linkId)
    {
        const l = this._links[linkId];
        if (l)
        {
            delete this._links[linkId];
            this.update();
        }

        if (this.displayType == this.DISPLAY_REROUTE_DOT && Object.keys(this._links).length == 0) this.#glPatch.deleteOp(this.#op.id);
    }

    refreshPorts()
    {
        for (let i = 0; i < this.#glPorts.length; i++) this.#glPorts[i].dispose();
        this.#glPorts.length = 0;

        let portsIn = [];
        let portsOut = [];

        if (!this.#op) return;

        portsIn = portsIn.concat(this.#op.portsIn);

        if (this.displayType === this.DISPLAY_SUBPATCH)
        {
            const ports = gui.patchView.getSubPatchExposedPorts(this.#op.patchId.get(), PortDir.in);

            for (let i = 0; i < ports.length; i++)
                if (portsIn.indexOf(ports[i]) == -1) portsIn.push(ports[i]);
        }

        portsOut = portsOut.concat(this.#op.portsOut);

        if (this.displayType === this.DISPLAY_SUBPATCH)
        {
            const ports = portsOut.concat(gui.patchView.getSubPatchExposedPorts(this.#op.patchId.get(), PortDir.out));
            for (let i = 0; i < ports.length; i++)
                if (portsOut.indexOf(ports[i]) == -1) portsOut.push(ports[i]);
        }

        this._setupPorts(portsIn);
        this._setupPorts(portsOut);
        this._initColorSwatch();
    }

    /**
     * @param {Port[]} ports
     */
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
                if (ports[i].uiAttribs.glPortIndex != count) emit = true;
                ports[i].setUiAttribs({ "glPortIndex": count });
            }

            if (ports[i].uiAttribs.display == "dropdown") continue;
            if (ports[i].uiAttribs.display == "readonly") continue;
            if (ports[i].uiAttribs.hidePort) continue;
            count++;
        }

        if (emit)
        {
            ports[0].op.emitEvent("glportOrderChanged");
            if (this.op.getSubPatch() != ports[0].op.getSubPatch()) this.#op.emitEvent("glportOrderChanged");
        }
        return ports;
    }

    /**
     */
    _initColorSwatch()
    {
        if (!this.#op) return;
        const ports = this.#op.portsIn;

        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].uiAttribs.colorPick && !this._glColorSwatch)
            {
                if (!this._glColorSwatch)
                {
                    const colorPorts = [ports[i], ports[i + 1], ports[i + 2], ports[i + 3]];

                    this._glColorSwatch = this.#instancer.createRect({ "name": "colorSwatch", "interactive": false, "parent": this.#glRectBg });
                    this._glColorSwatch.setShape(GlRect.SHAPE_FILLED_CIRCLE);

                    this._glColorSwatch.setColor(colorPorts[0].get(), colorPorts[1].get(), colorPorts[2].get(), 1);
                    this.updateSize();

                    const updateColorIndicator = () =>
                    {
                        this._glColorSwatch?.setColor(colorPorts[0]?.get(), colorPorts[1]?.get(), colorPorts[2]?.get(), colorPorts[3]?.get());
                    };

                    colorPorts[0].on(Port.EVENT_UIATTRCHANGE, (attrs, _port) =>
                    {
                        if (attrs.hasOwnProperty("heatmapIntensity"))
                        {
                            this._updateColors();

                        }

                        if (attrs.hasOwnProperty("greyout"))
                        {
                            if (attrs.greyout)
                            {
                                if (this._glColorSwatch)
                                    this._glColorSwatch = this._glColorSwatch.dispose();
                            }
                            else
                            {
                                this._initColorSwatch();
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

    /**
     * @param {Port[]} ports
     */
    _setupPorts(ports)
    {
        let count = 0;

        ports = this._setPortIndexAttribs(ports);

        ports = ports.sort(
            (a, b) =>
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

    /**
     * @param {number} i
     * @param {Port} p
     */
    _setupPort(i, p)
    {
        const glp = new GlPort(this.#glPatch, this, this.#instancer, p, i, this.#glRectBg);
        this.#glPorts.push(glp);
    }

    updatePosition()
    {
        if (!this.#glRectBg) return;
        if (!this.opUiAttribs.translate) return;
        if (!this.#visible) return;

        this.opUiAttribs.translate.x = this.opUiAttribs.translate.x || 1;
        this.opUiAttribs.translate.y = this.opUiAttribs.translate.y || 1;
        this.#glRectBg.setPosition(this.opUiAttribs.translate.x, this.opUiAttribs.translate.y, this.getPosZ());

        if (this._glRectSelected) this._glRectSelected.setPosition(-gui.theme.patch.selectedOpBorderX / 2, -gui.theme.patch.selectedOpBorderY / 2, gluiconfig.zPosGlRectSelected);

        if (this.#glTitle) this.#glTitle.setPosition(this._getTitlePosition(), 0, gluiconfig.zPosGlTitle);
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
        if (this.#glTitle) w += this.#glTitle.width;

        w += gluiconfig.OpTitlePaddingLeftRight * 2.0;

        return w;
    }

    _getTitlePosition()
    {
        return gluiconfig.OpTitlePaddingLeftRight;
    }

    _getTitleExtPosition()
    {
        return gluiconfig.OpTitlePaddingLeftRight + this.#glTitle.width + gluiconfig.OpTitlePaddingExtTitle;
    }

    updateVisible()
    {
        if (!this.#wasInCurrentSubpatch && this.isInCurrentSubPatch())
        {
            if (!this.#wasInited)
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
        return this.#visible;
    }

    getSubPatch()
    {
        return this.opUiAttribs.subPatch;
    }

    isInCurrentSubPatch()
    {
        return this.opUiAttribs.subPatch == this.#glPatch.subPatch;
    }

    /**
     * @param {boolean} [v]
     */
    _setVisible(v)
    {
        let changed = false;
        if (this.#visible == v) return;
        if (v !== undefined)
        {
            changed = true;
            this.#visible = v;
        }

        let visi = this.#visible;

        if (this.opUiAttribs.hidden || !this.isInCurrentSubPatch()) visi = false;

        if (this.#glRectBg) this.#glRectBg.visible = visi;
        if (this._resizableArea) this._resizableArea.visible = visi;
        if (this._titleExt) this._titleExt.visible = visi;
        if (this.#glTitle) this.#glTitle.visible = visi;
        if (this._glComment) this._glComment.visible = visi;

        if (changed) this._updateIndicators();

        if (changed)
            for (const i in this._links) this._links[i].visible = true;

        if (!visi) this._isHovering = false;
    }

    _updateHighlighted()
    {
        if (this._disposed) return;
        if (this.uiAttribs.highlighted)
        {
            if (!this.#glRectHighlighted && this.isInCurrentSubPatch())
                this.#glRectHighlighted = this.#instancer.createRect({ "name": "oploading", "draggable": false, "interactive": false });

            if (this.#glRectHighlighted)
            {
                if (this.#glRectBg?.isHovering() && this.#glPatch.portDragLine?.isActive && this.glPatch.hoverPort == null) this.#glRectHighlighted.setColorArray(this.#glPatch.portDragLine.color);
                else if (this.uiAttribs.highlightedMore) this.#glRectHighlighted.setColor(0.8, 0.8, 0.8, 1);
                else this.#glRectHighlighted.setColor(0.5, 0.5, 0.5, 1);

                this.#glRectHighlighted.setSize(this.#glRectBg.w + 8, this.#glRectBg.h + 8);
                this.#glRectHighlighted.setPosition(this.#glRectBg.x - 4, this.#glRectBg.y - 4, this.#glRectBg.z + 0.3);
                this.#glRectHighlighted.visible = true;

            }
        }
        if (this.#glRectHighlighted && !this.uiAttribs.highlighted) this.#glRectHighlighted = this.#glRectHighlighted.dispose();
    }

    _updateIndicators()
    {
        if (this._disposed) return;
        if (!this.isInCurrentSubPatch())
        {

            /*
             * if (this._glDotHint) this._glDotHint.visible = false;
             * if (this._glDotWarnings) this._glDotWarnings.visible = false;
             * if (this._glDotError) this._glDotError.visible = false;
             * if (this._glNotWorkingCross) this._glNotWorkingCross.visible = false;
             * if (this._glLoadingIndicator) this._glLoadingIndicator.visible = false;
             */

            // return;
        }

        if (this.opUiAttribs.loading)
        {
            if (!this.#glLoadingIndicator && this.isInCurrentSubPatch())
            {
                this.#glLoadingIndicator = this.#instancer.createRect({ "name": "oploading", "parent": this.#glRectBg, "draggable": false, "interactive": false });
                this.#glLoadingIndicator.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this.#glLoadingIndicator.setColorArray(gui.theme.colors_patch.opErrorHint);
                this.#glLoadingIndicator.setShape(8);

                this.#glLoadingIndicator.setColor(1, 1, 1, 1);

                this.#glLoadingIndicator.setPosition(-(this._height * 0.125), (this._height * 0.375), -0.05);
                this.#glLoadingIndicator.visible = true;
            }
        }
        if (!this.opUiAttribs.loading && this.#glLoadingIndicator)
            this.#glLoadingIndicator = this.#glLoadingIndicator.dispose();

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

            if (hasHints && !this.#glDotHint)
            {
                this.#glDotHint = this.#instancer.createRect({ "parent": this.#glRectBg, "interactive": false, "name": "hint dot" });
                this.#glDotHint.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this.#glDotHint.setColorArray(gui.theme.colors_patch.opErrorHint);
                this.#glDotHint.setShape(GlRect.SHAPE_FILLED_CIRCLE);
            }

            if (hasWarnings && !this.#glDotWarning)
            {
                this.#glDotWarning = this.#instancer.createRect({ "parent": this.#glRectBg, "interactive": false, "name": "warn dot" });
                this.#glDotWarning.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this.#glDotWarning.setColorArray(gui.theme.colors_patch.opErrorWarning);
                this.#glDotWarning.setShape(GlRect.SHAPE_FILLED_CIRCLE);
            }

            if (hasErrors && !this.#glDotError)
            {
                this.#glDotError = this.#instancer.createRect({ "parent": this.#glRectBg, "interactive": false, "name": "error dot" });
                this.#glDotError.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
                this.#glDotError.setColorArray(gui.theme.colors_patch.opError);
                this.#glDotError.setShape(GlRect.SHAPE_FILLED_CIRCLE);
                this.#glDotError.interactive = false;
                this.#glDotError.visible = this.#visible && hasErrors;
            }

            if (notworking && !this.#glNotWorkingCross)
            {
                this.#glNotWorkingCross = this.#instancer.createRect({ "parent": this.#glRectBg, "interactive": false, "name": "notwork cross" });
                this.#glNotWorkingCross.setSize(this._height * 0.25, this._height * 0.25);
                this.#glNotWorkingCross.setColorArray(gui.theme.colors_patch.opNotWorkingCross);
                this.#glNotWorkingCross.setShape(GlRect.SHAPE_CROSS);
                this.#glNotWorkingCross.interactive = false;
                this.#glNotWorkingCross.visible = this.visible && notworking;
            }

            if (hasHints)
            {
                this.#glDotHint.setPosition(dotX, dotY, 0);
                this.#glDotHint.visible = this.visible && hasHints;

                dotX += 2;
            }

            if (hasWarnings)
            {
                this.#glDotWarning.setPosition(dotX, dotY, 0);
                this.#glDotWarning.visible = this.visible && hasWarnings;
                dotX += 2;
            }

            if (hasErrors)
            {
                this.#glDotError.setPosition(dotX, dotY, 0);
                this.#glDotError.visible = this.visible && hasErrors;
                dotX += 2;
            }

            if (notworking)
            {
                this.#glNotWorkingCross.setPosition(-(this._height * 0.125), (this._height * 0.375));
                this.#glNotWorkingCross.visible = this.visible && notworking;
            }

            if (!hasHints && this.#glDotHint) this.#glDotHint = this.#glDotHint.dispose();
            if (!hasWarnings && this.#glDotWarning) this.#glDotWarning = this.#glDotWarning.dispose();
            if (!hasErrors && this.#glDotError) this.#glDotError = this.#glDotError.dispose();
            if (!notworking && this.#glNotWorkingCross) this.#glNotWorkingCross = this.#glNotWorkingCross.dispose();
            if (!hasHints && this.#glDotHint) this.#glDotHint = this.#glDotHint.dispose();
        }
        else
        {
            if (this.#glDotHint) this.#glDotHint = this.#glDotHint.dispose();
            if (this.#glDotWarning) this.#glDotWarning = this.#glDotWarning.dispose();
            if (this.#glDotError) this.#glDotError = this.#glDotError.dispose();
            if (this.#glNotWorkingCross) this.#glNotWorkingCross = this.#glNotWorkingCross.dispose();
            if (this.#glDotHint) this.#glDotHint = this.#glDotHint.dispose();
        }

        if (
            (!this.opUiAttribs.uierrors || this.opUiAttribs.uierrors.length == 0) &&
            (this.#glDotError || this.#glDotWarning || this.#glDotHint))
        {
            this._disposeDots();
        }
    }

    /**
     * @param {string} str
     */
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
        if (!this.#wasInCurrentSubpatch) return this._setVisible();
        let doUpdateSize = false;

        if ((this.opUiAttribs.hasArea || this.displayType == this.DISPLAY_UI_AREA) && !this._resizableArea)
            this._resizableArea = new GlArea(this.#instancer, this);

        // extended title
        if (this.displayType != this.DISPLAY_COMMENT)
        {
            if (!this._titleExt &&
                (
                    this.opUiAttribs.hasOwnProperty("extendTitle") ||
                    this.opUiAttribs.hasOwnProperty("extendTitlePort")))
            {
                this._titleExt = new GlText(this.#textWriter, " ");
                this._titleExt.setParentRect(this.#glRectBg);
                this._titleExt.setColorArray(gui.theme.colors_patch.opTitleExt);

                this._titleExt.visible = this.visible;
            }
            if (this._titleExt &&
                (!this.opUiAttribs.hasOwnProperty("extendTitle") || !this.opUiAttribs.extendTitle) &&
                (!this.opUiAttribs.hasOwnProperty("extendTitlePort") || !this.opUiAttribs.extendTitlePort))
            {
                this._titleExt.dispose();
                this._titleExt = null;
            }
        }

        if (!this.opUiAttribs.resizable && this._rectResize)
        {
            this._rectResize.dispose();
            this._rectResize = null;

            this.#op.setUiAttribs({
                "height": 1,
                "width": 0
            });
            this.updateSize();
        }

        if (this.opUiAttribs.hasArea && this._glRectArea)
        {
            this._glRectArea = this.#instancer.createRect({ "name": "area", "parent": this.#glRectBg, "interactive": false });
            this._glRectArea.setColor(0, 0, 0, 0.15);
        }

        if (this.opUiAttribs.resizable && !this._rectResize)
        {
            this._rectResize = this.#instancer.createRect({ "name": "op resize", "parent": this.#glRectBg, "draggable": true, "interactive": true });
            this._rectResize.setShape(GlRect.SHAPE_TRIANGLE_BOTTOM);

            if (this.opUiAttribs.hasOwnProperty("resizableX")) this._rectResize.draggableX = this.opUiAttribs.resizableX;
            if (this.opUiAttribs.hasOwnProperty("resizableY")) this._rectResize.draggableY = this.opUiAttribs.resizableY;

            this._rectResize.setSize(gluiconfig.rectResizeSize, gluiconfig.rectResizeSize);
            this._rectResize.setPosition((this.opUiAttribs.width || 0) - this._rectResize.w, (this.opUiAttribs.height || 0) - this._rectResize.h);
            this._rectResize.setColor(0.24, 0.24, 0.24, 1);

            this._rectResize.draggable = true;
            this._rectResize.draggableMove = true;
            this._rectResize.interactive = true;

            doUpdateSize = true;

            this._rectResize.on("drag", (_e) =>
            {
                if (this._rectResize)
                {
                    let w = this._rectResize.x - this.x;
                    let h = this._rectResize.y - this.y;

                    w = Math.max(this.minWidth, w);

                    w = this.glPatch.snap.snapX(w);
                    h = this.glPatch.snap.snapY(h);

                    for (let i = 0; i < this.#glPorts.length; i++)
                        this.#glPorts[i].updateSize();

                    if (this.#op) this.#op.setUiAttrib({ "height": h, "width": w });
                    this.updateSize();
                }
            });
        }

        const comment = this.opUiAttribs.commentOverwrite || this.opUiAttribs.comment || this.opUiAttribs.comment_text;

        if (comment)
        {
            if (!this._glComment)
            {
                this._glComment = new GlText(this.#textWriter, comment);
                this._glComment.setParentRect(this.#glRectBg);
                this._glComment.setColorArray(gui.theme.colors_patch.patchComment);
            }

            if (comment != this._glComment.text) this._glComment.text = comment;
            this._glComment.visible = this.visible;
        }
        else if (this._glComment) this._glComment = this._glComment.dispose();

        if (this.opUiAttribs.hasOwnProperty("comment_title")) this.setTitle(this.opUiAttribs.comment_title);
        else if (this.opUiAttribs.title != this.#glTitle.text) this.setTitle(this.opUiAttribs.title);

        if (this._titleExt)
        {
            if (this.opUiAttribs.hasOwnProperty("extendTitlePort") && this.opUiAttribs.extendTitlePort)
            {
                const thePort = this.#op.getPort(this.opUiAttribs.extendTitlePort);
                if (thePort)
                {
                    let portVar = thePort.get();
                    if (portVar)
                    {
                        if (thePort.type == Port.TYPE_NUMBER && portVar.toPrecision)portVar = portVar.toPrecision(5);
                        const str = this._shortenExtTitle(" " + thePort.getTitle() + ": " + portVar);

                        if (str != this._titleExt.text)
                        {
                            this._titleExt.text = str;
                            doUpdateSize = true;
                        }
                    }
                }
            }
            else
            if (this.opUiAttribs.hasOwnProperty("extendTitle") && this.opUiAttribs.extendTitle != this._titleExt.text)
            {
                const str = this._shortenExtTitle(" " + this.opUiAttribs.extendTitle || "!?");

                if (this._titleExt.textOrig != str)
                {
                    this._titleExt.textOrig = str;

                    let shortenStr = str;
                    if (shortenStr.length > 30)shortenStr = str.substring(0, 30) + "...";
                    this._titleExt.text = shortenStr;
                    doUpdateSize = true;
                }
            }
        }

        if (this.opUiAttribs.glPreviewTexture)
        {
            console.log("glprevtex");
            //     if (!this._glRectContent)
            //     {
            //         this._glRectContent = this._instancer.createRect({ "name": "rectcontent", "interactive": false });
            //         this._glRectContent.setParent(this._glRectBg);
            //         this._glRectContent.setPosition(0, this._height);
            //         this._glRectContent.setColor(255, 0, 220, 1);

            //         const p = this._op.getPort("Texture");
            //         this._visPort = p;

            //         this._visPort.onChange = () =>
            //         {
            //             const t = this._visPort.get();

            //         if (t)
            //         {
            //             const asp = this._width / t.width * 2.5;
            //             this._glRectContent.setSize(t.width * asp, t.height * asp);
            //             this._glRectContent.setTexture(this._visPort.get());
            //         }
            //     };
            // }
        }

        if (doUpdateSize) this.updateSize();
        this.updatePosition();
        this._updateColors();
        this._updateIndicators();

        if (this.displayType == this.DISPLAY_REROUTE_DOT)
        {
            if (!this._glRerouteDot)
                this._glRerouteDot = this.#instancer.createRect({ "name": "reroutedog", "draggable": false, "interactive": false });

            this.#glTitle.text = "";
            this._glRerouteDot.setSize(this._width, this._height);

            this._glRerouteDot.setPosition(-0.5, 0, 0);
            this._glRerouteDot.setParent(this.#glRectBg);

            this._glRerouteDot.setColorArray(GlPort.getInactiveColor(this.#glPorts[0].port.type));
            this._glRerouteDot.setShape(GlRect.SHAPE_FILLED_CIRCLE);

            this.#glRectBg.setColor(0, 0, 0, 0);
            // this._glRectBg.setSize(0.0);
        }

        for (const i in this._links) if (this._links[i]) this._links[i].update();
        this.#glPatch.needsRedraw = true;
    }

    /*
     * _updateSizeRightHandle()
     * {
     *     if (!this._glRectRightHandle) return;
     *     this._glRectRightHandle.setPosition(this.w, 0);
     *     this._glRectRightHandle.setSize(5, this.h);
     * }
     */

    _updateColors()
    {
        if (!this.#glRectBg || !this.#glTitle) return;

        if (this.opUiAttribs.hasOwnProperty("heatmapIntensity"))
        {
            if (this.opUiAttribs.heatmapIntensity) this.#glRectBg.setColor(
                0.1 + (this.opUiAttribs.heatmapIntensity), 0.1, 0.3 - (0.3 * this.opUiAttribs.heatmapIntensity), 1);
            else this.#glRectBg.setColor(0, 0, 0, 1);

            this.#glTitle.setColor(1, 1, 1, 1);
            return;

        }

        if (this.opUiAttribs.comment_title)
        {
            if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color)
            {

                this.#glTitle.setColorArray(chroma.hex(this.opUiAttribs.color).gl());
                this.updateSize();
            }
            else // this._glTitle.setColor(1, 1, 1);
                this.#glTitle.setColorArray(gui.theme.colors_patch.patchComment);
        }
        else
        {
            if (this._OpNameSpaceColor)
                this.#glTitle.setColor(this._OpNameSpaceColor[0], this._OpNameSpaceColor[1], this._OpNameSpaceColor[2]);
            else this.#glTitle.setColor(0.8, 0.8, 0.8);
        }

        this.#glRectBg.setBorder(this._rectBorder);

        if (this.opUiAttribs.selected)
        {
            this.#glRectBg.setSelected(true);

            if (gui.theme.colors_patch.opBgRectSelected) this.#glRectBg.setColorArray(gui.theme.colors_patch.opBgRectSelected);
        }
        else
        {
            this.#glRectBg.setSelected(false);

            if (this._transparent)
            {
                this.#glRectBg.setColorArray(gui.theme.colors_patch.transparent);
            }
            else
            {
                // console.log("${}", this.glPatch.viewBox.zoom);
                this.#glRectBg.setColorArray(gui.theme.colors_patch.opBgRect);
                if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color)
                {
                    // if (this.glPatch.viewBox.zoom > 1000)
                    // {

                    //     this._glRectBg.setColorArray(chroma.hex(this.opUiAttribs.color).gl());
                    // }
                    // else
                    //     // this._glRectBg.setColorArray(chroma.hex(this.opUiAttribs.color).darken(3.3).gl());

                    //     /*
                    //      * if (!this._glRectRightHandle && this.displayType != this.DISPLAY_UI_AREA)
                    //      * {
                    //      *     this._glRectRightHandle = this._instancer.createRect();
                    //      *     this._glRectRightHandle.setParent(this._glRectBg);
                    //      *     this._updateSizeRightHandle();
                    //      * }
                    //      */

                //     // if (this._glRectRightHandle) this._glRectRightHandle.setColor(chroma.hex(this.opUiAttribs.color).gl());
                }
                else
                {

                /*
                     * if (this._glRectRightHandle && this.opUiAttribs.color == null)
                     * {
                     *     this._glRectRightHandle.dispose();
                     *     this._glRectRightHandle = null;
                     * }
                     */
                }
            }
        }
        if (this.opUiAttribs.hasOwnProperty("color") && this.opUiAttribs.color)
        {
            // this._glRectBg.setColorArray(chroma.hex(this.opUiAttribs.color).darken(3.3).gl());
            if (!this._glColorIndicator)
            {

                this._glColorIndicator = this.#instancer.createRect({ "name": "colorindicator", "interactive": false, "parent": this.#glRectBg });
                this._glColorIndicator.setParent(this.#glRectBg);

                this._glColorIndicatorSpacing = this.#instancer.createRect({ "name": "cispacing", "interactive": false, "parent": this.#glRectBg });
                this._glColorIndicatorSpacing.setParent(this.#glRectBg);
                this._glColorIndicatorSpacing.setPosition(-GlOp.COLORINDICATOR_SPACING, 0);
                this._glColorIndicatorSpacing.setSize(GlOp.COLORINDICATOR_SPACING, this._height);
            }
            this._glColorIndicator.setColorArray(chroma.hex(this.opUiAttribs.color).gl());
        }

        if (this.displayType === this.DISPLAY_UI_AREA && !this.selected)
        {
            this.#glRectBg.setColor(0, 0, 0, 0.15);
        }
        else
        if (!this.#op.enabled)
        {
            this.#glRectBg.setOpacity(0.15, false);
            this.#glTitle.setOpacity(0.5);
        }
        else
        {
            this.#glRectBg.setOpacity(0.9, false);
            this.#glTitle.setOpacity(1);
        }

        if (this.#glNotWorkingCross)
        {
            this.#glTitle.setOpacity(0.7);
        }

        if (this._hideBgRect && !this.selected)
        {
            this.#glRectBg.setOpacity(0.0, true);
        }

        if (this._hidePorts) for (let i = 0; i < this.#glPorts.length; i++) this.#glPorts[i].rect.setOpacity(0);
        // if (this._resizableArea) this._resizableArea._updateColor();

        if (this._glColorIndicatorSpacing)
        {
            let col = this.#glRectBg.color;
            this._glColorIndicatorSpacing.setColorArray(col);
        }
    }

    get selected() { return this.opUiAttribs.selected; }

    set selected(s)
    {
        if (!this.#op) return;
        if (this.selected != s || s != this.opUiAttribs.selected)
        {
            if (s != this.opUiAttribs.selected)
            {
                this.#op.setUiAttribs({ "selected": s });

                for (const i in this._links) this._links[i].updateColor();

                this.#glPatch._updateNumberOfSelectedOps();
                this.#glPatch.selectOpId(this.#id);
            }

            this.updatePosition();
            this._updateSelectedRect();
        }
    }

    /**
     * @param {string} id
     */
    getPortPos(id, center = true)
    {
        if (!this.#op) return;
        this._setPortIndexAttribs(this.#op.portsIn);

        if (this.displayType == this.DISPLAY_REROUTE_DOT)
        {

            /*
             * this._setPortIndexAttribs(this._op.portsIn);
             * return this.w / 2;
             */
        }

        return this.#op.getPortPosX(id, null, center, this.w);
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
                (function (scope, newX, newY, oldX, oldY)
                {
                    undo.add({
                        "title": "Move op",
                        undo()
                        {
                            try
                            {
                                scope.#glPatch.patchAPI.setOpUiAttribs(scope.#id, "translate", { "x": newX, "y": newY });
                            }
                            catch (e) {}
                        },
                        redo()
                        {
                            scope.#glPatch.patchAPI.setOpUiAttribs(scope.#id, "translate", { "x": oldX, "y": oldY });
                        }
                    });
                }(this, this._passiveDragStartX, this._passiveDragStartY, this.x, this.y));

                gui.savedState.setUnSaved("opDrag", this.op.getSubPatch());
            }

        this._passiveDragStartX = null;
        this._passiveDragStartY = null;
    }

    startPassiveDrag()
    {
        this._passiveDragStartX = this.x;
        this._passiveDragStartY = this.y;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPassiveDragOffset(x, y)
    {
        if (!this._passiveDragStartX) this.startPassiveDrag();

        x = this._passiveDragStartX + x;
        y = this._passiveDragStartY + y;

        x = this.#glPatch.snap.snapOpX(x, this.#op);
        y = this.#glPatch.snap.snapY(y, this.#glPatch._pressedCtrlKey);

        this.#glPatch.patchAPI.setOpUiAttribs(this.#id, "translate", { "x": x, "y": y });
        this.emitEvent("drag");
        this.updatePosition();
    }

    /**
     * @param {string} name
     */
    getGlPort(name)
    {
        for (let i = 0; i < this.#glPorts.length; i++)
            if (this.#glPorts[i].name == name)
                return this.#glPorts[i];
    }

    /**
     * @param {string} opid
     * @param {string} portname
     */
    getGlPortsLinkedToPort(opid, portname)
    {
        const ports = [];

        for (const i in this._links)
        {
            if (this._links[i].nameInput == portname && this._links[i].opIdInput == opid)
            {
                const op = this.#glPatch.getOp(this._links[i].opIdOutput);
                ports.push(op.getGlPort(this._links[i].nameOutput));
            }
            if (this._links[i].nameOutput == portname && this._links[i].opIdOutput == opid)
            {
                const op = this.#glPatch.getOp(this._links[i].opIdInput);
                if (op)ports.push(op.getGlPort(this._links[i].nameInput));
            }
        }

        return ports;
    }

    updateTheme()
    {
        this._OpNameSpaceColor = GlPatch.getOpNamespaceColor(this.#op.objName);
        this._updateColors();

        for (const i in this._links) this._links[i].updateTheme();

        this.update();
        this.updateSize();
        this._updateIndicators();

        if (this._titleExt) this._titleExt.setColor(gui.theme.colors_patch.opTitleExt);
        if (this._glRectSelected) this._glRectSelected.setColorArray(gui.theme.colors_patch.selected);

        if (this.#glDotHint) this.#glDotHint.setColorArray(gui.theme.colors_patch.opErrorHint);
        if (this.#glDotWarning) this.#glDotWarning.setColorArray(gui.theme.colors_patch.opErrorWarning);
        if (this.#glDotError) this.#glDotError.setColorArray(gui.theme.colors_patch.opError);
        if (this.#glNotWorkingCross) this.#glNotWorkingCross.setColorArray(gui.theme.colors_patch.opNotWorkingCross);

        if (this.#glDotHint) this.#glDotHint.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
        if (this.#glDotWarning) this.#glDotWarning.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
        if (this.#glDotError) this.#glDotError.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
        if (this.#glLoadingIndicator) this.#glLoadingIndicator.setSize(gui.theme.patch.opStateIndicatorSize, gui.theme.patch.opStateIndicatorSize);
    }

    updateVizFlowMode()
    {
        for (let i = 0; i < this.#glPorts.length; i++)
            this.#glPorts[i]._updateColor();

        for (let i in this._links)
            this._links[i].setFlowModeActivity(0, 0);
    }
}
