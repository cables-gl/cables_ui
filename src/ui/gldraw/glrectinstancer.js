import GlRect from "./glrect";
import Logger from "../utils/logger";
import srcShaderGlRectInstancerFrag from "./glrectinstancer_glsl.frag";
import srcShaderGlRectInstancerVert from "./glrectinstancer_glsl.vert";

export default class GlRectInstancer extends CABLES.EventTarget
{
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

        this._name = options.name || "unknown";

        this._debugRenderStyle = 0;
        this.doBulkUploads = true;

        this._DEFAULT_BIGNUM = 999999;

        this._counter = 0;
        this._num = options.initNum || 5000;
        this._needsRebuild = true;
        this._needsRebuildReason = "";
        this._rects = [];
        this._textures = [];
        this._interactive = true;
        this.allowDragging = false;
        this._cgl = cgl;
        this._needsTextureUpdate = false;
        this._draggingRect = null;
        this._reUploadAttribs = true;
        this._updateRangesMin = {};
        this._updateRangesMax = {};
        this._bounds = { "minX": this._DEFAULT_BIGNUM, "maxX": -this._DEFAULT_BIGNUM, "minY": this._DEFAULT_BIGNUM, "maxY": -this._DEFAULT_MBIGNUM9, "minZ": this._DEFAULT_BIGNUM, "maxZ": -this._DEFAULT_BIGNUM };

        this._meshAttrPos = null;
        this._meshAttrCol = null;
        this._meshAttrSize = null;
        this._meshAttrDeco = null;
        this._meshAttrTexRect = null;
        this._meshAttrTex = null;


        this._setupAttribBuffers();

        this.ATTR_TEXRECT = "texRect";
        this.ATTR_CONTENT_TEX = "contentTexture";
        this.ATTR_POS = "instPos";
        this.ATTR_COLOR = "instCol";
        this.ATTR_SIZE = "instSize";
        this.ATTR_DECO = "instDeco";


        this._shader = new CGL.Shader(cgl, "rectinstancer");
        this._shader.setSource(srcShaderGlRectInstancerVert, srcShaderGlRectInstancerFrag);

        this._uniTime = new CGL.Uniform(this._shader, "f", "time", 0);
        this._uniZoom = new CGL.Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new CGL.Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new CGL.Uniform(this._shader, "f", "resY", 0);
        this._uniscrollX = new CGL.Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new CGL.Uniform(this._shader, "f", "scrollY", 0);

        this._uniTexture = new CGL.Uniform(this._shader, "t", "tex", 0);

        this._geom = new CGL.Geometry("rectinstancer");
        this._geom.vertices = new Float32Array([1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0]);
        this._geom.verticesIndices = new Uint16Array([2, 1, 0, 3, 1, 2]);
        this._geom.texCoords = new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]);

        if (this._cgl.glVersion == 1) this._shader.enableExtension("GL_OES_standard_derivatives");
        this._mesh = new CGL.Mesh(cgl, this._geom);
        this._mesh.numInstances = this._num;

        this.clear();
    }

    set interactive(i) { this._interactive = i; }

    get interactive() { return this._interactive; }

    dispose()
    {
    }

    get bounds()
    {
        if (this._needsBoundsRecalc)
        {
            const perf = CABLES.UI.uiProfiler.start("[glRectInstancer] recalcBounds");

            const defaultMin = this._DEFAULT_BIGNUM;
            const defaultMax = -this._DEFAULT_BIGNUM;
            this._newBounds = { "minX": defaultMin, "maxX": defaultMax, "minY": defaultMin, "maxY": defaultMax, "minZ": defaultMin, "maxZ": defaultMax };

            for (let i = 0; i < this._rects.length; i++)
            {
                if (!this._rects[i].visible) continue;
                if (this._rects[i].x == this._bounds.minX && this._rects[i].y == this._bounds.minY && this._rects[i].w == this._bounds.maxX - this._bounds.minX && this._rects[i].h == this._bounds.maxY - this._bounds.minY) continue;

                const x = this._rects[i].x || 0;
                const y = this._rects[i].y || 0;
                const z = this._rects[i].z || 0;
                const x2 = x + this._rects[i].w;
                const y2 = y + this._rects[i].h;

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

        this._bounds = this._newBounds;
        return this._bounds;
    }

    getDebug()
    {
        return {
            "num": this._num,
            "len_attrBuffSizes": this._attrBuffSizes.length,
            "len_attrBuffPos": this._attrBuffPos.length,
            "len_attrBuffCol": this._attrBuffCol.length,
            "len_attrBuffDeco": this._attrBuffDeco.length
        };
    }

    clear()
    {
        for (let i = 0; i < 2 * this._num; i++) this._attrBuffSizes[i] = 0;// Math.random()*61;
        for (let i = 0; i < 3 * this._num; i++) this._attrBuffPos[i] = 0;// Math.random()*60;
        for (let i = 0; i < 4 * this._num; i++) this._attrBuffCol[i] = 1;// Math.random();
        for (let i = 0; i < 4 * this._num; i++) this._attrBuffDeco[i] = 0;// Math.random();
        for (let i = 0; i < this._num; i++) this._attrBuffTextures[i] = -1;// Math.random();

        for (let i = 0; i < 4 * this._num; i += 4)
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

        this._attrBuffPos = new Float32Array(3 * this._num);
        this._attrBuffTextures = new Float32Array(this._num);
        this._attrBuffCol = new Float32Array(4 * this._num);
        this._attrBuffSizes = new Float32Array(2 * this._num);
        this._attrBuffDeco = new Float32Array(4 * this._num);
        this._attrBuffTexRect = new Float32Array(4 * this._num);
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
        return this._draggingRect != null;
    }

    _setupTextures()
    {
        this._needsTextureUpdate = false;
        this._textures.length = 0;
        let count = 0;

        let minIdx = this._DEFAULT_BIGNUM;
        let maxIdx = -this._DEFAULT_BIGNUM;


        for (let i = 0; i < this._rects.length; i++)
        {
            let changed = false;
            const thatRectIdx = this._rects[i].idx;

            if (this._rects[i].texture)
            {
                let found = false;


                for (let j = 0; j < this._textures.length; j++)
                {
                    if (this._textures[j] && this._textures[j].texture == this._rects[i].texture)
                    {
                        found = true;

                        if (this._attrBuffTextures[thatRectIdx] != this._textures[j].num)changed = true;

                        this._attrBuffTextures[thatRectIdx] = this._textures[j].num;
                        minIdx = Math.min(thatRectIdx, minIdx);
                        maxIdx = Math.max(thatRectIdx, maxIdx);
                    }
                }

                if (!found)
                {
                    this._attrBuffTextures[thatRectIdx] = count;
                    this._textures[count] =
                        {
                            "texture": this._rects[i].texture,
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
                minIdx = Math.min(this._rects[i].idx, minIdx);
                maxIdx = Math.max(this._rects[i].idx, maxIdx);
            }
        }

        this._mesh.setAttributeRange(this._meshAttrTex, this._attrBuffCol, minIdx, maxIdx);
    }

    _bindTextures()
    {
        for (let i = 0; i < 4; i++)
            if (this._textures[0])
                this._cgl.setTexture(i, this._textures[0].texture.tex);

        if (this._textures[0]) this._cgl.setTexture(0, this._textures[0].texture.tex);
    }

    render(resX, resY, scrollX, scrollY, zoom)
    {
        if (this.doBulkUploads)
        {
            if (this._updateRangesMin[this.ATTR_POS] != this._DEFAULT_BIGNUM)
            {
                this._mesh.setAttributeRange(this._meshAttrPos, this._attrBuffPos, this._updateRangesMin[this.ATTR_POS], this._updateRangesMax[this.ATTR_POS]);
                this._resetAttrRange(this.ATTR_POS);
            }

            if (this._updateRangesMin[this.ATTR_COLOR] != this._DEFAULT_BIGNUM)
            {
                // console.log("update colors,", this._updateRangesMax[this.ATTR_COLOR] - this._updateRangesMin[this.ATTR_COLOR]);
                this._mesh.setAttributeRange(this._meshAttrCol, this._attrBuffCol, this._updateRangesMin[this.ATTR_COLOR], this._updateRangesMax[this.ATTR_COLOR]);
                this._resetAttrRange(this.ATTR_COLOR);
            }

            if (this._updateRangesMin[this.ATTR_SIZE] != this._DEFAULT_BIGNUM)
            {
                this._mesh.setAttributeRange(this._meshAttrSize, this._attrBuffSizes, this._updateRangesMin[this.ATTR_SIZE], this._updateRangesMax[this.ATTR_SIZE]);
                this._resetAttrRange(this.ATTR_SIZE);
            }

            if (this._updateRangesMin[this.ATTR_DECO] != this._DEFAULT_BIGNUM)
            {
                this._mesh.setAttributeRange(this._meshAttrDeco, this._attrBuffDeco, this._updateRangesMin[this.ATTR_DECO], this._updateRangesMax[this.ATTR_DECO]);
                this._resetAttrRange(this.ATTR_DECO);
            }

            if (this._updateRangesMin[this.ATTR_TEXRECT] != this._DEFAULT_BIGNUM)
            {
                this._mesh.setAttributeRange(this._meshAttrTexRect, this._attrBuffTexRect, this._updateRangesMin[this.ATTR_TEXRECT], this._updateRangesMax[this.ATTR_TEXRECT]);
                this._resetAttrRange(this.ATTR_TEXRECT);
            }
        }

        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0 / zoom);

        this._uniTime.set(performance.now() / 1000);

        if (this._needsTextureUpdate) this._setupTextures();
        this._bindTextures();

        if (this._needsRebuild) this.rebuild();

        this.emitEvent("render");

        this._mesh.render(this._shader);
    }

    rebuild()
    {
        // this._log.log("rebuild!", this._name, this._attrBuffPos.length / 3, this._needsRebuildReason);
        this._needsRebuildReason = "";
        // todo only update whats needed

        this._mesh.numInstances = this._num;

        if (this._reUploadAttribs)
        {
            const perf = CABLES.UI.uiProfiler.start("[glRectInstancer] _reUploadAttribs");
            this._meshAttrPos = this._mesh.setAttribute(this.ATTR_POS, this._attrBuffPos, 3, { "instanced": true });
            this._meshAttrCol = this._mesh.setAttribute(this.ATTR_COLOR, this._attrBuffCol, 4, { "instanced": true });
            this._meshAttrSize = this._mesh.setAttribute(this.ATTR_SIZE, this._attrBuffSizes, 2, { "instanced": true });
            this._meshAttrDeco = this._mesh.setAttribute(this.ATTR_DECO, this._attrBuffDeco, 4, { "instanced": true });
            this._meshAttrTexRect = this._mesh.setAttribute(this.ATTR_TEXRECT, this._attrBuffTexRect, 4, { "instanced": true });
            this._meshAttrTex = this._mesh.setAttribute(this.ATTR_CONTENT_TEX, this._attrBuffTextures, 1, { "instanced": true });
            this._reUploadAttribs = false;
            perf.finish();
        }

        this._needsRebuild = false;
    }

    getNumRects()
    {
        return this._counter;
    }

    getIndex()
    {
        this._counter++;
        if (this._counter > this._num - 100)
        {
            this._num += Math.max(5000, Math.ceil(this._num));
            this._log.log("rectinstancer " + this._name + " resize to", this._num);
            this._setupAttribBuffers();
            this._needsRebuild = true;
            this._needsRebuildReason = "resize";
            this._needsTextureUpdate = true;
            this._reUploadAttribs = true;
        }
        return this._counter;
    }

    _float32Diff(a, b)
    {
        return Math.abs(a - b) > 0.0001;
    }

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
            this._attrBuffPos[buffIdx + 0] >= this._bounds.maxX || this._attrBuffPos[buffIdx + 0] <= this._bounds.minX ||
            this._attrBuffPos[buffIdx + 1] >= this._bounds.maxY || this._attrBuffPos[buffIdx + 1] <= this._bounds.minY)
        {
            this._needsBoundsRecalc = true;
        }

        this._attrBuffPos[buffIdx + 0] = x;
        this._attrBuffPos[buffIdx + 1] = y;
        this._attrBuffPos[buffIdx + 2] = z;

        if (
            this._attrBuffPos[buffIdx + 0] >= this._bounds.maxX || this._attrBuffPos[buffIdx + 0] <= this._bounds.minX ||
            this._attrBuffPos[buffIdx + 1] >= this._bounds.maxY || this._attrBuffPos[buffIdx + 1] <= this._bounds.minY)
        {
            this._needsBoundsRecalc = true;
        }

        if (!this._needsBoundsRecalc)
        {
            this._bounds.minX = Math.min(this._attrBuffPos[buffIdx + 0], this._bounds.minX);
            this._bounds.maxX = Math.max(this._attrBuffPos[buffIdx + 0], this._bounds.maxX);

            this._bounds.minY = Math.min(this._attrBuffPos[buffIdx + 1], this._bounds.minY);
            this._bounds.maxY = Math.max(this._attrBuffPos[buffIdx + 1], this._bounds.maxY);

            this._bounds.minZ = Math.min(this._attrBuffPos[buffIdx + 2], this._bounds.minZ);
            this._bounds.maxZ = Math.max(this._attrBuffPos[buffIdx + 2], this._bounds.maxZ);
        }

        if (this.doBulkUploads) this._setAttrRange(this.ATTR_POS, buffIdx, buffIdx + 3);
        else this._mesh.setAttributeRange(this._meshAttrPos, this._attrBuffPos, buffIdx, buffIdx + 3);

        this._needsBoundsRecalc = true;
    }

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

        if (this.doBulkUploads) this._setAttrRange(this.ATTR_SIZE, idx * 2, (idx + 1) * 2);
        else this._mesh.setAttributeRange(this._meshAttrSize, this._attrBuffSizes, idx * 2, (idx + 1) * 2);
    }

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


        if (this.doBulkUploads) this._setAttrRange(this.ATTR_TEXRECT, idx * 4, idx * 4 + 4);
        else this._mesh.setAttributeRange(this._meshAttrTexRect, this._attrBuffTexRect, idx * 4, idx * 4 + 4);
    }

    setColor(idx, r, g, b, a)
    {
        if (r.length)
        {
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

        if (this.doBulkUploads) this._setAttrRange(this.ATTR_COLOR, idx * 4, idx * 4 + 4);
        else this._mesh.setAttributeRange(this._meshAttrCol, this._attrBuffCol, idx * 4, idx * 4 + 4);
    }

    setShape(idx, o)
    {
        this._attrBuffDeco[idx * 4 + 0] = o;
        if (this.doBulkUploads) this._setAttrRange(this.ATTR_DECO, idx * 4, idx * 4 + 4);
        else this._mesh.setAttributeRange(this._meshAttrDeco, this._attrBuffDeco, idx * 4, idx * 4 + 4);
    }

    setBorder(idx, o)
    {
        this._attrBuffDeco[idx * 4 + 1] = o;
        if (this.doBulkUploads) this._setAttrRange(this.ATTR_DECO, idx * 4, idx * 4 + 4);
        else this._mesh.setAttributeRange(this._meshAttrDeco, this._attrBuffDeco, idx * 4, idx * 4 + 4);
    }

    setSelected(idx, o)
    {
        this._attrBuffDeco[idx * 4 + 2] = o;

        if (this.doBulkUploads) this._setAttrRange(this.ATTR_DECO, idx * 4, idx * 4 + 4);
        else this._mesh.setAttributeRange(this._meshAttrDeco, this._attrBuffDeco, idx * 4, idx * 4 + 4);
    }

    setDebugRenderer(i)
    {
        this._shader.toggleDefine("DEBUG_1", i == 1);
        this._shader.toggleDefine("DEBUG_2", i == 2);
    }

    setAllTexture(tex, sdf)
    {
        this._shader.toggleDefine("SDF_TEXTURE", sdf);

        for (let i = 0; i < this._rects.length; i++)
            this._rects[i].setTexture(tex);
    }

    _resetAttrRange(attr)
    {
        this._updateRangesMin[attr] = this._DEFAULT_BIGNUM;
        this._updateRangesMax[attr] = -this._DEFAULT_BIGNUM;
    }

    _setAttrRange(attr, start, end)
    {
        this._updateRangesMin[attr] = Math.min(start, this._updateRangesMin[attr]);
        this._updateRangesMax[attr] = Math.max(end, this._updateRangesMax[attr]);
    }

    // setOutline(idx,o)
    // {
    //     if(this._attrOutline[idx]!=o) { this._needsRebuild=true; }
    //     this._attrOutline[idx]=o;
    // }

    createRect(options)
    {
        options = options || {};
        const r = new GlRect(this, options);
        this._rects.push(r);

        if (options.draggable)
        {
            this.allowDragging = options.draggable;
            r.on("dragStart", (rect) => { if (this.allowDragging) this._draggingRect = rect; });
            r.on("dragEnd", () => { this._draggingRect = null; });
        }

        r.on("textureChanged", () => { this._needsTextureUpdate = true; });

        return r;
    }

    mouseMove(x, y, button, event)
    {
        const perf = CABLES.UI.uiProfiler.start("[glrectinstancer] mousemove");
        if (!this._interactive) return;
        if (this.allowDragging && this._draggingRect)
        {
            this._draggingRect.mouseDrag(x, y, button);
            return;
        }

        for (let i = 0; i < this._rects.length; i++)
        {
            if (!this._rects[i].parent)
                this._rects[i].mouseMove(x, y, button);
        }

        perf.finish();
    }

    mouseDown(e)
    {
        if (!this._interactive) return;

        const perf = CABLES.UI.uiProfiler.start("[glrectinstancer] mouseDown");
        for (let i = 0; i < this._rects.length; i++)
            if (!this._rects[i].parent)
                this._rects[i].mouseDown(e);
        perf.finish();
    }

    mouseUp(e)
    {
        if (!this._interactive) return;

        const perf = CABLES.UI.uiProfiler.start("[glrectinstancer] mouseup");

        for (let i = 0; i < this._rects.length; i++) this._rects[i].mouseUp(e);
        perf.finish();

        if (this._draggingRect) this._draggingRect.mouseDragEnd();
    }
}
