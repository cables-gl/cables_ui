import { Geometry, Mesh, Shader, Uniform } from "cables-corelibs";
import { utils } from "cables";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import { Events } from "cables-shared-client";
import UserSettings, { userSettings } from "../components/usersettings.js";
import Gui, { gui } from "../gui.js";
import srcShaderGlSplineDrawerFrag from "./glsplinedrawer_glsl.frag";
import srcShaderGlSplineDrawerVert from "./glsplinedrawer_glsl.vert";
import GlCanvas from "./glcanvas.js";
import GlUiCanvas from "../glpatch/gluicanvas.js";
import GlSpline from "./glspline.js";
import GlPatch from "../glpatch/glpatch.js";

/**
 * draw splines, e.g. cables on the patchfield
 *
 */
export class GlSplineDrawer extends Events
{
    #geom;
    static EVENT_CLEARED = "clear";

    width = 3;

    /** @type {Object} */
    #splines;
    #cgl;
    #rebuildLater;
    #count;
    #shader;

    /** @type {Float32Array} */
    #verts;

    /** @type {Float32Array} */
    #pointsProgress;
    #pointsSplineLength;

    /** @type {Float32Array} */
    #points;

    /** @type {Float32Array} */
    #points2;

    /** @type {Float32Array} */
    #points3;
    #doDraw;

    /** @type {Float32Array} */
    #speeds;

    /** @type {Number[]} */
    #thePoints;
    #splineIndex;
    #rebuildReason;
    #splineHidden;

    /** @type {Number[]} */
    #splineColors;

    /** @type {Mesh} */
    #mesh;
    #uniWidth;
    #uniResX;
    #uniResY;
    #uniscrollY;
    #uniWidthSelected;
    #uniZoom;
    #uniTime;
    #uniscrollX;

    /**
     * @param {CglContext} cgl
     * @param {String} name
     */
    constructor(cgl, name)
    {
        super();
        this.name = name;
        this.#cgl = cgl;
        this.#count = -1;

        this.#rebuildLater = performance.now();
        this.doTessEdges = true;
        this.doCalcProgress = true;

        this.#geom = new Geometry("GlSplineDrawer_" + name);
        // this.#geom.glPrimitive = cgl.gl.POINTS;

        this.clear();

        this.#shader = new Shader(cgl, "glSplineDrawer " + name);
        this.#shader.setSource(srcShaderGlSplineDrawerVert, srcShaderGlSplineDrawerFrag);
        this.#shader.define("ZPOSDIV", GlUiCanvas.ZPOSDIV + ".0");

        this.#uniTime = new Uniform(this.#shader, "f", "time", 0);
        this.#uniZoom = new Uniform(this.#shader, "f", "zoom", 0);
        this.#uniResX = new Uniform(this.#shader, "f", "resX", 0);
        this.#uniResY = new Uniform(this.#shader, "f", "resY", 0);
        this.#uniscrollX = new Uniform(this.#shader, "f", "scrollX", 0);
        this.#uniscrollY = new Uniform(this.#shader, "f", "scrollY", 0);
        this.#uniWidth = new Uniform(this.#shader, "f", "width", this.width);
        this.#uniWidthSelected = new Uniform(this.#shader, "f", "widthSelected", 3);

        this._uniFadeoutOptions = new Uniform(this.#shader, "4f", "fadeOutOptions", [50.0, 40.0, 0.0, 0.2]);

        this._uniMousePos = new Uniform(this.#shader, "2f", "mousePos");

        this.#shader.toggleDefine("FADEOUT", !userSettings.get("fadeOutOptions"));
        this.#shader.toggleDefine("DRAWSPEED", userSettings.get("glflowmode") != 0);

        userSettings.on(UserSettings.EVENT_CHANGE, (which, val) =>
        {
            if (which == GlPatch.USERPREF_GLPATCH_CABLE_WIDTH) this.#uniWidthSelected.set(userSettings.get(GlPatch.USERPREF_GLPATCH_CABLE_WIDTH) * 0.5 + 1);
            if (which == "noFadeOutCables") this.#shader.toggleDefine("FADEOUT", !val);
            if (which == "glflowmode") this.#shader.toggleDefine("DRAWSPEED", userSettings.get("glflowmode") != 0);
        });

        gui.on(Gui.EVENT_THEMECHANGED, () =>
        {
            // this.#uniWidth.set(gui.theme.patch.cablesWidth || 3);
            // this.#uniWidthSelected.set(gui.theme.patch.cablesWidthSelected || 1);
            this._uniFadeoutOptions.set([gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity]);
        });
    }

    clear()
    {
        this.#count = -1;
        if (this.#geom) this.#geom.clear();
        if (this.#mesh) this.#mesh = this.#mesh.dispose();
        this.#verts = new Float32Array();
        this.#pointsProgress = new Float32Array();
        this.#pointsSplineLength = new Float32Array();
        this.#points = new Float32Array();
        this.#points2 = new Float32Array();
        this.#points3 = new Float32Array();
        this.#doDraw = new Float32Array();
        this.#speeds = new Float32Array();
        this.#thePoints = [];

        this.#splineIndex = null;
        this.#rebuildReason = "";

        this.#splineHidden = [];
        this.#splineColors = [];
        this.#splines = [];
        this.emitEvent(GlSplineDrawer.EVENT_CLEARED);
    }

    /**
     * @param {boolean} b
     */
    setFadeout(b)
    {
        this.#shader.toggleDefine("FADEOUT", b);
    }

    getNumSplines()
    {
        return this.#splines.length;
    }

    /**
     * @param {number} resX
     * @param {number} resY
     * @param {number} scrollX
     * @param {number} scrollY
     * @param {number} zoom
     * @param {number} _mouseX
     * @param {number} _mouseY
     */
    render(resX, resY, scrollX, scrollY, zoom, _mouseX, _mouseY)
    {
        if (this.#splines.length == 0) return;

        if (this.#rebuildLater > 0)
        {
            if (performance.now() - this.#rebuildLater > 30) this.rebuild();
            clearTimeout(this._laterTimeout);
            this._laterTimeout = setTimeout(
                () =>
                {
                    this.rebuild();
                    this.#rebuildLater = 0;
                }, 30);
        }

        if (this.#mesh)
        {
            this.#cgl.pushShader(this.#shader);

            this.#uniWidth.set(this.width);
            this.#uniResX.set(resX);
            this.#uniResY.set(resY);
            this.#uniscrollX.set(scrollX);
            this.#uniscrollY.set(scrollY);
            this.#uniZoom.set(1.0 / zoom);
            this.#uniTime.set(performance.now() / 1000);

            const fadeOutOpts = [gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity];
            if (zoom > 1400)fadeOutOpts[3] = utils.map(zoom, 1400, 2700, gui.theme.patch.fadeOutFadeOpacity, 1.0);

            this._uniFadeoutOptions.set(fadeOutOpts);

            if (this.#points.length > 0) this.#mesh.render(this.#shader);
            this.#cgl.popShader();
        }

        if (this.#splines.length == 0) return;

        if (this.#rebuildLater > 0)
        {
            if (performance.now() - this.#rebuildLater > 30) this.rebuild();
            clearTimeout(this._laterTimeout);
            this._laterTimeout = setTimeout(
                () =>
                {
                    this.rebuild();
                    this.#rebuildLater = 0;
                }, 30);
        }

        if (this.#mesh)
        {
            this.#cgl.pushShader(this.#shader);

            this.#uniWidth.set(this.width);
            this.#uniResX.set(resX);
            this.#uniResY.set(resY);
            this.#uniscrollX.set(scrollX);
            this.#uniscrollY.set(scrollY);
            this.#uniZoom.set(1.0 / zoom);
            this.#uniTime.set(performance.now() / 1000);

            const fadeOutOpts = [gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity];
            if (zoom > 1400)fadeOutOpts[3] = utils.map(zoom, 1400, 2700, gui.theme.patch.fadeOutFadeOpacity, 1.0);

            this._uniFadeoutOptions.set(fadeOutOpts);

            if (this.#points.length > 0) this.#mesh.render(this.#shader);
            this.#cgl.popShader();
        }
    }

    get count()
    {
        return this.#count + 1;
    }

    getSplineIndex(name = "")
    {
        this.#count++;
        this.#splines[this.#count] =
        {
            "name": name,
            "points": [],
            "color": [1, 0, 0, 1],
            "colorInactive": [0, 1, 0, 1],
            "colorBorder": [0, 0, 0, 0],
            "speed": 1,
            "index": this.#count,
            "hidden": false,
            "pointsNeedProgressUpdate": true,
            "deleted": false
        };

        this.rebuildLater("new spline");

        return this.#count;
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
     * @param {number} i
     */
    setDebugRenderer(i)
    {
        this.#shader.toggleDefine("DEBUG_1", i == 1);
        this.#shader.toggleDefine("DEBUG_2", i == 2);
    }

    /**
     * @param {number} idx
     * @param {any} speed
     */
    setSplineSpeed(idx, speed)
    {
        if (this.#splines[idx].speed != speed)
        {
            this.#splines[idx].speed = speed;
            this._updateAttribsSpeed(idx);
        }
    }

    /**
     * @param {number} idx
     * @param {number[]} rgba
     */
    setSplineColorInactive(idx, rgba)
    {
        if (!this.#splines[idx]) return;

        if (
            this._float32Diff(this.#splines[idx].colorInactive[0], rgba[0]) ||
            this._float32Diff(this.#splines[idx].colorInactive[1], rgba[1]) ||
            this._float32Diff(this.#splines[idx].colorInactive[2], rgba[2]) ||
            this._float32Diff(this.#splines[idx].colorInactive[3], rgba[3]))
        {
            this.#splines[idx].colorInactive = rgba;
            this._updateAttribsCoordinates(idx, { "colorsInactive": true });
        }
    }

    /**
     * @param {number} idx
     * @param {number[]} rgba
     */
    setSplineColorBorder(idx, rgba)
    {
        if (
            this._float32Diff(this.#splines[idx].colorBorder[0], rgba[0]) ||
            this._float32Diff(this.#splines[idx].colorBorder[1], rgba[1]) ||
            this._float32Diff(this.#splines[idx].colorBorder[2], rgba[2]) ||
            this._float32Diff(this.#splines[idx].colorBorder[3], rgba[3]))
        {
            this.#splines[idx].colorBorder = rgba;
            this._updateAttribsCoordinates(idx, { "colorsBorder": true });
        }
    }

    /**
     * @param {number} idx
     * @param {number[]} rgba
     */
    setSplineColor(idx, rgba)
    {
        if (!this.#splines[idx]) return;
        if (
            this._float32Diff(this.#splines[idx].color[0], rgba[0]) ||
            this._float32Diff(this.#splines[idx].color[1], rgba[1]) ||
            this._float32Diff(this.#splines[idx].color[2], rgba[2]) ||
            this._float32Diff(this.#splines[idx].color[3], rgba[3]))
        {
            this.#splines[idx].color = rgba;
            this._updateAttribsCoordinates(idx, { "colors": true });
        }
    }

    /**
     * @param {number} idx
     */
    deleteSpline(idx)
    {
        if (!this.#splines[idx]) return;
        const sp = this.#splines[idx];

        this.setSplineColor(idx, [0, 0, 0, 0]);
        sp.deleted = true;

        if (sp.origPoints)
            for (let i = 0; i < sp.origPoints.length; i += 3)
            {
                sp.origPoints[i + 0] =
                sp.origPoints[i + 1] =
                sp.origPoints[i + 2] = 0;
            }

        this.setSpline(idx, sp.origPoints);
    }

    /**
     * @param {number} idx
     */
    showSpline(idx)
    {
        this.#splines[idx].hidden = false;
    }

    /**
     * @param {number} idx
     */
    hideSpline(idx)
    {
        this.#splines[idx].hidden = true;
        if (this.#splines[idx].points) for (let i = 0; i < this.#splines[idx].points.length; i++) this.#splines[idx].points[i] = 0;
        this._updateAttribsCoordinates(idx);
    }

    /**
     * @param {number} idx
     * @param {number[]} points
     */
    setSpline(idx, points)
    {
        if (idx === undefined || idx === null)
        {
            console.log("idx not defined");
            return;
        }

        let isDifferent = true;
        let isDifferentLength = false;

        if (!this.#rebuildLater)
        {
            if (this.#splines[idx] && this.#splines[idx].origPoints)
            {
                isDifferent = false;

                if (this.#splines[idx].hidden)
                {
                    isDifferent = true;
                    this.#splines[idx].hidden = false;
                }
                else
                if (points.length < this.#splines[idx].origPoints.length)
                {
                    // if new num of points is smaller than last one just draw last point multiple times and do not rebuild everything...
                    isDifferent = true;
                    for (let i = points.length / 3; i < this.#splines[idx].origPoints.length / 3; i++)
                    {
                        points[i * 3] = points[i * 3];
                        points[i * 3 + 1] = points[i * 3 + 1];
                        points[i * 3 + 2] = points[i * 3 + 2];
                    }

                    this.#splines[idx].pointsNeedProgressUpdate = true;
                }
                else
                if (points.length > this.#splines[idx].origPoints.length)
                {
                    // length of spline changed, we need to rebuild the whole buffer....
                    isDifferent = true;
                    isDifferentLength = true;
                    this.#splines[idx].pointsNeedProgressUpdate = true;
                    this.rebuildLater("length of spline changed " + points.length + " vs " + this.#splines[idx].origPoints.length);
                    // this._rebuildLater = true;
                    // this._rebuildReason = ;
                }
                else
                {
                    for (let i = 0; i < this.#splines[idx].origPoints.length; i++)
                    {
                        if (this.#splines[idx].origPoints[i] != points[i])
                        {
                            isDifferent = true;
                            this.#splines[idx].pointsNeedProgressUpdate = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!isDifferent) return; // nothing has changed...

        this.#splines[idx].origPoints = points;

        if (this.doTessEdges) this.#splines[idx].points = this.tessEdges(points);
        else this.#splines[idx].points = points;

        this.#splines[idx].pointsNeedProgressUpdate = true;

        if (!isDifferentLength) // length is the same, update vertices only
            this._updateAttribsCoordinates(idx);
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        this.#uniWidth.set(w);
    }

    buildMesh()
    {
        const perf = gui.uiProfiler.start("[glspline] buildMesh");
        const num = this.#thePoints.length / 3;
        if (this.#verts.length != num * 18)
        {
            this.#verts = new Float32Array(num * 18);
        }

        const max = 1;
        const min = -max;

        for (let i = 0; i < this.#thePoints.length / 3; i++)
        {
            this.#verts.set([
                max, min, 0,
                0, min, 0,
                max, max, 0,
                0, min, 0,
                0, max, 0,
                max, max, 0],
            i * 18);
        }
        this.#geom.vertices = this.#verts;

        if (!this.#mesh) this.#mesh = new Mesh(this.#cgl, this.#geom);

        this.#mesh.addVertexNumbers = false;
        this.#mesh.updateVertices(this.#geom);

        perf.finish();
    }

    /**
     * @param {number} idx
     */
    _updateAttribsSpeed(idx)
    {
        if (!this.#mesh)
        {
            this.rebuildLater("update speed");
            // this._rebuildLater = true;
            // this._rebuildReason = "update speed";

            return;
        }

        let count = 0;
        const off = this.#splines[idx].startOffset || 0;
        const points = this.#splines[idx].points;

        if (!points) return;

        for (let i = 0; i < points.length / 3; i++)
        {
            for (let j = 0; j < 6; j++)
            {
                count += 3;
                this.#speeds[(off + count) / 3] = this.#splines[idx].speed;
            }
        }
        this.#mesh.setAttributeRange(this.#mesh.getAttribute("speed"), this.#speeds, off / 3, ((off + count) / 3));
    }

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    _dist(x1, y1, x2, y2)
    {
        const xd = x2 - x1;
        const yd = y2 - y1;
        return Math.sqrt(xd * xd + yd * yd);
    }

    /**
     * @param {number} idx
     * @param {{ colorsInactive?: any; colorsBorder?: any; colors?: any; speed?: any; }} [updateWhat]
     */
    _updateAttribsCoordinates(idx, updateWhat)
    {
        if (!gui.patchView._patchRenderer) return;
        if (gui.patchView._patchRenderer.debugData)gui.patchView._patchRenderer.debugData.splineUpdate++;

        if (!this.#mesh || !this._colors)
        {
            this.rebuildLater("no mesh/colors");
            // this._rebuildReason = "no mesh/colors";
            // this._rebuildLater = true;
            return;
        }
        // if (!this.aps) this.aps = new FpsCounter();
        // this.aps.logFps = true;
        // this.aps.startFrame();
        // this.aps.endFrame();

        const off = this.#splines[idx].startOffset || 0;
        const points = this.#splines[idx].points;
        let count = 0;
        let title = "all";

        if (!points) return;

        if (updateWhat == undefined) title = "all";
        else title = Object.keys(updateWhat).join(".");

        const perf = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates " + title);

        if (updateWhat === undefined)
        {
            if (this.doCalcProgress && this.#splines[idx].pointsNeedProgressUpdate)
            {
                this.#splines[idx].pointsNeedProgressUpdate = false;
                const perf2 = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates progress coords");
                let totalDistance = 0;
                const len = (points.length - 3) / 3;

                for (let i = 0; i < len; i++)
                {
                    const ofc3 = (off + count) / 3;
                    const idx3 = i * 3;
                    const idx31 = (i + 1) * 3;

                    this.#pointsProgress[ofc3 + 1] =
                        this.#pointsProgress[ofc3 + 3] =
                        this.#pointsProgress[ofc3 + 4] = totalDistance;

                    if (
                        !isNaN(points[idx3 + 0]) &&
                        !isNaN(points[idx3 + 1]) &&
                        !isNaN(points[idx31 + 0]) &&
                        !isNaN(points[idx31 + 1])
                    )
                    {
                        const d = this._dist(points[idx3 + 0], points[idx3 + 1], points[idx31 + 0], points[idx31 + 1]);
                        if (d != d)
                        {
                            // console.log(points[idx3 + 0], points[idx3 + 1], points[idx31 + 0], points[idx31 + 1]);
                            points[idx3 + 0] = points[idx3 + 1] = points[idx31 + 0] = points[idx31 + 1] = 0;
                        }
                        if (d)totalDistance += d;
                    }

                    this.#pointsProgress[ofc3 + 0] = totalDistance;
                    this.#pointsProgress[ofc3 + 2] = totalDistance;
                    this.#pointsProgress[ofc3 + 5] = totalDistance;

                    count += 6 * 3;
                }

                for (let i = 0; i < this.#pointsProgress.length; i++)
                    this.#pointsSplineLength[i] = totalDistance;

                perf2.finish();
            }
        }

        const perf4 = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates color values");

        count = 0;
        for (let i = 0; i < points.length / 3; i++)
        {
            for (let j = 0; j < 6; j++)
            {
                const idxArr = (off + count) / 3;
                const idxArr4 = idxArr * 4;
                this.#speeds[idxArr + 0] = this.#splines[idx].speed;

                this._colors[idxArr4 + 0] = this.#splines[idx].color[0];
                this._colors[idxArr4 + 1] = this.#splines[idx].color[1];
                this._colors[idxArr4 + 2] = this.#splines[idx].color[2];
                this._colors[idxArr4 + 3] = this.#splines[idx].color[3];

                this._colorsInactive[idxArr4 + 0] = this.#splines[idx].colorInactive[0];
                this._colorsInactive[idxArr4 + 1] = this.#splines[idx].colorInactive[1];
                this._colorsInactive[idxArr4 + 2] = this.#splines[idx].colorInactive[2];
                this._colorsInactive[idxArr4 + 3] = this.#splines[idx].colorInactive[3];

                this._colorsBorder[idxArr4 + 0] = this.#splines[idx].colorBorder[0];
                this._colorsBorder[idxArr4 + 1] = this.#splines[idx].colorBorder[1];
                this._colorsBorder[idxArr4 + 2] = this.#splines[idx].colorBorder[2];
                this._colorsBorder[idxArr4 + 3] = this.#splines[idx].colorBorder[3];

                for (let k = 0; k < 3; k++)
                {
                    this.#points[off + count] = points[(Math.max(0, i - 1)) * 3 + k];
                    this.#points2[off + count] = points[(i + 0) * 3 + k];
                    this.#points3[off + count] = points[(i + 1) * 3 + k];
                    count++;
                }
            }
        }
        perf4.finish();

        const perf3 = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates setAttributeRanges");

        if (updateWhat === undefined || updateWhat.colors) this.#mesh.setAttributeRange(this.#mesh.getAttribute("vcolor"), this._colors, (off / 3) * 4, ((off + count) / 3) * 4);
        if (updateWhat === undefined || updateWhat.colorsInactive) this.#mesh.setAttributeRange(this.#mesh.getAttribute("vcolorInactive"), this._colorsInactive, (off / 3) * 4, ((off + count) / 3) * 4);
        if (updateWhat === undefined || updateWhat.colorsBorder) this.#mesh.setAttributeRange(this.#mesh.getAttribute("vcolorBorder"), this._colorsBorder, (off / 3) * 4, ((off + count) / 3) * 4);

        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("spline"), this.#points, off, off + count);
        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("spline2"), this.#points2, off, off + count);
        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("spline3"), this.#points3, off, off + count);

        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("splineProgress"), this.#pointsProgress, off / 3, (off + count) / 3);
        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("splineLength"), this.#pointsSplineLength, off / 3, (off + count) / 3);
        if (updateWhat === undefined || updateWhat.speed) this.#mesh.setAttributeRange(this.#mesh.getAttribute("speed"), this.#speeds, off / 3, ((off + count) / 3));
        perf3.finish();
        perf.finish();
    }

    rebuild()
    {
        if (this.#splines.length == 0) return;
        this.#rebuildReason = "unknown";
        this.#splineIndex = [];
        let count = 0;
        let numPoints = 0;

        this.#thePoints = []; // todo calc length beforehand

        const perf = gui.uiProfiler.start("[glspline] rebuild " + this.name);

        for (let i = 0; i < this.#splines.length; i++)
        {
            const spline = this.#splines[i];
            if (!spline)
            {
                console.log("no spline", this.#splines);
                return;
            }

            if (spline.startOffset != count * 6 || this.#splineIndex[numPoints] != i)
            {
                spline.startOffset = count * 6;
                spline.pointsNeedProgressUpdate = true;
            }

            if (spline.points)
                for (let j = 0; j < spline.points.length / 3; j++)
                {
                    const j3 = j * 3;
                    this.#thePoints[count++] = spline.points[j3 + 0];
                    this.#thePoints[count++] = spline.points[j3 + 1];
                    this.#thePoints[count++] = spline.points[j3 + 2];
                    this.#splineIndex[numPoints] = i;

                    numPoints++;
                }
        }

        if (this.#thePoints.length === 0) return;

        let newLength = numPoints * 3 * 6;

        this.buildMesh();

        newLength = this.#verts.length / 6 * 6;

        if (newLength == 0) return;

        count = 0;
        let lastIndex = 0;
        let drawable = 0;

        if (this.#points.length < newLength)
        {
            this._colors = new Float32Array(newLength / 3 * 4);
            this._colorsInactive = new Float32Array(newLength / 3 * 4);
            this._colorsBorder = new Float32Array(newLength / 3 * 4);

            this.#points = new Float32Array(newLength);
            this.#points2 = new Float32Array(newLength);
            this.#points3 = new Float32Array(newLength);

            this.#doDraw = new Float32Array(newLength / 3);
            this.#pointsProgress = new Float32Array(newLength / 3);
            this.#pointsSplineLength = new Float32Array(newLength / 3);
            this.#speeds = new Float32Array(newLength / 3);
        }

        for (let i = 0; i < this.#thePoints.length / 3; i++)
        {
            if (this.#splineIndex)
            {

                if (i > 1 && lastIndex != this.#splineIndex[i]) drawable = 0.0;
                else drawable = 1.0;
                lastIndex = this.#splineIndex[i];
            }
            else drawable = 1.0;

            for (let j = 0; j < 6; j++)
            {
                this.#doDraw[count / 3] = drawable;

                if (this.#splines[this.#splineIndex[i]])
                {
                    this.#speeds[count / 3] = this.#splines[this.#splineIndex[i]].speed;
                }
                else this.#speeds[count / 3] = 0;

                for (let k = 0; k < 3; k++)
                {
                    count++;
                }
            }
            // console.log(this._splines[this._splineIndex[i]], this._splineIndex[i]);
        }

        const perfAttribs = gui.uiProfiler.start("[glspline] rebuild set Attribs");

        this.#mesh.setAttribute("speed", this.#speeds, 1);

        this.#mesh.setAttribute("splineDoDraw", this.#doDraw, 1);

        this.#mesh.setAttribute("vcolor", this._colors, 4);
        this.#mesh.setAttribute("vcolorInactive", this._colorsInactive, 4);
        this.#mesh.setAttribute("vcolorBorder", this._colorsBorder, 4);

        this.#mesh.setAttribute("spline", this.#points, 3);
        this.#mesh.setAttribute("spline2", this.#points2, 3);
        this.#mesh.setAttribute("spline3", this.#points3, 3);
        this.#mesh.setAttribute("splineProgress", this.#pointsProgress, 1);
        this.#mesh.setAttribute("splineLength", this.#pointsSplineLength, 1);

        perfAttribs.finish(this.#splines.length + "splines, length " + newLength);

        const perfAttribs2 = gui.uiProfiler.start("[glspline] rebuild _updateAttribsCoordinates");

        for (let i = 0; i < this.#splines.length; i++)
        {

            this._updateAttribsCoordinates(this.#splines[i].index);
        }

        perfAttribs2.finish("num" + this.#splines.length);

        this.#rebuildLater = 0;
        perf.finish();

        let l = 0;
        for (let i = 0; i < this.#splines.length; i++)
        {
            if (this.#splines[i].points)
                l += this.#splines[i].points.length / 3;
        }
    }

    /**
     * @param {string} [str]
     */
    rebuildLater(str)
    {
        if (!this.#rebuildLater)
        {
            this.#rebuildLater = performance.now();
            this.#rebuildReason = str;
        }
    }

    /**
     * @param {number} a
     * @param {number} b
     * @param {number} p
     */
    ip(a, b, p)
    {
        return a + p * (b - a);
    }

    /**
     * @param {string | any[]} oldArr
     */
    tessEdges(oldArr)
    {
        if (!oldArr) return;
        let count = 0;

        let step = 0.001;
        if (!userSettings.get("straightLines")) step = 0.01;
        const oneMinusStep = 1 - step;
        const l = oldArr.length * 3 - 3;

        if (!l || l < 0) return;

        const perf = gui.uiProfiler.start("[glspline] tessEdges");

        this._arrEdges = [];
        this._arrEdges.length = l;

        for (let i = 0; i < oldArr.length - 3; i += 3)
        {
            this._arrEdges[count++] = oldArr[i + 0];
            this._arrEdges[count++] = oldArr[i + 1];
            this._arrEdges[count++] = oldArr[i + 2];

            this._arrEdges[count++] = this.ip(oldArr[i + 0], oldArr[i + 3], step);
            this._arrEdges[count++] = this.ip(oldArr[i + 1], oldArr[i + 4], step);
            this._arrEdges[count++] = this.ip(oldArr[i + 2], oldArr[i + 5], step);

            this._arrEdges[count++] = this.ip(oldArr[i + 0], oldArr[i + 3], oneMinusStep);
            this._arrEdges[count++] = this.ip(oldArr[i + 1], oldArr[i + 4], oneMinusStep);
            this._arrEdges[count++] = this.ip(oldArr[i + 2], oldArr[i + 5], oneMinusStep);
        }

        perf.finish();

        return this._arrEdges;
    }

    dispose()
    {
        if (this.#mesh) this.#mesh.dispose();
        return null;
    }
}
