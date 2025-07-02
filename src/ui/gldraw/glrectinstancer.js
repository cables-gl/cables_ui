import { Logger, Events } from "cables-shared-client";
import { Geometry, Mesh, Shader, Texture, Uniform } from "cables-corelibs";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import GlRect from "./glrect.js";
import srcShaderGlRectInstancerFrag from "./glrectinstancer_glsl.frag";
import srcShaderGlRectInstancerVert from "./glrectinstancer_glsl.vert";
import { gui } from "../gui.js";
import UserSettings, { userSettings } from "../components/usersettings.js";
import GlUiCanvas from "../glpatch/gluicanvas.js";

/**
 * @typedef {Object} GlRectInstancerOptions
 * @property {String} [name]
 * @property {Number} [initNum]
 * @property {boolean} [allowDragging]
 * @property {boolean} [hoverWhenButton]
 */

/**
 * draw many rectangles quickly using GPU instancing (e.g. patchfield: ops,ports,text)
 *
 * @export
 * @class GlRectInstancer
 * @extends {Events}
 */
export default class GlRectInstancer extends Events
{

    static SHAPE_CIRCLE = 1.0;
    static SHAPE_TRIANGLEBOTTOM = 2.0;
    static SHAPE_FRAME = 4.0;
    static SHAPE_CURSOR = 5.0;
    static SHAPE_FILLED_CIRCLE = 6.0;
    static SHAPE_CROSS = 7.0;
    static SHAPE_LOADING_INDICATOR = 8.0;
    static SHAPE_HALF_BLOCK_TOP = 9.0;
    static SHAPE_HALF_BLOCK_BOTTOM = 10.0;
    static SHAPE_ARROW_DOWN = 11.0;
    static SHAPE_PLUS = 12.0;
    static SHAPE_RHOMB = 13.0;

    #counter = 0;
    #num = 0;
    #name = "";
    #needsRebuild = true;
    #needsRebuildReason = "";
    #cgl;
    #interactive = true;
    #needsTextureUpdate = false;
    #reUploadAttribs = true;
    allowDragging = false;
    doBulkUploads = true;
    #updateRangesMin = {};
    #updateRangesMax = {};
    #bounds = null;

    /** @type {Array<GlRect>} */
    #rects = [];

    /** @type {Array<Object>} */
    #textures = [];

    /** @type {GlRect[]} */
    #draggingRects = [];

    /** @type {Shader} */
    #shader = null;

    /** @type {Geometry} */
    #geom = null;

    /** @type {Mesh} */
    #mesh = null;

    #meshAttrPos = null;
    #meshAttrCol = null;
    #meshAttrSize = null;
    #meshAttrDeco = null;
    #meshAttrTexRect = null;
    #meshAttrTex = null;

    static DEFAULT_BIGNUM = 999999;
    static ATTR_TEXRECT = "texRect";
    static ATTR_CONTENT_TEX = "contentTexture";
    static ATTR_POS = "instPos";
    static ATTR_COLOR = "instCol";
    static ATTR_SIZE = "instSize";
    static ATTR_DECO = "instDeco";

    mouseDownCount = 0;
    hoverWhenButton = false;

    /**
     * Description
     * @param {CglContext} cgl
     * @param {GlRectInstancerOptions} options
     */
    constructor(cgl, options)
    {
        super();
        options = options || {};
        this._log = new Logger("glrectinstancer");

        if (!cgl)
        {
            this._log.warn("[RectInstancer] no cgl");
            throw new Error("[RectInstancer] no cgl");
        }

        this.#cgl = cgl;
        this.#name = options.name || "unknown";
        this.#num = options.initNum || 5000;
        this.hoverWhenButton = !!options.hoverWhenButton;

        this.#bounds = { "minX": GlRectInstancer.DEFAULT_BIGNUM, "maxX": -GlRectInstancer.DEFAULT_BIGNUM, "minY": GlRectInstancer.DEFAULT_BIGNUM, "maxY": -GlRectInstancer.DEFAULT_BIGNUM, "minZ": GlRectInstancer.DEFAULT_BIGNUM, "maxZ": -GlRectInstancer.DEFAULT_BIGNUM };

        this._setupAttribBuffers();

        this.#shader = new Shader(cgl, "rectinstancer " + this.#name);
        this.#shader.setSource(srcShaderGlRectInstancerVert, srcShaderGlRectInstancerFrag);
        this.#shader.ignoreMissingUniforms = true;

        this._uniTime = new Uniform(this.#shader, "f", "time", 0);
        this._uniZoom = new Uniform(this.#shader, "f", "zoom", 0);
        this._uniResX = new Uniform(this.#shader, "f", "resX", 0);
        this._uniResY = new Uniform(this.#shader, "f", "resY", 0);
        this._uniscrollX = new Uniform(this.#shader, "f", "scrollX", 0);
        this._uniscrollY = new Uniform(this.#shader, "f", "scrollY", 0);
        this._unimsdfUnit = new Uniform(this.#shader, "f", "msdfUnit", 8 / 1024);
        this._uniTexture = new Uniform(this.#shader, "t", "tex", 0);

        this.#geom = new Geometry("rectinstancer " + this.#name);
        this.#geom.vertices = new Float32Array([1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0]);
        this.#geom.verticesIndices = new Uint16Array([2, 1, 0, 3, 1, 2]);
        this.#geom.texCoords = new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]);

        if (this.#cgl.glVersion == 1) this.#shader.enableExtension("GL_OES_standard_derivatives");
        this.#mesh = new Mesh(cgl, this.#geom);
        this.#mesh.numInstances = this.#num;

        this.clear();
        this.debugColors = userSettings.get(UserSettings.SETTING_GLUI_DEBUG_COLORS);
    }

    set interactive(i) { this.#interactive = i; }

    get interactive() { return this.#interactive; }

    dispose()
    {
        if (this.disposed) return;
        this.disposed = true;

        this.#shader.dispose();
        this.#mesh.dispose();
        return null;
    }

    get bounds()
    {
        if (this._needsBoundsRecalc)
        {
            const perf = gui.uiProfiler.start("[glRectInstancer] recalcBounds");

            const defaultMin = GlRectInstancer.DEFAULT_BIGNUM;
            const defaultMax = -GlRectInstancer.DEFAULT_BIGNUM;
            this._newBounds = { "minX": defaultMin, "maxX": defaultMax, "minY": defaultMin, "maxY": defaultMax, "minZ": defaultMin, "maxZ": defaultMax };
            for (let i = 0; i < this.#rects.length; i++)
            {
                if (!this.#rects[i]) return;
                if (!this.#rects[i].visible) continue;
                if (this.#rects[i].x == this.#bounds.minX && this.#rects[i].y == this.#bounds.minY && this.#rects[i].w == this.#bounds.maxX - this.#bounds.minX && this.#rects[i].h == this.#bounds.maxY - this.#bounds.minY) continue;

                const x = this.#rects[i].x || 0;
                const y = this.#rects[i].y || 0;
                const z = this.#rects[i].z || 0;
                const x2 = x + this.#rects[i].w;
                const y2 = y + this.#rects[i].h;

                this._newBounds.minX = Math.min(x, this._newBounds.minX);
                this._newBounds.maxX = Math.max(x2, this._newBounds.maxX);
                this._newBounds.minY = Math.min(y, this._newBounds.minY);
                this._newBounds.maxY = Math.max(y2, this._newBounds.maxY);

                this._newBounds.minZ = Math.min(z, this._newBounds.minZ);
                this._newBounds.maxZ = Math.max(z, this._newBounds.maxZ);
            }

            this._newBounds.changed = (this._newBounds.minX != defaultMin || this._newBounds.minY != defaultMin);
            this._needsBoundsRecalc = false;
            perf.finish();
        }

        this.#bounds = this._newBounds;
        return this.#bounds;
    }

    getDebug()
    {
        return {
            "num": this.#num,
            "len_attrBuffSizes": this._attrBuffSizes.length,
            "len_attrBuffPos": this._attrBuffPos.length,
            "len_attrBuffCol": this._attrBuffCol.length,
            "len_attrBuffDeco": this._attrBuffDeco.length
        };
    }

    clear()
    {
        for (let i = 0; i < 2 * this.#num; i++) this._attrBuffSizes[i] = 0;
        for (let i = 0; i < 3 * this.#num; i++) this._attrBuffPos[i] = 0;
        for (let i = 0; i < 4 * this.#num; i++) this._attrBuffCol[i] = 1;
        for (let i = 0; i < 4 * this.#num; i++) this._attrBuffDeco[i] = 0;
        for (let i = 0; i < this.#num; i++) this._attrBuffTextures[i] = -1;

        for (let i = 0; i < 4 * this.#num; i += 4)
        {
            this._attrBuffTexRect[i + 0] = this._attrBuffTexRect[i + 1] = 0;
            this._attrBuffTexRect[i + 2] = this._attrBuffTexRect[i + 3] = 1;
        }
    }

    _setupAttribBuffers()
    {
        const oldAttrPositions = this._attrBuffPos;
        const oldAttrTextures = this._attrBuffTextures;
        const oldAttrColors = this._attrBuffCol;
        const oldAttrSizes = this._attrBuffSizes;
        const oldAttrDeco = this._attrBuffDeco;
        const oldAttrTexRect = this._attrBuffTexRect;

        this._attrBuffPos = new Float32Array(3 * this.#num);
        this._attrBuffTextures = new Float32Array(this.#num);
        this._attrBuffCol = new Float32Array(4 * this.#num);
        this._attrBuffSizes = new Float32Array(2 * this.#num);
        this._attrBuffDeco = new Float32Array(4 * this.#num);
        this._attrBuffTexRect = new Float32Array(4 * this.#num);
        this.clear();

        if (oldAttrPositions) this._attrBuffPos.set(oldAttrPositions);
        if (oldAttrTextures) this._attrBuffTextures.set(oldAttrTextures);
        if (oldAttrColors) this._attrBuffCol.set(oldAttrColors);
        if (oldAttrSizes) this._attrBuffSizes.set(oldAttrSizes);
        if (oldAttrDeco) this._attrBuffDeco.set(oldAttrDeco);
        if (oldAttrTexRect) this._attrBuffTexRect.set(oldAttrTexRect);
    }

    isDragging()
    {
        return this.#draggingRects.length > 0;
    }

    _setupTextures()
    {
        this.#needsTextureUpdate = false;
        this.#textures.length = 0;
        let count = 0;

        let minIdx = GlRectInstancer.DEFAULT_BIGNUM;
        let maxIdx = -GlRectInstancer.DEFAULT_BIGNUM;

        for (let i = 0; i < this.#rects.length; i++)
        {
            let changed = false;
            const thatRectIdx = this.#rects[i].idx;

            if (this.#rects[i].texture)
            {
                let found = false;

                for (let j = 0; j < this.#textures.length; j++)
                {
                    if (this.#textures[j] && this.#textures[j].texture == this.#rects[i].texture)
                    {
                        found = true;

                        if (this._attrBuffTextures[thatRectIdx] != this.#textures[j].num)changed = true;

                        this._attrBuffTextures[thatRectIdx] = this.#textures[j].num;
                        minIdx = Math.min(thatRectIdx, minIdx);
                        maxIdx = Math.max(thatRectIdx, maxIdx);
                    }
                }

                if (!found)
                {
                    this._attrBuffTextures[thatRectIdx] = count;
                    this.#textures[count] =
                        {
                            "texture": this.#rects[i].texture,
                            "num": count
                        };
                    count++;
                }
            }
            else
            {
                if (this._attrBuffTextures[thatRectIdx] != -1) changed = true;
                this._attrBuffTextures[thatRectIdx] = -1;
            }

            if (changed)
            {
                minIdx = Math.min(this.#rects[i].idx, minIdx);
                maxIdx = Math.max(this.#rects[i].idx, maxIdx);
            }
        }

        this.#mesh.setAttributeRange(this.#meshAttrTex, this._attrBuffCol, minIdx, maxIdx);
    }

    _bindTextures()
    {
        for (let i = 0; i < 4; i++)
            if (this.#textures[0])
                this.#cgl.setTexture(i, this.#textures[0].texture.tex);

        if (this.#textures[0]) this.#cgl.setTexture(0, this.#textures[0].texture.tex);
    }

    /**
     * @param {number} resX
     * @param {number} resY
     * @param {number} scrollX
     * @param {number} scrollY
     * @param {number} zoom
     */
    render(resX, resY, scrollX, scrollY, zoom)
    {
        // console.log(zoom);
        if (zoom > 500 && zoom < 800)
        {
        }
        // else gui.patchView._patchRenderer._textWriter._rectDrawer._unimsdfUnit.setValue(0);
        gui.patchView._patchRenderer._textWriter._rectDrawer._unimsdfUnit.setValue(8 / zoom);

        if (this.doBulkUploads)
        {
            if (this.#updateRangesMin[GlRectInstancer.ATTR_POS] != GlRectInstancer.DEFAULT_BIGNUM)
            {
                this.#mesh.setAttributeRange(this.#meshAttrPos, this._attrBuffPos, this.#updateRangesMin[GlRectInstancer.ATTR_POS], this.#updateRangesMax[GlRectInstancer.ATTR_POS]);
                this._resetAttrRange(GlRectInstancer.ATTR_POS);
            }

            if (this.#updateRangesMin[GlRectInstancer.ATTR_COLOR] != GlRectInstancer.DEFAULT_BIGNUM)
            {
                this.#mesh.setAttributeRange(this.#meshAttrCol, this._attrBuffCol, this.#updateRangesMin[GlRectInstancer.ATTR_COLOR], this.#updateRangesMax[GlRectInstancer.ATTR_COLOR]);
                this._resetAttrRange(GlRectInstancer.ATTR_COLOR);
            }

            if (this.#updateRangesMin[GlRectInstancer.ATTR_SIZE] != GlRectInstancer.DEFAULT_BIGNUM)
            {
                this.#mesh.setAttributeRange(this.#meshAttrSize, this._attrBuffSizes, this.#updateRangesMin[GlRectInstancer.ATTR_SIZE], this.#updateRangesMax[GlRectInstancer.ATTR_SIZE]);
                this._resetAttrRange(GlRectInstancer.ATTR_SIZE);
            }

            if (this.#updateRangesMin[GlRectInstancer.ATTR_DECO] != GlRectInstancer.DEFAULT_BIGNUM)
            {
                this.#mesh.setAttributeRange(this.#meshAttrDeco, this._attrBuffDeco, this.#updateRangesMin[GlRectInstancer.ATTR_DECO], this.#updateRangesMax[GlRectInstancer.ATTR_DECO]);
                this._resetAttrRange(GlRectInstancer.ATTR_DECO);
            }

            if (this.#updateRangesMin[GlRectInstancer.ATTR_TEXRECT] != GlRectInstancer.DEFAULT_BIGNUM)
            {
                this.#mesh.setAttributeRange(this.#meshAttrTexRect, this._attrBuffTexRect, this.#updateRangesMin[GlRectInstancer.ATTR_TEXRECT], this.#updateRangesMax[GlRectInstancer.ATTR_TEXRECT]);
                this._resetAttrRange(GlRectInstancer.ATTR_TEXRECT);
            }
        }

        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0 / zoom);

        this._uniTime.set(performance.now() / 1000);

        if (this.#needsTextureUpdate) this._setupTextures();
        this._bindTextures();

        if (this.#needsRebuild) this.rebuild();

        this.emitEvent("render");

        this.#mesh.render(this.#shader);
    }

    rebuild()
    {
        // this._log.log("rebuild!", this._name, this._attrBuffPos.length / 3, this._needsRebuildReason);
        this.#needsRebuildReason = "";
        // todo only update whats needed

        this.#mesh.numInstances = this.#num;

        if (this.#reUploadAttribs)
        {
            const perf = gui.uiProfiler.start("[glRectInstancer] _reUploadAttribs");
            this.#meshAttrPos = this.#mesh.setAttribute(GlRectInstancer.ATTR_POS, this._attrBuffPos, 3, { "instanced": true });
            this.#meshAttrCol = this.#mesh.setAttribute(GlRectInstancer.ATTR_COLOR, this._attrBuffCol, 4, { "instanced": true });
            this.#meshAttrSize = this.#mesh.setAttribute(GlRectInstancer.ATTR_SIZE, this._attrBuffSizes, 2, { "instanced": true });
            this.#meshAttrDeco = this.#mesh.setAttribute(GlRectInstancer.ATTR_DECO, this._attrBuffDeco, 4, { "instanced": true });
            this.#meshAttrTexRect = this.#mesh.setAttribute(GlRectInstancer.ATTR_TEXRECT, this._attrBuffTexRect, 4, { "instanced": true });
            this.#meshAttrTex = this.#mesh.setAttribute(GlRectInstancer.ATTR_CONTENT_TEX, this._attrBuffTextures, 1, { "instanced": true });
            this.#reUploadAttribs = false;
            perf.finish();
        }

        this.#needsRebuild = false;
    }

    getNumRects()
    {
        return this.#counter;
    }

    getIndex()
    {
        this.#counter++;
        if (this.#counter > this.#num - 100)
        {
            this.#num += Math.max(5000, Math.ceil(this.#num));
            this._setupAttribBuffers();
            this.#needsRebuild = true;
            this.#needsRebuildReason = "resize";
            this.#needsTextureUpdate = true;
            this.#reUploadAttribs = true;
        }
        return this.#counter;
    }

    /**
     * @param {number} a
     * @param {number} b
     */
    _float32Diff(a, b)
    {
        return Math.abs(a - b) > 0.0001;
    }

    /**
     * @param {number} idx
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(idx, x, y, z)
    {
        const buffIdx = idx * 3;
        if (this._float32Diff(this._attrBuffPos[buffIdx + 0], x) || this._float32Diff(this._attrBuffPos[buffIdx + 1], y) || this._float32Diff(this._attrBuffPos[buffIdx + 2], z))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "pos change";
        }
        else return;

        if (
            this._attrBuffPos[buffIdx + 0] >= this.#bounds.maxX || this._attrBuffPos[buffIdx + 0] <= this.#bounds.minX ||
            this._attrBuffPos[buffIdx + 1] >= this.#bounds.maxY || this._attrBuffPos[buffIdx + 1] <= this.#bounds.minY)
        {
            this._needsBoundsRecalc = true;
        }

        this._attrBuffPos[buffIdx + 0] = x;
        this._attrBuffPos[buffIdx + 1] = y;
        this._attrBuffPos[buffIdx + 2] = z / GlUiCanvas.ZPOSDIV;

        if (
            this._attrBuffPos[buffIdx + 0] >= this.#bounds.maxX || this._attrBuffPos[buffIdx + 0] <= this.#bounds.minX ||
            this._attrBuffPos[buffIdx + 1] >= this.#bounds.maxY || this._attrBuffPos[buffIdx + 1] <= this.#bounds.minY)
        {
            this._needsBoundsRecalc = true;
        }

        if (!this._needsBoundsRecalc)
        {
            this.#bounds.minX = Math.min(this._attrBuffPos[buffIdx + 0], this.#bounds.minX);
            this.#bounds.maxX = Math.max(this._attrBuffPos[buffIdx + 0], this.#bounds.maxX);

            this.#bounds.minY = Math.min(this._attrBuffPos[buffIdx + 1], this.#bounds.minY);
            this.#bounds.maxY = Math.max(this._attrBuffPos[buffIdx + 1], this.#bounds.maxY);

            this.#bounds.minZ = Math.min(this._attrBuffPos[buffIdx + 2], this.#bounds.minZ);
            this.#bounds.maxZ = Math.max(this._attrBuffPos[buffIdx + 2], this.#bounds.maxZ);
        }

        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_POS, buffIdx, buffIdx + 3);
        else this.#mesh.setAttributeRange(this.#meshAttrPos, this._attrBuffPos, buffIdx, buffIdx + 3);

        this._needsBoundsRecalc = true;
    }

    /**
     * @param {number} idx
     * @param {number} x
     * @param {number} y
     */
    setSize(idx, x, y)
    {
        if (this._float32Diff(this._attrBuffSizes[idx * 2 + 0], x) || this._float32Diff(this._attrBuffSizes[idx * 2 + 1], y))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "size change";
        }
        else return;

        this._attrBuffSizes[idx * 2 + 0] = x;
        this._attrBuffSizes[idx * 2 + 1] = y;

        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_SIZE, idx * 2, (idx + 1) * 2);
        else this.#mesh.setAttributeRange(this.#meshAttrSize, this._attrBuffSizes, idx * 2, (idx + 1) * 2);
    }

    /**
     * @param {number} idx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    setTexRect(idx, x, y, w, h)
    {
        if (
            this._float32Diff(this._attrBuffTexRect[idx * 4 + 0], x) ||
            this._float32Diff(this._attrBuffTexRect[idx * 4 + 1], y) ||
            this._float32Diff(this._attrBuffTexRect[idx * 4 + 2], w) ||
            this._float32Diff(this._attrBuffTexRect[idx * 4 + 3], h))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "texrect";
        }
        else return;

        this._attrBuffTexRect[idx * 4 + 0] = x;
        this._attrBuffTexRect[idx * 4 + 1] = y;
        this._attrBuffTexRect[idx * 4 + 2] = w;
        this._attrBuffTexRect[idx * 4 + 3] = h;

        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_TEXRECT, idx * 4, idx * 4 + 4);
        else this.#mesh.setAttributeRange(this.#meshAttrTexRect, this._attrBuffTexRect, idx * 4, idx * 4 + 4);
    }

    /**
     * @param {any} idx
     * @param {number[]} r
     */
    setColorArray(idx, r)
    {
        this.setColor(idx, r[0], r[1], r[2], r[3]);
    }

    /**
     * @param {number} idx
     * @param {number} r
     * @param {number} [g]
     * @param {number} [b]
     * @param {number} [a]
     */
    setColor(idx, r, g, b, a)
    {
        if (r.length)// todo remove after~jul25
        {
            console.warn("setcolor array");
            a = r[3];
            b = r[2];
            g = r[1];
            r = r[0];
        }
        if (
            this._float32Diff(this._attrBuffCol[idx * 4 + 0], r) ||
            this._float32Diff(this._attrBuffCol[idx * 4 + 1], g) ||
            this._float32Diff(this._attrBuffCol[idx * 4 + 2], b) ||
            this._float32Diff(this._attrBuffCol[idx * 4 + 3], a))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "setcolor";
            // this._setAttrRange(this._meshAttrCol, idx * 4, idx * 4 + 4);
        }
        else return;

        this._attrBuffCol[idx * 4 + 0] = r;
        this._attrBuffCol[idx * 4 + 1] = g;
        this._attrBuffCol[idx * 4 + 2] = b;
        this._attrBuffCol[idx * 4 + 3] = a;

        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_COLOR, idx * 4, idx * 4 + 4);
        else this.#mesh.setAttributeRange(this.#meshAttrCol, this._attrBuffCol, idx * 4, idx * 4 + 4);
    }

    /**
     * @param {number} idx
     * @param {number} o
     */
    setShape(idx, o)
    {
        this._attrBuffDeco[idx * 4 + 0] = o;
        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_DECO, idx * 4, idx * 4 + 4);
        else this.#mesh.setAttributeRange(this.#meshAttrDeco, this._attrBuffDeco, idx * 4, idx * 4 + 4);
    }

    /**
     * @param {number} idx
     * @param {number} o
     */
    setBorder(idx, o)
    {
        this._attrBuffDeco[idx * 4 + 1] = o;
        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_DECO, idx * 4, idx * 4 + 4);
        else this.#mesh.setAttributeRange(this.#meshAttrDeco, this._attrBuffDeco, idx * 4, idx * 4 + 4);
    }

    /**
     * @param {number} idx
     * @param {number} o
     */
    setSelected(idx, o)
    {
        this._attrBuffDeco[idx * 4 + 2] = o;

        if (this.doBulkUploads) this._setAttrRange(GlRectInstancer.ATTR_DECO, idx * 4, idx * 4 + 4);
        else this.#mesh.setAttributeRange(this.#meshAttrDeco, this._attrBuffDeco, idx * 4, idx * 4 + 4);
    }

    /**
     * @param {number} i
     */
    setDebugRenderer(i)
    {
        this.#shader.toggleDefine("DEBUG_1", i == 1);
        this.#shader.toggleDefine("DEBUG_2", i == 2);
    }

    /**
     * @param {Texture} tex
     * @param {boolean} sdf
     */
    setAllTexture(tex, sdf)
    {
        this.#shader.toggleDefine("SDF_TEXTURE", sdf);

        for (let i = 0; i < this.#rects.length; i++)
            this.#rects[i].setTexture(tex);
    }

    /**
     * @param {string} attr
     */
    _resetAttrRange(attr)
    {
        this.#updateRangesMin[attr] = GlRectInstancer.DEFAULT_BIGNUM;
        this.#updateRangesMax[attr] = -GlRectInstancer.DEFAULT_BIGNUM;
    }

    /**
     * @param {string} attr index
     * @param {number} start
     * @param {number} end
     */
    _setAttrRange(attr, start, end)
    {
        this.#updateRangesMin[attr] = Math.min(start, this.#updateRangesMin[attr]);
        this.#updateRangesMax[attr] = Math.max(end, this.#updateRangesMax[attr]);
    }

    /**
     * @param {import("./glrect.js").GlRectOptions} [options]
     */
    createRect(options)
    {
        options = options || {};
        const r = new GlRect(this, options);
        this.#rects.push(r);

        if (options[GlRect.OPTION_DRAGGABLE])
        {
            this.allowDragging = options[GlRect.OPTION_DRAGGABLE];
            r.on(GlRect.EVENT_DRAGSTART, (rect) =>
            {
                if (this.allowDragging && !this.#draggingRects.includes(rect))
                {
                    this.#draggingRects.push(rect);
                }

            });

            // r.on(GlRect.EVENT_DRAGEND, () => {});
        }

        r.on("textureChanged", () => { this.#needsTextureUpdate = true; });

        return r;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} button
     * @param {MouseEvent} event
     */
    mouseMove(x, y, button, event)
    {
        const perf = gui.uiProfiler.start("[glrectinstancer] mousemove");
        if (!this.#interactive) return;
        if (this.allowDragging && this.#draggingRects.length > 0 && button)
        {
            for (let i = 0; i < this.#draggingRects.length; i++)
            {
                this.#draggingRects[i].mouseDrag(x, y, button, event);
            }

            return;
        }

        for (let i = 0; i < this.#rects.length; i++)
            if (!this.#rects[i].parent)
                this.#rects[i].mouseMove(x, y, button, event);

        perf.finish();
    }

    /**
     * @param {MouseEvent} e
     * @param {number} [x]
     * @param {number} [y]
     */
    mouseDown(e, x = 0, y = 0)
    {
        if (!this.#interactive) return;
        this.mouseDownCount++;

        const perf = gui.uiProfiler.start("[glrectinstancer] mouseDown");
        for (let i = 0; i < this.#rects.length; i++)
            if (!this.#rects[i].parent)
                this.#rects[i].mouseDown(e, x, y);

        perf.finish();
    }

    /**
     * @param {MouseEvent} e
     */
    mouseUp(e)
    {
        if (this.mouseDownCount == 0)console.log("mouse was not down? ");
        if (!this.#interactive) return;
        const perf = gui.uiProfiler.start("[glrectinstancer] mouseup");

        for (let i = 0; i < this.#draggingRects.length; i++) this.#draggingRects[i].mouseDragEnd(e);
        for (let i = 0; i < this.#rects.length; i++) this.#rects[i].mouseUp(e);
        perf.finish();

        this.#draggingRects = [];
    }

    /**
     * @param {string} idx
     */
    removeRect(idx)
    {

        for (let i = 0; i < this.#rects.length; i++)
            if (this.#rects[i] && this.#rects[i].idx == idx)
            {
                this.#rects.splice(i, 1);
            }

    }
}
