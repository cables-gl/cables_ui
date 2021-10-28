import GlUiConfig from "../glpatch/gluiconfig";
import GlRect from "./glrect";
import Logger from "../utils/logger";


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
        // this._updateRangesMin = {};
        // this._updateRangesMax = {};
        this._bounds = { "minX": 99999, "maxX": -999999, "minY": 999999, "maxY": -9999999, "minZ": 99999, "maxZ": -999999 };

        this._meshAttrPos = null;
        this._meshAttrCol = null;
        this._meshAttrSize = null;
        this._meshAttrDeco = null;
        this._meshAttrRect = null;
        this._meshAttrTex = null;


        this._setupAttribBuffers();

        this.ATTR_TEXRECT = "texRect";
        this.ATTR_CONTENT_TEX = "contentTexture";
        this.ATTR_POS = "instPos";
        this.ATTR_COLOR = "instCol";
        this.ATTR_SIZE = "instSize";
        this.ATTR_DECO = "instDeco";


        this._shader = new CGL.Shader(cgl, "rectinstancer");
        this._shader.setSource(""
            .endl() + "IN vec3 vPosition;"
            .endl() + "IN vec3 instPos;"
            .endl() + "IN vec4 instCol;"
            .endl() + "IN vec2 attrTexCoord;"
            .endl() + "IN vec4 texRect;"
            .endl() + "IN vec2 instSize;"
            .endl() + "IN float instDeco;"

            .endl() + "OUT float decoration;"

            // .endl()+'OUT float outlinefrag;'
            .endl() + "OUT vec4 posSize;"
            .endl() + "OUT vec4 col;"
            .endl() + "OUT vec2 uv;"

            .endl() + "IN float contentTexture;"
            .endl() + "OUT float useTexture;"
            .endl() + "OUT float zz;"

            .endl() + "UNI float zoom,resX,resY,scrollX,scrollY;"

            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    float aspect=resX/resY;"

            .endl() + "    useTexture=contentTexture;"
            .endl() + "    decoration=instDeco;"

            .endl() + "    uv=attrTexCoord*texRect.zw+texRect.xy;"
            .endl() + "    uv.y=1.0-uv.y;"

        // .endl()+'    outlinefrag=outline/resY*aspect*1.0;'

            .endl() + "    vec3 pos=vPosition;"
            .endl() + "    pos.xy*=instSize;"

            .endl() + "    posSize=vec4(pos.xy*zoom,instSize*zoom-pos.xy*zoom);"

            .endl() + "    pos.x+=instPos.x;"
            .endl() + "    pos.y+=instPos.y;"
            .endl() + "    pos.z+=instPos.z;"

            .endl() + "    pos.y*=aspect;"
            .endl() + "    pos.y=0.0-pos.y;"

            .endl() + "    col=instCol;"

            .endl() + "    pos.xy*=zoom;"
            .endl() + "    pos.x+=scrollX;"
            .endl() + "    pos.y+=scrollY;"

            .endl() + "    pos.z=zz=instPos.z;"
        // .endl() + "    pos.z=zz=0.0;"

            .endl() + "    gl_Position = vec4(pos,1.0);"
            .endl() + "}",

        ""
            .endl() + "IN vec4 col;"
            .endl() + "IN vec4 posSize;"
            .endl() + "IN float zz;"
            // .endl()+'IN float outlinefrag;'
            .endl() + "IN vec2 uv;"
            .endl() + "IN float decoration;"
            .endl() + "IN float useTexture;"
            .endl() + "UNI float time;"
            .endl() + "UNI sampler2D tex;"
            .endl() + "UNI float zoom;"

        // .endl() + "UNI sampler2D tex;"


            .endl() + "float median(float r, float g, float b)"
            .endl() + "{"
            .endl() + "return max(min(r, g), min(max(r, g), b));"
            .endl() + "}"

            .endl() + "void main()"
            .endl() + "{"

            .endl() + "   outColor.rgb=col.rgb;"
            .endl() + "   outColor.a=1.0;"


            .endl() + "if(useTexture>=0.0)"
            .endl() + "{"
            .endl() + "   #ifdef SDF_TEXTURE"
            .endl() + "        vec4 smpl=texture(tex,uv);"
            .endl() + "        float sigDist = median(smpl.r, smpl.g, smpl.b) - 0.5;"
            .endl() + "        vec2 msdfUnit = 8.0/vec2(1024.0);"
            .endl() + "        sigDist *= dot(msdfUnit, 0.5/fwidth(uv));"
            .endl() + "        float opacity = clamp(sigDist + 0.5, 0.0, 1.0);"
            .endl() + "        outColor=vec4(outColor.rgb, opacity);"
            .endl() + "   #endif"

            .endl() + "   #ifndef SDF_TEXTURE"
            .endl() + "        outColor=texture(tex,uv);"
            // .endl() + "     if(int(useTexture)==1)outColor=texture(tex[1],uv);"
            // .endl() + "     if(int(useTexture)==2)outColor=texture(tex[2],uv);"
            // .endl() + "     if(int(useTexture)==3)outColor=texture(tex[3],uv);"
            // .endl() + "     if(int(useTexture)==4)outColor=texture(tex[4],uv);"
            // .endl() + "     if(int(useTexture)==5)outColor=texture(tex[5],uv);"
            .endl() + "   #endif"
            .endl() + "}"

            .endl() + "if(decoration==1.0)" // circle
            .endl() + "{"
            .endl() + "   float outer = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));"
            .endl() + "   float inner = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));"
            .endl() + "   outColor.a=smoothstep(0.2+fwidth(uv.x),0.2,outer);"
            .endl() + "   if(1.0-smoothstep(0.1+fwidth(uv.x),0.1,inner)==0.0)outColor.rgb=vec3(" + GlUiConfig.colors.opBoundsRect[0] + ");"

            .endl() + "   if(outColor.a==0.0)discard;"
            .endl() + "}"

            .endl() + "if(decoration==2.0)" // border
            .endl() + "{"
            .endl() + "   float outlinefrag=0.003;"
            .endl() + "       float add=(1.0-step(outlinefrag,posSize.x));"
            .endl() + "       if(add==0.0)add=(1.0-step(outlinefrag,posSize.y));"
            .endl() + "       if(add==0.0)add=(1.0-step(outlinefrag,posSize.z));"
            .endl() + "       if(add==0.0)add=(1.0-step(outlinefrag,posSize.w));"
            .endl() + "       outColor.rgb+=vec3(add*0.4);"
            .endl() + "   }"

            .endl() + "if(decoration==3.0)" // stripes
            .endl() + "{"
            .endl() + "    float w=0.03;"
            .endl() + "    outColor.rgb+=0.12*vec3( step(w/2.0,mod( time*0.04+posSize.x+posSize.y,w )));"
            .endl() + "}"

            .endl() + "if(decoration==4.0)" // border no content
            .endl() + "{"
            .endl() + "   float outlinefrag=0.003;"
            .endl() + "       float add=(1.0-step(outlinefrag,posSize.x));"
            .endl() + "       if(add==0.0)add=(1.0-step(outlinefrag,posSize.y));"
            .endl() + "       if(add==0.0)add=(1.0-step(outlinefrag,posSize.z));"
            .endl() + "       if(add==0.0)add=(1.0-step(outlinefrag,posSize.w));"
            // .endl() + "       outColor.rgb=vec3(add*0.4);"
            .endl() + "       if(add==0.0)outColor.a=0.0;"
            .endl() + "}"

            .endl() + "if(decoration==5.0)" // cursor
            .endl() + "{"
            .endl() + "     if(1.0-uv.x > uv.y && 1.0-uv.y<0.8-uv.x*0.3)outColor.a=1.0;"
            .endl() + "     else outColor.a=0.0;"
            .endl() + "}"

            .endl() + "if(decoration==6.0)" // filled circle
            .endl() + "{"
            .endl() + "   float outer = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));"
            .endl() + "   outColor.a=smoothstep(0.2+fwidth(uv.x),0.2,outer);"
            .endl() + "   if(outColor.a==0.0)discard;"
            .endl() + "}"

        // .endl() + "   float sc = 1.0 / fwidth(uv.x);"
        // .endl() + "   if(posSize.x>3.0)outColor.rgb=vec3(1.0);"

        // .endl() + "   outColor=vec4(zz,zz,zz,1.0);"
        // .endl() + "   outColor.rg+=uv*0.3;"
            .endl() + "   outColor.a*=col.a;"

        // .endl() + "   outColor.a=0.1;"

            // .endl() + "   outColor=vec4(zz,zz,zz,1.0);"
            .endl() + "}");


        this._uniTime = new CGL.Uniform(this._shader, "f", "time", 0);
        this._uniZoom = new CGL.Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new CGL.Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new CGL.Uniform(this._shader, "f", "resY", 0);
        this._uniscrollX = new CGL.Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new CGL.Uniform(this._shader, "f", "scrollY", 0);

        this._uniTexture = new CGL.Uniform(this._shader, "t", "tex", 0);

        this._geom = new CGL.Geometry("rectinstancer");
        this._geom.vertices = new Float32Array([1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0]);
        this._geom.verticesIndices = new Float32Array([2, 1, 0, 3, 1, 2]);
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

            const defaultMin = 999999;
            const defaultMax = -999999;
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

    clear()
    {
        let i = 0;
        for (i = 0; i < 2 * this._num; i++) this._attrBuffSizes[i] = 0;// Math.random()*61;
        for (i = 0; i < 3 * this._num; i++) this._attrBuffPos[i] = 0;// Math.random()*60;
        for (i = 0; i < 4 * this._num; i++) this._attrBuffCol[i] = 1;// Math.random();
        // for(i=0;i<this._num;i++) this._attrOutline[i]=0;//Math.random();
        for (i = 0; i < this._num; i++) this._attrBuffDeco[i] = 0;// Math.random();
        for (i = 0; i < this._num; i++) this._attrBuffTextures[i] = -1;// Math.random();

        for (i = 0; i < 4 * this._num; i += 4)
        {
            this._attrTexRect[i + 0] = 0;
            this._attrTexRect[i + 1] = 0;
            this._attrTexRect[i + 2] = 1;
            this._attrTexRect[i + 3] = 1;
        }
    }

    _setupAttribBuffers()
    {
        const oldAttrPositions = this._attrBuffPos;
        const oldAttrTextures = this._attrBuffTextures;
        const oldAttrColors = this._attrBuffCol;
        const oldAttrSizes = this._attrBuffSizes;
        const oldAttrCircle = this._attrBuffDeco;
        const oldAttrTexRect = this._attrTexRect;

        this._attrBuffPos = new Float32Array(3 * this._num);
        this._attrBuffTextures = new Float32Array(this._num);
        this._attrBuffCol = new Float32Array(4 * this._num);
        this._attrBuffSizes = new Float32Array(2 * this._num);
        this._attrBuffDeco = new Float32Array(this._num);
        this._attrTexRect = new Float32Array(4 * this._num);
        this.clear();

        if (oldAttrPositions) this._attrBuffPos.set(oldAttrPositions);
        if (oldAttrTextures) this._attrBuffTextures.set(oldAttrTextures);
        if (oldAttrColors) this._attrBuffCol.set(oldAttrColors);
        if (oldAttrSizes) this._attrBuffSizes.set(oldAttrSizes);
        if (oldAttrCircle) this._attrBuffDeco.set(oldAttrCircle);
        if (oldAttrTexRect) this._attrTexRect.set(oldAttrTexRect);
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
        for (let i = 0; i < this._rects.length; i++)
        {
            if (this._rects[i].texture)
            {
                let found = false;

                for (let j = 0; j < this._textures.length; j++)
                {
                    if (this._textures[j] && this._textures[j].texture == this._rects[i].texture)
                    {
                        found = true;
                        this._attrBuffTextures[this._rects[i].idx] = this._textures[j].num;
                        this._needsRebuild = true;
                    }
                }

                if (!found)
                {
                    this._attrBuffTextures[this._rects[i].idx] = count;
                    this._textures[count] =
                        {
                            "texture": this._rects[i].texture,
                            "num": count
                        };
                    count++;
                    this._needsRebuild = true;
                }
            }
            else this._attrBuffTextures[this._rects[i].idx] = -1;
        }

        this._mesh.setAttribute(this.ATTR_CONTENT_TEX, this._attrBuffTextures, 1, { "instanced": true });
    }


    _bindTextures()
    {
        for (let i = 0; i < 4; i++)
        {
            if (this._textures[0])
                this._cgl.setTexture(i, this._textures[0].texture.tex);
        }

        if (this._textures[0]) this._cgl.setTexture(0, this._textures[0].texture.tex);
    }


    render(resX, resY, scrollX, scrollY, zoom)
    {
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
            // this._log.log("reupload all attribs");
            this._meshAttrPos = this._mesh.setAttribute(this.ATTR_POS, this._attrBuffPos, 3, { "instanced": true });
            this._meshAttrCol = this._mesh.setAttribute(this.ATTR_COLOR, this._attrBuffCol, 4, { "instanced": true });
            this._meshAttrSize = this._mesh.setAttribute(this.ATTR_SIZE, this._attrBuffSizes, 2, { "instanced": true });
            this._meshAttrDeco = this._mesh.setAttribute(this.ATTR_DECO, this._attrBuffDeco, 1, { "instanced": true });
            this._meshAttrRect = this._mesh.setAttribute(this.ATTR_TEXRECT, this._attrTexRect, 4, { "instanced": true });
            this._meshAttrTex = this._mesh.setAttribute(this.ATTR_CONTENT_TEX, this._attrBuffTextures, 1, { "instanced": true });
            this._reUploadAttribs = false;
            perf.finish();
        }

        // if (this._updateRangesMin[this.ATTR_POS] != 9999)
        // {
        //     this._mesh.setAttributeRange(this.ATTR_POS, this._attrBuffPos, this._updateRangesMin[this.ATTR_POS], this._updateRangesMax[this.ATTR_POS]);
        //     this._resetAttrRange(this.ATTR_POS);
        // }

        // if (this._updateRangesMin[this.ATTR_COLOR] != 9999)
        // {
        //     this._mesh.setAttributeRange(this.ATTR_COLOR, this._attrBuffCol, this._updateRangesMin[this.ATTR_COLOR], this._updateRangesMax[this.ATTR_COLOR]);
        //     this._resetAttrRange(this.ATTR_COLOR);
        // }

        // if (this._updateRangesMin[this.ATTR_SIZE] != 9999)
        // {
        //     this._mesh.setAttributeRange(this.ATTR_SIZE, this._attrBuffSizes, this._updateRangesMin[this.ATTR_SIZE], this._updateRangesMax[this.ATTR_SIZE]);
        //     this._resetAttrRange(this.ATTR_SIZE);
        // }

        // if (this._updateRangesMin[this.ATTR_DECO] != 9999)
        // {
        //     this._mesh.setAttributeRange(this.ATTR_DECO, this._attrBuffDeco, this._updateRangesMin[this.ATTR_DECO], this._updateRangesMax[this.ATTR_DECO]);
        //     this._resetAttrRange(this.ATTR_DECO);
        // }

        // if (this._updateRangesMin[this.ATTR_TEXRECT] != 9999)
        // {
        //     this._mesh.setAttributeRange(this.ATTR_TEXRECT, this._attrTexRect, this._updateRangesMin[this.ATTR_TEXRECT], this._updateRangesMax[this.ATTR_TEXRECT]);
        //     this._resetAttrRange(this.ATTR_TEXRECT);
        // }


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
        const i = idx * 3;
        if (this._float32Diff(this._attrBuffPos[i + 0], x) || this._float32Diff(this._attrBuffPos[i + 1], y) || this._float32Diff(this._attrBuffPos[i + 2], z))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "pos change";
            // this._setAttrRange(this.ATTR_POS, i, i + 3);
        }
        else return;

        if (
            this._attrBuffPos[i + 0] >= this._bounds.maxX || this._attrBuffPos[i + 0] <= this._bounds.minX ||
            this._attrBuffPos[i + 1] >= this._bounds.maxY || this._attrBuffPos[i + 1] <= this._bounds.minY)
        {
            this._needsBoundsRecalc = true;
        }

        this._attrBuffPos[i + 0] = x;
        this._attrBuffPos[i + 1] = y;
        this._attrBuffPos[i + 2] = z;

        if (
            this._attrBuffPos[i + 0] >= this._bounds.maxX || this._attrBuffPos[i + 0] <= this._bounds.minX ||
            this._attrBuffPos[i + 1] >= this._bounds.maxY || this._attrBuffPos[i + 1] <= this._bounds.minY)
        {
            this._needsBoundsRecalc = true;
        }

        if (!this._needsBoundsRecalc)
        {
            this._bounds.minX = Math.min(this._attrBuffPos[i + 0], this._bounds.minX);
            this._bounds.maxX = Math.max(this._attrBuffPos[i + 0], this._bounds.maxX);

            this._bounds.minY = Math.min(this._attrBuffPos[i + 1], this._bounds.minY);
            this._bounds.maxY = Math.max(this._attrBuffPos[i + 1], this._bounds.maxY);

            this._bounds.minZ = Math.min(this._attrBuffPos[i + 2], this._bounds.minZ);
            this._bounds.maxZ = Math.max(this._attrBuffPos[i + 2], this._bounds.maxZ);
        }

        this._mesh.setAttributeRange(this._meshAttrPos, this._attrBuffPos, i, i + 3);
        this._needsBoundsRecalc = true;
    }

    setSize(idx, x, y)
    {
        if (this._float32Diff(this._attrBuffSizes[idx * 2 + 0], x) || this._float32Diff(this._attrBuffSizes[idx * 2 + 1], y))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "size change";
            // this._setAttrRange(this.ATTR_SIZE, idx * 2, (idx + 1) * 2);
        }
        else return;

        this._attrBuffSizes[idx * 2 + 0] = x;
        this._attrBuffSizes[idx * 2 + 1] = y;
        this._mesh.setAttributeRange(this._meshAttrSize, this._attrBuffSizes, idx * 2, (idx + 1) * 2);
    }

    setTexRect(idx, x, y, w, h)
    {
        if (
            this._float32Diff(this._attrTexRect[idx * 4 + 0], x) ||
            this._float32Diff(this._attrTexRect[idx * 4 + 1], y) ||
            this._float32Diff(this._attrTexRect[idx * 4 + 2], w) ||
            this._float32Diff(this._attrTexRect[idx * 4 + 3], h))
        {
            // this._needsRebuild = true;
            // this._needsRebuildReason = "texrect";
            // this._setAttrRange(this.ATTR_TEXRECT, idx * 4, idx * 4 + 4);
        }
        else return;

        this._attrTexRect[idx * 4 + 0] = x;
        this._attrTexRect[idx * 4 + 1] = y;
        this._attrTexRect[idx * 4 + 2] = w;
        this._attrTexRect[idx * 4 + 3] = h;
        this._mesh.setAttributeRange(this._meshAttrRect, this._attrTexRect, idx * 4, idx * 4 + 4);
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

        this._mesh.setAttributeRange(this._meshAttrCol, this._attrBuffCol, idx * 4, idx * 4 + 4);
    }

    setDecoration(idx, o)
    {
        this._attrBuffDeco[idx] = o;
        this._mesh.setAttributeRange(this._meshAttrDeco, this._attrBuffDeco, idx, idx + 1);
    }

    setAllTexture(tex, sdf)
    {
        this._shader.toggleDefine("SDF_TEXTURE", sdf);

        for (let i = 0; i < this._rects.length; i++)
        {
            this._rects[i].setTexture(tex);
        }
    }

    // _resetAttrRange(attr)
    // {
    //     this._updateRangesMin[attr] = 9999;
    //     this._updateRangesMax[attr] = -9999;
    // }

    // _setAttrRange(attr, start, end)
    // {
    //     this._updateRangesMin[attr] = Math.min(start, this._updateRangesMin[attr]);
    //     this._updateRangesMax[attr] = Math.max(end, this._updateRangesMin[attr]);
    // }


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
        const perf = CABLES.UI.uiProfiler.start("glrectinstancer mousemove");
        if (!this._interactive) return;
        if (this.allowDragging && this._draggingRect)
        {
            this._draggingRect.mouseDrag(x, y, button);
            return;
        }

        for (let i = 0; i < this._rects.length; i++)
        {
            this._rects[i].mouseMove(x, y, button);
        }
        perf.finish();
    }

    mouseDown(e)
    {
        if (!this._interactive) return;


        for (let i = 0; i < this._rects.length; i++) this._rects[i].mouseDown(e);
    }

    mouseUp(e)
    {
        if (!this._interactive) return;

        for (let i = 0; i < this._rects.length; i++) this._rects[i].mouseUp(e);

        if (this._draggingRect) this._draggingRect.mouseDragEnd();
    }
}
