import userSettings from "../components/usersettings";

import srcShaderGlSplineDrawerFrag from "./glsplinedrawer_glsl.frag";
import srcShaderGlSplineDrawerVert from "./glsplinedrawer_glsl.vert";

export default class GlSplineDrawer
{
    constructor(cgl, name)
    {
        this.name = name;
        this._cgl = cgl;
        this._count = -1;

        this._rebuildLater = true;
        this._mesh = null;
        this._verts = new Float32Array();

        this._geom = new CGL.Geometry("GlSplineDrawer_" + name);
        this._pointsProgress = new Float32Array();
        this._pointsSplineLength = new Float32Array();
        this._points = new Float32Array();
        this._points2 = new Float32Array();
        this._points3 = new Float32Array();
        this._doDraw = new Float32Array();
        this._speeds = new Float32Array();
        this._thePoints = [];

        this._splineIndex = null;
        this._rebuildReason = "";

        this._splineHidden = [];
        this._splineColors = [];
        this._splines =
            [
                // {
                //     points:[],
                //     colors:[],
                //     speed: 123
                // }
            ];

        this._shader = new CGL.Shader(cgl, "glSplineDrawer " + name);
        this._shader.setSource(srcShaderGlSplineDrawerVert, srcShaderGlSplineDrawerFrag);

        this._uniTime = new CGL.Uniform(this._shader, "f", "time", 0);
        this._uniZoom = new CGL.Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new CGL.Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new CGL.Uniform(this._shader, "f", "resY", 0);
        this._uniZpos = new CGL.Uniform(this._shader, "f", "zpos", 0.96);
        this._uniscrollX = new CGL.Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new CGL.Uniform(this._shader, "f", "scrollY", 0);
        this._uniWidth = new CGL.Uniform(this._shader, "f", "width", gui.theme.patch.cablesWidth || 3);
        this._uniWidthSelected = new CGL.Uniform(this._shader, "f", "widthSelected", gui.theme.patch.cablesWidthSelected || 3);



        this._uniFadeoutOptions = new CGL.Uniform(this._shader, "4f", "fadeOutOptions", [50.0, 40.0, 0.0, 0.2]);

        this._uniMousePos = new CGL.Uniform(this._shader, "2f", "mousePos");

        this._shader.toggleDefine("FADEOUT", !userSettings.get("fadeOutOptions"));

        userSettings.on("change", (which, val) =>
        {
            if (which == "noFadeOutCables") this._shader.toggleDefine("FADEOUT", !val);
        });

        gui.on("themeChanged", () =>
        {
            this._uniWidth.set(gui.theme.patch.cablesWidth || 3);
            this._uniWidthSelected.set(gui.theme.patch.cablesWidthSelected || 3);
            this._uniFadeoutOptions.set([gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity]);
        });
    }

    set zPos(v)
    {
        this._uniZpos.setValue(v);
    }

    render(resX, resY, scrollX, scrollY, zoom, mouseX, mouseY)
    {
        if (this._splines.length == 0) return;

        // if (this._count < 2) return;

        if (mouseX)
        {
            // this._uniMousePos.setValue([mouseX, resY - mouseY]);
            // console.log(mouseX, mouseY);
        }

        if (this._mesh)
        {
            this._cgl.pushShader(this._shader);
            this._uniResX.set(resX);
            this._uniResY.set(resY);
            this._uniscrollX.set(scrollX);
            this._uniscrollY.set(scrollY);
            this._uniZoom.set(1.0 / zoom);
            this._uniTime.set(performance.now() / 1000);

            const fadeOutOpts = [gui.theme.patch.fadeOutDistStart, gui.theme.patch.fadeOutFadeDist, 0.0, gui.theme.patch.fadeOutFadeOpacity];
            if (zoom > 1400)fadeOutOpts[3] = CABLES.map(zoom, 1400, 2700, gui.theme.patch.fadeOutFadeOpacity, 1.0);


            this._uniFadeoutOptions.set(fadeOutOpts);


            // this._cgl.pushDepthTest(true);
            // this._cgl.pushDepthWrite(true);
            // this._cgl.pushDepthFunc(this._cgl.gl.GREATER);

            // console.log("PL!", this._points.length);
            if (this._points.length > 0)
                this._mesh.render(this._shader);
            this._cgl.popShader();

            // this._cgl.popDepthTest();
            // this._cgl.popDepthWrite();
            // this._cgl.popDepthFunc();
        }

        // todo move before rendering but will not draw when rebuilding...
        if (this._rebuildLater)
        {
            // clearTimeout(this._laterTimeout);
            // this._laterTimeout=setTimeout(
            //     () =>
            //     {
                    this.rebuild();
            // },20);
            // this._rebuildLater = false;

        }
    }

    getSplineIndex()
    {
        this._count++;
        this._splines[this._count] =
        {
            "points": [],
            "color": [1, 0, 0, 1],
            "colorInactive": [0, 1, 0, 1],
            "colorBorder": [0, 0, 0, 0],
            "speed": 1,
            "index": this._count,
            "hidden": false
        };

        // console.log("get new spline");
        this._rebuildLater = true;
        this._rebuildReason="new spline...";

        return this._count;
    }

    _float32Diff(a, b)
    {
        return Math.abs(a - b) > 0.0001;
    }

    setDebugRenderer(i)
    {
        this._shader.toggleDefine("DEBUG_1", i == 1);
        this._shader.toggleDefine("DEBUG_2", i == 2);
    }

    setSplineSpeed(idx, speed)
    {
        if (this._splines[idx].speed != speed)
        {
            // console.log(this._splines[idx].speed, speed);

            this._splines[idx].speed = speed;
            this._updateAttribsSpeed(idx);
            // this._rebuildLater = true;
        }
    }

    setSplineColorInactive(idx, rgba)
    {

        if (
            this._float32Diff(this._splines[idx].colorInactive[0], rgba[0]) ||
            this._float32Diff(this._splines[idx].colorInactive[1], rgba[1]) ||
            this._float32Diff(this._splines[idx].colorInactive[2], rgba[2]) ||
            this._float32Diff(this._splines[idx].colorInactive[3], rgba[3]))
        {
            this._splines[idx].colorInactive = rgba;
            // this._rebuildLater = true;
            this._updateAttribsCoordinates(idx, { "colorsInactive": true });
        }
    }

    setSplineColorBorder(idx, rgba)
    {
        if (
            this._float32Diff(this._splines[idx].colorBorder[0], rgba[0]) ||
            this._float32Diff(this._splines[idx].colorBorder[1], rgba[1]) ||
            this._float32Diff(this._splines[idx].colorBorder[2], rgba[2]) ||
            this._float32Diff(this._splines[idx].colorBorder[3], rgba[3]))
        {
            this._splines[idx].colorBorder = rgba;
            // this._rebuildLater = true;
            this._updateAttribsCoordinates(idx, { "colorsBorder": true });
        }
    }

    setSplineColor(idx, rgba)
    {
        if (
            this._float32Diff(this._splines[idx].color[0], rgba[0]) ||
            this._float32Diff(this._splines[idx].color[1], rgba[1]) ||
            this._float32Diff(this._splines[idx].color[2], rgba[2]) ||
            this._float32Diff(this._splines[idx].color[3], rgba[3]))
        {
            this._splines[idx].color = rgba;
            // this._rebuildLater = true;
            this._updateAttribsCoordinates(idx, { "colors": true });
        }
    }

    deleteSpline(idx)
    {
        const sp = this._splines[idx];

        this.setSplineColor(idx, [0, 0, 0, 0]);
        // this._rebuildLater = true;

        if (this._splines[idx].origPoints)
            for (let i = 0; i < this._splines[idx].origPoints.length; i += 3)
            {
                this._splines[idx].origPoints[i + 0] =
                this._splines[idx].origPoints[i + 1] =
                this._splines[idx].origPoints[i + 2] = 0;
            }

        this.setSpline(idx, this._splines[idx].origPoints);
    }


    showSpline(idx)
    {
        this._splines[idx].hidden = false;
    }

    hideSpline(idx)
    {
        this._splines[idx].hidden = true;
        if (this._splines[idx].points) for (let i = 0; i < this._splines[idx].points.length; i++) this._splines[idx].points[i] = 0;
        this._updateAttribsCoordinates(idx);
    }

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
                }
                else
                if (points.length > this._splines[idx].origPoints.length)
                {
                    // length of spline changed, we need to rebuild the whole buffer....
                    isDifferent = true;
                    isDifferentLength = true;

                    // console.log("spline length changed...", points.length, this._splines[idx].origPoints.length);
                    this._rebuildLater = true;
                    this._rebuildReason = "length of spline changed " + points.length + " vs " + this._splines[idx].origPoints.length;
                }
                else
                {
                    for (let i = 0; i < this._splines[idx].origPoints.length; i++)
                    {
                        if (this._splines[idx].origPoints[i] != points[i])
                        {
                            isDifferent = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!isDifferent) return; // nothing has changed...

        // if (points.length == 6)points.push(points[3], points[4], points[5]);

        this._splines[idx].origPoints = points;
        this._splines[idx].points = this.tessEdges(points);
        this._splines[idx].pointsNeedProgressUpdate = true;


        if (!isDifferentLength) // length is the same, update vertices only
        {
            // this._rebuildLater = true;

            this._updateAttribsCoordinates(idx);

            // setAttributeRange(attr, array, start, end)
        }
    }

    setWidth(w)
    {
        this._uniWidth.set(w * 10);
    }

    buildMesh()
    {
        const perf = CABLES.UI.uiProfiler.start("[glspline] buildMesh");


        const num = this._thePoints.length / 3;

        // console.log(this._verts.length / 3, num, this._thePoints.length / 3);
        // console.log("verlen", this._verts.length, num * 18);

        if (this._verts.length != num * 18)
        {
            this._verts = new Float32Array(num * 18);
            // console.log("resize spline!");
        }

        const max = 1;
        const min = -max;

        for (let i = 0; i < this._thePoints.length / 3; i++)
        {
            this._verts.set([
                max, min, 0,
                0, min, 0,
                max, max, 0,
                0, min, 0,
                0, max, 0,
                max, max, 0],
            i * 18);
        }
        this._geom.vertices = this._verts;


        if (!this._mesh) this._mesh = new CGL.Mesh(this._cgl, this._geom);

        // this._mesh.setAttribute("attrVertNormal", new Float32Array(this._verts.length), 3);
        // this._mesh.setAttribute("attrTexCoord", new Float32Array(this._verts.length / 3 * 2), 2);

        this._mesh.addVertexNumbers = false;
        this._mesh.updateVertices(this._geom);

        perf.finish();

        // console.log("verlen2", this._verts.length / 6, this._thePoints.length);
    }

    _updateAttribsSpeed(idx)
    {
        if (!this._mesh)
        {
            this._rebuildLater = true;
            this._rebuildReason = "update speed";

            return;
        }

        let count = 0;
        const off = this._splines[idx].startOffset || 0;
        const points = this._splines[idx].points;

        if (!points) return;

        // this._splines[idx].speed = this._splines[idx].speed;

        for (let i = 0; i < points.length / 3; i++)
        {
            for (let j = 0; j < 6; j++)
            {
                for (let k = 0; k < 3; k++)
                {
                    count++;
                }
                this._speeds[(off + count) / 3] = this._splines[idx].speed;
            }
        }

        // console.log("this._speeds", this._speeds);
        this._mesh.setAttributeRange(this._mesh.getAttribute("speed"), this._speeds, off / 3, ((off + count) / 3));
    }


    _updateAttribsCoordinates(idx, updateWhat)
    {
        if (!gui.patchView._patchRenderer) return;
        if (gui.patchView._patchRenderer.debugData)gui.patchView._patchRenderer.debugData.splineUpdate++;

        if (!this._mesh || !this._colors)
        {
            this._rebuildReason="no mesh/colors";
            this._rebuildLater = true;
            return;
        }

        let count = 0;

        const off = this._splines[idx].startOffset || 0;
        const points = this._splines[idx].points;

        if (!points) return;


// console.log("what",updateWhat,idx)
// CABLES.logStack();

        const perf = CABLES.UI.uiProfiler.start("[glspline] _updateAttribsCoordinates");

        function dist(x1, y1, x2, y2)
        {
            const xd = x2 - x1;
            const yd = y2 - y1;
            return Math.sqrt(xd * xd + yd * yd);
        }


        if (updateWhat === undefined)
        {
            if(this._splines[idx].pointsNeedProgressUpdate)
            {
                this._splines[idx].pointsNeedProgressUpdate=false;
                const perf2 = CABLES.UI.uiProfiler.start("[glspline] _updateAttribsCoordinates progress coords");
                let totalDistance = 0;
                const len = (points.length - 3) / 3;
                for (let i = 0; i < len; i++)
                {
                    this._pointsProgress[(off + count) / 3 + 1] = totalDistance;
                    this._pointsProgress[(off + count) / 3 + 3] = totalDistance;
                    this._pointsProgress[(off + count) / 3 + 4] = totalDistance;

                    const idx3 = i * 3;
                    const idx31 = (i + 1) * 3;

                    if (
                        !isNaN(points[idx3 + 0]) &&
                    !isNaN(points[idx3 + 1]) &&
                    !isNaN(points[idx31 + 0]) &&
                    !isNaN(points[idx31 + 1])
                    )
                    {
                        const d = dist(points[idx3 + 0], points[idx3 + 1], points[idx31 + 0], points[idx31 + 1]);
                        if (d != d)console.log(points[idx3 + 0], points[idx3 + 1], points[idx31 + 0], points[idx31 + 1]);
                        if (d)totalDistance += d;
                    }


                    this._pointsProgress[(off + count) / 3 + 0] = totalDistance;
                    this._pointsProgress[(off + count) / 3 + 2] = totalDistance;
                    this._pointsProgress[(off + count) / 3 + 5] = totalDistance;

                    for (let j = 0; j < 6; j++)
                        for (let k = 0; k < 3; k++)
                            count++;
                }

                // if (this._pointsSplineLength.length != this._pointsProgress.length)console.log("wrong length?!");
                for (let i = 0; i < this._pointsProgress.length; i++)
                    this._pointsSplineLength[i] = totalDistance;

                perf2.finish();
            }

        }

        const perf4 = CABLES.UI.uiProfiler.start("[glspline] _updateAttribsCoordinates color values");

        count = 0;
        for (let i = 0; i < points.length / 3; i++)
        {
            for (let j = 0; j < 6; j++)
            {
                const idxArr = (off + count) / 3;
                const idxArr4 = idxArr * 4;
                this._speeds[idxArr + 0] = this._splines[idx].speed;

                this._colors[idxArr4 + 0] = this._splines[idx].color[0];
                this._colors[idxArr4 + 1] = this._splines[idx].color[1];
                this._colors[idxArr4 + 2] = this._splines[idx].color[2];
                this._colors[idxArr4 + 3] = this._splines[idx].color[3];

                this._colorsInactive[idxArr4 + 0] = this._splines[idx].colorInactive[0];
                this._colorsInactive[idxArr4 + 1] = this._splines[idx].colorInactive[1];
                this._colorsInactive[idxArr4 + 2] = this._splines[idx].colorInactive[2];
                this._colorsInactive[idxArr4 + 3] = this._splines[idx].colorInactive[3];

                this._colorsBorder[idxArr4 + 0] = this._splines[idx].colorBorder[0];
                this._colorsBorder[idxArr4 + 1] = this._splines[idx].colorBorder[1];
                this._colorsBorder[idxArr4 + 2] = this._splines[idx].colorBorder[2];
                this._colorsBorder[idxArr4 + 3] = this._splines[idx].colorBorder[3];

                for (let k = 0; k < 3; k++)
                {
                    this._points[off + count] = points[(Math.max(0, i - 1)) * 3 + k];
                    this._points2[off + count] = points[(i + 0) * 3 + k];
                    this._points3[off + count] = points[(i + 1) * 3 + k];
                    count++;
                }
            }
        }
        perf4.finish();

        const perf3 = CABLES.UI.uiProfiler.start("[glspline] _updateAttribsCoordinates setAttributeRanges");

        if (updateWhat === undefined || updateWhat.colors) this._mesh.setAttributeRange(this._mesh.getAttribute("vcolor"), this._colors, (off / 3) * 4, ((off + count) / 3) * 4);
        if (updateWhat === undefined || updateWhat.colorsInactive) this._mesh.setAttributeRange(this._mesh.getAttribute("vcolorInactive"), this._colorsInactive, (off / 3) * 4, ((off + count) / 3) * 4);
        if (updateWhat === undefined || updateWhat.colorsBorder) this._mesh.setAttributeRange(this._mesh.getAttribute("vcolorBorder"), this._colorsBorder, (off / 3) * 4, ((off + count) / 3) * 4);

        if (updateWhat === undefined) this._mesh.setAttributeRange(this._mesh.getAttribute("spline"), this._points, off, off + count);
        if (updateWhat === undefined) this._mesh.setAttributeRange(this._mesh.getAttribute("spline2"), this._points2, off, off + count);
        if (updateWhat === undefined) this._mesh.setAttributeRange(this._mesh.getAttribute("spline3"), this._points3, off, off + count);

        if (updateWhat === undefined) this._mesh.setAttributeRange(this._mesh.getAttribute("splineProgress"), this._pointsProgress, off / 3, (off + count) / 3);
        if (updateWhat === undefined) this._mesh.setAttributeRange(this._mesh.getAttribute("splineLength"), this._pointsSplineLength, off / 3, (off + count) / 3);
        if (updateWhat === undefined || updateWhat.speed) this._mesh.setAttributeRange(this._mesh.getAttribute("speed"), this._speeds, off / 3, ((off + count) / 3));
        perf3.finish();
        perf.finish();
    }

    rebuild()
    {
        if (this._splines.length == 0) return;
// console.log("this._rebuildReason",this._rebuildReason)
        this._rebuildReason = "unknown";
        this._splineIndex = [];
        let count = 0;
        let numPoints = 0;

        const perf = CABLES.UI.uiProfiler.start("[glspline] rebuild");

        for (let i = 0; i < this._splines.length; i++)
        {
            this._splines[i].startOffset = count * 6;

            if (this._splines[i].points)
                for (let j = 0; j < this._splines[i].points.length / 3; j++)
                {
                    this._splineIndex[numPoints] = i;
                    this._thePoints[count++] = this._splines[i].points[j * 3 + 0];
                    this._thePoints[count++] = this._splines[i].points[j * 3 + 1];
                    this._thePoints[count++] = this._splines[i].points[j * 3 + 2];

                    numPoints++;
                }
        }


        if (this._thePoints.length === 0) return;

        let newLength = numPoints * 3 * 6;

        this.buildMesh();

        newLength = this._verts.length / 6 * 6;

        if (newLength == 0) return;

        count = 0;
        let lastIndex = 0;
        let drawable = 0;


        // console.log("LENGTH", this._thePoints.length, newLength / 6);

        if (this._points.length != newLength)
        {
            this._colors = new Float32Array(newLength / 3 * 4);
            this._colorsInactive = new Float32Array(newLength / 3 * 4);
            this._colorsBorder = new Float32Array(newLength / 3 * 4);

            this._points = new Float32Array(newLength);
            this._points2 = new Float32Array(newLength);
            this._points3 = new Float32Array(newLength);

            this._doDraw = new Float32Array(newLength / 3);
            this._pointsProgress = new Float32Array(newLength / 3);
            this._pointsSplineLength = new Float32Array(newLength / 3);
            this._speeds = new Float32Array(newLength / 3);
        }


        for (let i = 0; i < this._thePoints.length / 3; i++)
        {
            if (this._splineIndex)
            {
                // if (lastIndex != this._splineIndex[i])
                // {
                // this._splines[this._splineIndex[i]] = this._splines[this._splineIndex[i]] || {};
                // this._splines[this._splineIndex[i]].startOffset = count;
                // }

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

                    // this._colors[count / 3 * 4 + 0] = 1.0;// this._splines[this._splineIndex[i]].color[0];
                    // this._colors[count / 3 * 4 + 1] = 1.0;// this._splines[this._splineIndex[i]].color[1];
                    // this._colors[count / 3 * 4 + 2] = 1.0;// this._splines[this._splineIndex[i]].color[2];
                    // this._colors[count / 3 * 4 + 3] = 1.0;// this._splines[this._splineIndex[i]].color[3];
                }
                else this._speeds[count / 3] = 0;

                for (let k = 0; k < 3; k++)
                {
                    // this._points[count] = this._thePoints[(Math.max(0, i - 1)) * 3 + k];
                    // this._points2[count] = this._thePoints[(i + 0) * 3 + k];
                    // this._points3[count] = this._thePoints[(i + 1) * 3 + k];
                    count++;
                }
            }
            // console.log(this._splines[this._splineIndex[i]], this._splineIndex[i]);
        }


        const perfAttribs = CABLES.UI.uiProfiler.start("[glspline] rebuild set Attribs");

        this._mesh.setAttribute("speed", this._speeds, 1);

        this._mesh.setAttribute("splineDoDraw", this._doDraw, 1);

        this._mesh.setAttribute("vcolor", this._colors, 4);
        this._mesh.setAttribute("vcolorInactive", this._colorsInactive, 4);
        this._mesh.setAttribute("vcolorBorder", this._colorsBorder, 4);

        this._mesh.setAttribute("spline", this._points, 3);
        this._mesh.setAttribute("spline2", this._points2, 3);
        this._mesh.setAttribute("spline3", this._points3, 3);
        this._mesh.setAttribute("splineProgress", this._pointsProgress, 1);
        this._mesh.setAttribute("splineLength", this._pointsSplineLength, 1);

        perfAttribs.finish();

        const perfAttribs2 = CABLES.UI.uiProfiler.start("[glspline] rebuild _updateAttribsCoordinates");

        for (const i in this._splines)
            this._updateAttribsCoordinates(this._splines[i].index);

        perfAttribs2.finish();

        // const rows = [[
        //     "idx",
        //     "origPoints",
        //     "offset",
        //     "verts"]];


        // for (let i = 0; i < this._splines.length; i++)
        // {
        //     if (this._splines[i].points)
        //         rows.push([
        //             i,
        //             (this._splines[i].origPoints || []).length / 3,
        //             this._splines[i].startOffset / 3,
        //             this._splines[i].points.length / 3]);
        // }

        this._rebuildLater = false;
        perf.finish();
    }

    ip(a, b, p)
    {
        return a + p * (b - a);
    }

    tessEdges(oldArr)
    {
        if (!oldArr) return;
        let count = 0;

        let step = 0.001;
        if (!userSettings.get("straightLines")) step = 0.01;
        const oneMinusStep = 1 - step;
        const l = oldArr.length * 3 - 3;


        if (!l || l < 0) return;

        const perf = CABLES.UI.uiProfiler.start("[glspline] tessEdges");


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
}
