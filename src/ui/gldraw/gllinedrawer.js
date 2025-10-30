import { CgShader, Geometry, Mesh, Shader, Uniform } from "cables-corelibs";

import { utils } from "cables";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import { userSettings } from "../components/usersettings.js";
import { gui } from "../gui.js";
import GlCanvas from "./glcanvas.js";
import GlUiCanvas from "../glpatch/gluicanvas.js";

/**
 * draw splines, e.g. cables on the patchfield
 *
 */
export default class GlLineDrawer
{
    #geom;
    #cgl;
    #mesh;
    #verts;
    #thePoints;

    /**
     * @param {CglContext} cgl
     * @param {String} name
     */
    constructor(cgl, name)
    {
        this.name = name;
        this.#cgl = cgl;
        this._count = -1;

        this._rebuildLater = performance.now();
        this.doTessEdges = true;
        this.doCalcProgress = true;
        this.#mesh = null;
        this.#verts = new Float32Array();

        this.#geom = new Geometry("GlSplineDrawer_" + name);
        this._pointsProgress = new Float32Array();
        this._pointsSplineLength = new Float32Array();
        this._points = new Float32Array();
        this._doDraw = new Float32Array();
        this._speeds = new Float32Array();
        this.#thePoints = [];

        this._splineIndex = null;
        this._rebuildReason = "";

        this._splineHidden = [];
        this._splineColors = [];
        this._splines = [];

        this._shader = new Shader(cgl, "glSplineDrawer " + name);
        this._shader.setSource(Shader.getDefaultVertexShader(), Shader.getDefaultFragmentShader());
        this._shader.define("ZPOSDIV", GlUiCanvas.ZPOSDIV + ".0");

        this._uniTime = new Uniform(this._shader, "f", "time", 0);
        this._uniZoom = new Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new Uniform(this._shader, "f", "resY", 0);
        this._uniscrollX = new Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new Uniform(this._shader, "f", "scrollY", 0);
        this._uniWidth = new Uniform(this._shader, "f", "width", gui.theme.patch.cablesWidth || 3);
        this._uniWidthSelected = new Uniform(this._shader, "f", "widthSelected", gui.theme.patch.cablesWidthSelected || 3);

        this._uniFadeoutOptions = new Uniform(this._shader, "4f", "fadeOutOptions", [50.0, 40.0, 0.0, 0.2]);

        this._uniMousePos = new Uniform(this._shader, "2f", "mousePos");

        this._shader.toggleDefine("FADEOUT", !userSettings.get("fadeOutOptions"));
        this._shader.toggleDefine("DRAWSPEED", userSettings.get("glflowmode") != 0);

        userSettings.on("change", (which, val) =>
        {
            if (which == "noFadeOutCables") this._shader.toggleDefine("FADEOUT", !val);
            if (which == "glflowmode") this._shader.toggleDefine("DRAWSPEED", userSettings.get("glflowmode") != 0);
        });

        gui.on("themeChanged", () =>
        {
            this._uniWidth.set(gui.theme.patch.cablesWidth || 3);
            this._uniWidthSelected.set(gui.theme.patch.cablesWidthSelected || 3);
            this._uniFadeoutOptions.set([gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity]);
        });
    }

    /**
     * @param {boolean} b
     */
    setFadeout(b)
    {
        this._shader.toggleDefine("FADEOUT", b);
    }

    getNumSplines()
    {
        return this._splines.length;
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
        if (this._splines.length == 0) return;

        if (this._rebuildLater > 0)
        {
            if (performance.now() - this._rebuildLater > 30) this.rebuild();
            clearTimeout(this._laterTimeout);
            this._laterTimeout = setTimeout(
                () =>
                {
                    this.rebuild();
                    this._rebuildLater = 0;
                }, 30);
        }

        if (this.#mesh)
        {
            this.#cgl.pushShader(this._shader);

            this._uniResX.set(resX);
            this._uniResY.set(resY);
            this._uniscrollX.set(scrollX);
            this._uniscrollY.set(scrollY);
            this._uniZoom.set(1.0 / zoom);
            this._uniTime.set(performance.now() / 1000);

            const fadeOutOpts = [gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity];
            if (zoom > 1400)fadeOutOpts[3] = utils.map(zoom, 1400, 2700, gui.theme.patch.fadeOutFadeOpacity, 1.0);

            this._uniFadeoutOptions.set(fadeOutOpts);

            if (this._points.length > 0) this.#mesh.render(this._shader);
            this.#cgl.popShader();

        }
    }

    get count()
    {
        return this._count + 1;
    }

    getSplineIndex(name = "")
    {
        this._count++;
        this._splines[this._count] =
        {
            "name": name,
            "points": [],
            "color": [1, 0, 0, 1],
            "colorInactive": [0, 1, 0, 1],
            "colorBorder": [0, 0, 0, 0],
            "speed": 1,
            "index": this._count,
            "hidden": false,
            "pointsNeedProgressUpdate": true,
            "deleted": false
        };

        this.rebuildLater("new spline");

        return this._count;
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
        this._shader.toggleDefine("DEBUG_1", i == 1);
        this._shader.toggleDefine("DEBUG_2", i == 2);
    }

    /**
     * @param {number} idx
     * @param {any} speed
     */
    setSplineSpeed(idx, speed)
    {
        if (this._splines[idx].speed != speed)
        {
            this._splines[idx].speed = speed;
            this._updateAttribsSpeed(idx);
        }
    }

    /**
     * @param {number} idx
     * @param {number[]} rgba
     */
    setSplineColorInactive(idx, rgba)
    {
        if (
            this._float32Diff(this._splines[idx].colorInactive[0], rgba[0]) ||
            this._float32Diff(this._splines[idx].colorInactive[1], rgba[1]) ||
            this._float32Diff(this._splines[idx].colorInactive[2], rgba[2]) ||
            this._float32Diff(this._splines[idx].colorInactive[3], rgba[3]))
        {
            this._splines[idx].colorInactive = rgba;
            this._updateAttribsCoordinates(idx, { "colorsInactive": true });
        }
    }

    /**
     * @param {number} idx
     * @param {number[]} rgba
     */
    setSplineColor(idx, rgba)
    {
        if (
            this._float32Diff(this._splines[idx].color[0], rgba[0]) ||
            this._float32Diff(this._splines[idx].color[1], rgba[1]) ||
            this._float32Diff(this._splines[idx].color[2], rgba[2]) ||
            this._float32Diff(this._splines[idx].color[3], rgba[3]))
        {
            this._splines[idx].color = rgba;
            this._updateAttribsCoordinates(idx, { "colors": true });
        }
    }

    /**
     * @param {number} idx
     */
    deleteSpline(idx)
    {
        const sp = this._splines[idx];

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
        this._splines[idx].hidden = false;
    }

    /**
     * @param {number} idx
     */
    hideSpline(idx)
    {
        this._splines[idx].hidden = true;
        if (this._splines[idx].points) for (let i = 0; i < this._splines[idx].points.length; i++) this._splines[idx].points[i] = 0;
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

        if (!this._rebuildLater)
        {
            if (this._splines[idx] && this._splines[idx].origPoints)
            {
                isDifferent = false;

                if (this._splines[idx].hidden)
                {
                    isDifferent = true;
                    this._splines[idx].hidden = false;
                }
                else
                if (points.length < this._splines[idx].origPoints.length)
                {
                    // if new num of points is smaller than last one just draw last point multiple times and do not rebuild everything...
                    isDifferent = true;
                    for (let i = points.length / 3; i < this._splines[idx].origPoints.length / 3; i++)
                    {
                        points[i * 3] = points[i * 3];
                        points[i * 3 + 1] = points[i * 3 + 1];
                        points[i * 3 + 2] = points[i * 3 + 2];
                    }

                    this._splines[idx].pointsNeedProgressUpdate = true;
                }
                else
                if (points.length > this._splines[idx].origPoints.length)
                {
                    // length of spline changed, we need to rebuild the whole buffer....
                    isDifferent = true;
                    isDifferentLength = true;
                    this._splines[idx].pointsNeedProgressUpdate = true;
                    this.rebuildLater("length of spline changed " + points.length + " vs " + this._splines[idx].origPoints.length);
                }
                else
                {
                    for (let i = 0; i < this._splines[idx].origPoints.length; i++)
                    {
                        if (this._splines[idx].origPoints[i] != points[i])
                        {
                            isDifferent = true;
                            this._splines[idx].pointsNeedProgressUpdate = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!isDifferent) return; // nothing has changed...

        this._splines[idx].origPoints = points;

        this._splines[idx].points = points;

        this._splines[idx].pointsNeedProgressUpdate = true;

        if (!isDifferentLength) // length is the same, update vertices only
            this._updateAttribsCoordinates(idx);
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        this._uniWidth.set(w);
    }

    buildMesh()
    {
        const perf = gui.uiProfiler.start("[glspline] buildMesh");
        const num = this.#thePoints.length;
        if (this.#verts.length != num)
            this.#verts = new Float32Array(num);

        const max = 1;
        const min = -max;

        this.#verts.set(this.#thePoints);
        this.#geom.vertices = this.#verts;

        if (!this.#mesh) this.#mesh = new Mesh(this.#cgl, this.#geom);

        this.#mesh.addVertexNumbers = false;
        this.#mesh.updateVertices(this.#geom);

        perf.finish();
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
            return;
        }

        const off = this._splines[idx].startOffset || 0;
        const points = this._splines[idx].points;
        let count = 0;
        let title = "all";

        if (!points) return;

        if (updateWhat == undefined) title = "all";
        else title = Object.keys(updateWhat).join(".");

        const perf = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates " + title);

        if (updateWhat === undefined)
        {
            if (this.doCalcProgress && this._splines[idx].pointsNeedProgressUpdate)
            {
                this._splines[idx].pointsNeedProgressUpdate = false;
                const perf2 = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates progress coords");
                let totalDistance = 0;
                const len = (points.length - 3) / 3;

                for (let i = 0; i < len; i++)
                {
                    const ofc3 = (off + count) / 3;
                    const idx3 = i * 3;
                    const idx31 = (i + 1) * 3;

                    this._pointsProgress[ofc3 + 1] =
                        this._pointsProgress[ofc3 + 3] =
                        this._pointsProgress[ofc3 + 4] = totalDistance;

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

                    this._pointsProgress[ofc3 + 0] = totalDistance;
                    this._pointsProgress[ofc3 + 2] = totalDistance;
                    this._pointsProgress[ofc3 + 5] = totalDistance;

                    count += 6 * 3;
                }

                for (let i = 0; i < this._pointsProgress.length; i++)
                    this._pointsSplineLength[i] = totalDistance;

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

                this._colors[idxArr4 + 0] = this._splines[idx].color[0];
                this._colors[idxArr4 + 1] = this._splines[idx].color[1];
                this._colors[idxArr4 + 2] = this._splines[idx].color[2];
                this._colors[idxArr4 + 3] = this._splines[idx].color[3];

                this._colorsInactive[idxArr4 + 0] = this._splines[idx].colorInactive[0];
                this._colorsInactive[idxArr4 + 1] = this._splines[idx].colorInactive[1];
                this._colorsInactive[idxArr4 + 2] = this._splines[idx].colorInactive[2];
                this._colorsInactive[idxArr4 + 3] = this._splines[idx].colorInactive[3];

                for (let k = 0; k < 3; k++)
                {
                    this._points[off + count] = points[(Math.max(0, i - 1)) * 3 + k];
                    // this._points2[off + count] = points[(i + 0) * 3 + k];
                    // this._points3[off + count] = points[(i + 1) * 3 + k];
                    count++;
                }
            }
        }
        perf4.finish();

        const perf3 = gui.uiProfiler.start("[glspline] _updateAttribsCoordinates setAttributeRanges");

        if (updateWhat === undefined || updateWhat.colors) this.#mesh.setAttributeRange(this.#mesh.getAttribute("vcolor"), this._colors, (off / 3) * 4, ((off + count) / 3) * 4);
        // if (updateWhat === undefined || updateWhat.colorsInactive) this.#mesh.setAttributeRange(this.#mesh.getAttribute("vcolorInactive"), this._colorsInactive, (off / 3) * 4, ((off + count) / 3) * 4);
        // if (updateWhat === undefined || updateWhat.colorsBorder) this.#mesh.setAttributeRange(this.#mesh.getAttribute("vcolorBorder"), this._colorsBorder, (off / 3) * 4, ((off + count) / 3) * 4);

        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("spline"), this._points, off, off + count);
        // if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("spline2"), this._points2, off, off + count);
        // if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("spline3"), this._points3, off, off + count);

        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("splineProgress"), this._pointsProgress, off / 3, (off + count) / 3);
        if (updateWhat === undefined) this.#mesh.setAttributeRange(this.#mesh.getAttribute("splineLength"), this._pointsSplineLength, off / 3, (off + count) / 3);
        // if (updateWhat === undefined || updateWhat.speed) this.#mesh.setAttributeRange(this.#mesh.getAttribute("speed"), this._speeds, off / 3, ((off + count) / 3));
        perf3.finish();
        perf.finish();
    }

    rebuild()
    {
        if (this._splines.length == 0) return;
        this._rebuildReason = "unknown";
        this._splineIndex = [];
        let count = 0;
        let numPoints = 0;

        this.#thePoints = []; // todo calc length beforehand

        const perf = gui.uiProfiler.start("[glspline] rebuild " + this.name);

        for (let i = 0; i < this._splines.length; i++)
        {
            const spline = this._splines[i];
            if (spline.startOffset != count * 6 || this._splineIndex[numPoints] != i)
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
                    this._splineIndex[numPoints] = i;

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

        if (this._points.length < newLength)
        {
            this._colors = new Float32Array(newLength / 3 * 4);
            this._colorsInactive = new Float32Array(newLength / 3 * 4);
            this._colorsBorder = new Float32Array(newLength / 3 * 4);

            this._points = new Float32Array(newLength);
            // this._points2 = new Float32Array(newLength);
            // this._points3 = new Float32Array(newLength);

            this._doDraw = new Float32Array(newLength / 3);
            this._pointsProgress = new Float32Array(newLength / 3);
            this._pointsSplineLength = new Float32Array(newLength / 3);
            this._speeds = new Float32Array(newLength / 3);
        }

        for (let i = 0; i < this.#thePoints.length / 3; i++)
        {
            if (this._splineIndex)
            {

                if (i > 1 && lastIndex != this._splineIndex[i]) drawable = 0.0;
                else drawable = 1.0;
                lastIndex = this._splineIndex[i];
            }
            else drawable = 1.0;

            for (let j = 0; j < 6; j++)
            {
                this._doDraw[count / 3] = drawable;

                if (this._splines[this._splineIndex[i]])
                {
                    this._speeds[count / 3] = this._splines[this._splineIndex[i]].speed;
                }
                else this._speeds[count / 3] = 0;

                for (let k = 0; k < 3; k++)
                {
                    count++;
                }
            }
            // console.log(this._splines[this._splineIndex[i]], this._splineIndex[i]);
        }

        const perfAttribs = gui.uiProfiler.start("[glspline] rebuild set Attribs");

        this.#mesh.setAttribute("speed", this._speeds, 1);

        this.#mesh.setAttribute("splineDoDraw", this._doDraw, 1);

        this.#mesh.setAttribute("vcolor", this._colors, 4);
        this.#mesh.setAttribute("vcolorInactive", this._colorsInactive, 4);
        this.#mesh.setAttribute("vcolorBorder", this._colorsBorder, 4);

        this.#mesh.setAttribute("spline", this._points, 3);
        this.#mesh.setAttribute("spline2", this._points2, 3);
        this.#mesh.setAttribute("spline3", this._points3, 3);
        this.#mesh.setAttribute("splineProgress", this._pointsProgress, 1);
        this.#mesh.setAttribute("splineLength", this._pointsSplineLength, 1);

        perfAttribs.finish(this._splines.length + "splines, length " + newLength);

        const perfAttribs2 = gui.uiProfiler.start("[glspline] rebuild _updateAttribsCoordinates");

        for (let i = 0; i < this._splines.length; i++)
        {

            this._updateAttribsCoordinates(this._splines[i].index);
        }

        perfAttribs2.finish("num" + this._splines.length);

        this._rebuildLater = 0;
        perf.finish();

        let l = 0;
        for (let i = 0; i < this._splines.length; i++)
        {
            if (this._splines[i].points)
                l += this._splines[i].points.length / 3;
        }
    }

    /**
     * @param {string} [str]
     */
    rebuildLater(str)
    {
        if (!this._rebuildLater)
        {
            this._rebuildLater = performance.now();
            this._rebuildReason = str;
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

    dispose()
    {
        if (this.#mesh) this.#mesh.dispose();
    }
}
