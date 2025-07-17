import { Geometry, Mesh, Shader, Uniform } from "cables-corelibs";
import { nl } from "cables-corelibs/cgl/constants.js";
import { gui } from "../gui.js";

/**
 * draw lines on the patchfield
 *
 * @export
 * @class GlLinedrawer
 */
export default class GlLinedrawer
{
    constructor(cgl, options)
    {
        if (!cgl) throw new Error("[Linedrawer] no cgl");
        options = options || {};

        this._startTime = performance.now();
        this._counter = 0;

        this._name = options.name || "unknown";
        this._num = options.initNum || 100;
        this._needsUpload = true;

        this._positions = new Float32Array(3 * 2 * this._num);
        this._colors = new Float32Array(4 * 2 * this._num);
        this._dists = new Float32Array(2 * this._num);
        this._speeds = new Float32Array(2 * this._num);

        this._shader = new Shader(cgl, "SplineDrawer");
        this._shader.ignoreMissingUniforms = true;
        this._shader.glPrimitive = cgl.gl.LINES;
        this._shader.setSource(""
            + nl + "IN vec3 vPosition;"
            + nl + "IN vec4 color;"
            + nl + "IN float vdist;"
            + nl + "IN float speed;"
            + nl + "OUT float speedy;"
            + nl + "OUT float dist;"
            + nl + "OUT vec4 col;"
            + nl + "OUT vec2 pos2d;"
            + nl + "UNI float zoom,resX,resY,scrollX,scrollY;"

            + nl + "void main()"
            + nl + "{"
            + nl + "    float aspect=resX/resY;"

            + nl + "    dist=vdist;"
            + nl + "    speedy=speed;"

            + nl + "    vec3 pos=vPosition;"

            + nl + "    pos.y*=aspect;"
            + nl + "    pos.y=0.0-pos.y;"

            + nl + "    pos2d=pos.xy;"

            + nl + "    col=color;"
            + nl + "    pos*=zoom;"

            + nl + "    pos.x+=scrollX;"
            + nl + "    pos.y+=scrollY;"
            + nl + "    pos.z=0.9;"

            + nl + "    gl_Position = vec4(pos,1.0);"
            + nl + "}",

        ""
            + nl + "UNI float time;"
            + nl + "IN vec2 pos2d;"
            + nl + "IN vec4 col;"
            + nl + "IN float dist;"
            + nl + "IN float speedy;"
            + nl + "UNI float zoom;"

            + nl + "void main()"
            + nl + "{"
            + nl + "   vec4 finalColor=col;"
            + nl + "   if(finalColor.a==0.0) discard;"
            + nl + "   float stepLength=5.0;"

            + nl + "   float showSpeed=clamp(speedy,0.4,1.0);"

        // +nl + "   float colmul=step(stepLength*0.5,mod(dist+(speedy*time),stepLength))+0.7;"
        // +nl + "   if(speedy>=1.0) finalColor.rgb *= clamp(speedy,0.5,1.0)*(showSpeed)*clamp(colmul,0.0,1.0)*2.0;"
        // +nl + "   else finalColor.rgb = finalColor.rgb;"
        // +nl + "   else finalColor.rgb = finalColor.rgb;"

            + nl + "   finalColor.rgb = finalColor.rgb;"
            + nl + "   finalColor.a = showSpeed;"
        // +nl + "   finalColor.a = 1.0;"
        // +nl+'   color.r = 1.0;'

        // +nl+'   color.rgb += (1.0-showSpeed) * col.rgb;'

        // +nl+'   if(speedy==0)'

        // +nl+'  float a=length(gl_FragCoord.xy);'// )+1.0)/2.0+0.5);'
        // +nl+'  a=sin(a);'
        // +nl+'  a=(a+1.0)/2.0;'
        // +nl+'  a=floor(a);'
            + nl + "   #ifdef DEBUG_1"
            + nl + "       finalColor.rgb=vec3((zz+1.0)/2.0);"
            + nl + "       finalColor.a=1.0;"
            + nl + "   #endif"
            + nl + "   #ifdef DEBUG_2"
            + nl + "       finalColor.rg=uv;"
            + nl + "       finalColor.a=1.0;"
            + nl + "   #endif"

            + nl + "   outColor=finalColor;"
            + nl + "}"
        );

        // floor((sin( distance(vec4(0.,0.,0.,1.0),gl_FragCoord

        this._uniZoom = new Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new Uniform(this._shader, "f", "resY", 0);
        this._uniscrollX = new Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new Uniform(this._shader, "f", "scrollY", 0);
        this._uniTime = new Uniform(this._shader, "f", "time", 0);

        this._geom = new Geometry("glpatchLineDrawer");
        this._geom.vertices = new Float32Array([10, 10, 0, 60, 60, 0, 10, 0, 0, 0, 0, 0]);

        this._mesh = new Mesh(cgl, this._geom);

        let i = 0;
        this.clear();
    }

    dispose()
    {
        this._mesh.dispose();
        this._shader.dispose();
    }

    render(resX, resY, scrollX, scrollY, zoom)
    {
        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0 / zoom);
        this._uniTime.set(((performance.now() - this._startTime) / 1000) * 20.0);

        if (this._needsUpload) this.rebuild();

        this._mesh.render(this._shader);
    }

    clear()
    {
        for (let i = 0; i < 2 * 3 * this._num; i++) this._positions[i] = 0;// Math.random()*60;
        for (let i = 0; i < 2 * 4 * this._num; i++) this._colors[i] = 1.0;
        for (let i = 0; i < 2 * 1 * this._num; i++) this._dists[i] = 0;
        for (let i = 0; i < 2 * 1 * this._num; i++) this._speeds[i] = 0;
    }

    rebuild()
    {
        const perf = gui.uiProfiler.start("[glLineDrawer] rebuild");

        // console.log("reupload lines...",this._num);
        // todo: this is basically ALWAYS! could be optimized
        // todo only update whats needed
        this._mesh.setAttribute(CGL.SHADERVAR_VERTEX_POSITION, this._positions, 3);
        this._mesh.setAttribute("color", this._colors, 4);
        this._mesh.setAttribute("vdist", this._dists, 1);
        this._mesh.setAttribute("speed", this._speeds, 1);

        perf.finish();

        this._needsUpload = false;
    }

    _setupAttribBuffers()
    {
        const oldAttrPositions = this._positions;
        const oldAttrColors = this._colors;
        const oldAttrDists = this._dists;
        const oldAttrSpeeds = this._speeds;

        this._positions = new Float32Array(2 * 3 * this._num);
        this._colors = new Float32Array(2 * 4 * this._num);
        this._dists = new Float32Array(2 * this._num);
        this._speeds = new Float32Array(2 * this._num);
        this.clear();

        if (oldAttrPositions) this._positions.set(oldAttrPositions);
        if (oldAttrColors) this._colors.set(oldAttrColors);
        if (oldAttrDists) this._dists.set(oldAttrDists);
        if (oldAttrSpeeds) this._speeds.set(oldAttrSpeeds);
        this._needsUpload = true;
    }

    setDebugRenderer(i)
    {
        this._shader.toggleDefine("DEBUG_1", i == 1);
        this._shader.toggleDefine("DEBUG_2", i == 2);
    }

    getIndex()
    {
        this._counter++;

        if (this._counter > this._num - 100)
        {
            this._num += 1000;
            this._setupAttribBuffers();
            this._needsUpload = true;
        }

        return this._counter;
    }

    _distance(x1, y1, x2, y2)
    {
        const xd = x2 - x1;
        const yd = y2 - y1;
        return Math.sqrt(xd * xd + yd * yd);
    }

    _float32Diff(a, b)
    {
        return Math.abs(a - b) > 0.0001;
    }

    setLine(idx, x, y, x2, y2)
    {
        this._dists[idx * 2] = 0;
        this._dists[idx * 2 + 1] = this._distance(x, y, x2, y2);

        if (
            this._float32Diff(this._positions[idx * 6 + 0], x) ||
            this._float32Diff(this._positions[idx * 6 + 1], y) ||
            this._float32Diff(this._positions[idx * 6 + 3], x2) ||
            this._float32Diff(this._positions[idx * 6 + 4], y2)) { this._needsUpload = true; }

        this._positions[idx * 6 + 0] = x;
        this._positions[idx * 6 + 1] = y;
        this._positions[idx * 6 + 2] = 0;
        this._positions[idx * 6 + 3] = x2;
        this._positions[idx * 6 + 4] = y2;
        this._positions[idx * 6 + 5] = 0;
    }

    setColor(idx, r, g, b, a)
    {
        if (
            this._float32Diff(this._colors[idx * 8 + 0], r) ||
            this._float32Diff(this._colors[idx * 8 + 1], g) ||
            this._float32Diff(this._colors[idx * 8 + 2], b) ||
            this._float32Diff(this._colors[idx * 8 + 3], a) ||
            this._float32Diff(this._colors[idx * 8 + 4], r) ||
            this._float32Diff(this._colors[idx * 8 + 5], g) ||
            this._float32Diff(this._colors[idx * 8 + 6], b) ||
            this._float32Diff(this._colors[idx * 8 + 7], a)) { this._needsUpload = true; }

        this._colors[idx * 8 + 0] = r;
        this._colors[idx * 8 + 1] = g;
        this._colors[idx * 8 + 2] = b;
        this._colors[idx * 8 + 3] = a;
        this._colors[idx * 8 + 4] = r;
        this._colors[idx * 8 + 5] = g;
        this._colors[idx * 8 + 6] = b;
        this._colors[idx * 8 + 7] = a;
    }

    setSpeed(idx, speed)
    {
        if (
            this._float32Diff(this._speeds[idx * 2 + 0], speed) ||
            this._float32Diff(this._speeds[idx * 2 + 1], speed)) { this._needsUpload = true; }

        this._speeds[idx * 2] = speed;
        this._speeds[idx * 2 + 1] = speed;
    }
}
