var CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.SplineDrawer = class
{
    constructor(cgl, options)
    {
        this._cgl = cgl;
        this._count = -1;

        this._rebuildLater = true;
        this._mesh = null;
        this._verts = new Float32Array();

        this._geom = new CGL.Geometry("splinemesh2");
        this._pointsProgress = new Float32Array();
        this._points = new Float32Array();
        this._points2 = new Float32Array();
        this._points3 = new Float32Array();
        this._doDraw = new Float32Array();
        this._thePoints = [];

        this._splineIndex = null;

        this._splineColors = [];
        this._splines =
            [
                // {
                //     points:[],
                //     colors:[],
                //     speed: 123
                // }
            ];

        this._shader = new CGL.Shader(cgl, "Linedrawer");
        this._shader.setSource(""
            .endl() + "{{MODULES_HEAD}}"
            .endl() + "IN vec3 vPosition;"
            .endl() + "IN float attrVertIndex;"
            .endl() + "IN vec4 vcolor;"
            .endl() + "OUT vec4 fcolor;"

            .endl() + "IN float speed;"
            .endl() + "OUT float fspeed;"

            .endl() + "IN float splineProgress;"
            .endl() + "OUT float fProgress;"

            .endl() + "UNI float width;"
            .endl() + "UNI float zpos;"

            .endl() + "IN vec3 spline,spline2,spline3;"

            .endl() + "OUT vec2 texCoord;"
            .endl() + "OUT vec3 norm;"

            .endl() + "UNI float zoom,resX,resY,scrollX,scrollY;"


            .endl() + "float texOffset=0.0;"
            .endl() + "float sizeAtt=0.0;"

            .endl() + "#define PI 3.1415926538"
        // .endl() + "float aspect=1.7777;"

            .endl() + "vec2 rotate(vec2 v, float a)"
            .endl() + "{"
            .endl() + "    float s = sin(a);"
            .endl() + "    float c = cos(a);"
            .endl() + "    mat2 m = mat2(c, -s, s, c);"
            .endl() + "    return m * v;"
            .endl() + "}"
            .endl() + ""
            .endl() + "vec2 fix( vec4 i )"
            .endl() + "{"
            .endl() + "    vec2 res = i.xy / i.w;"
            .endl() + "    return res;"
            .endl() + "}"
            .endl() + ""
            .endl() + "void main()"
            .endl() + "{"

            .endl() + "    if(vcolor.a == 0.0)return; "

            .endl() + "    float aspect=resX/resY;"
            .endl() + "    fcolor=vcolor;"
            .endl() + "    fspeed=speed;"

            .endl() + "    texCoord=vPosition.xy;"
            .endl() + "    texCoord.y=texCoord.y*0.5+0.5;"
            .endl() + "    texCoord.x+=texOffset;"


            .endl() + "    vec4 pos=vec4(vPosition, 1.0);"

            .endl() + "    vec4 finalPosition  =  (vec4(spline2,1.0));"
            .endl() + "    vec4 finalPosition2 =  (vec4(spline3,1.0));"

            .endl() + "    vec2 screenPos =fix( vec4(spline,1.0));"
            .endl() + "    vec2 screenPos2=fix( vec4(spline2,1.0));"
            .endl() + "    vec2 screenPos3=fix( vec4(spline3,1.0));"

            .endl() + "    float wid=width*10.0;"
            .endl() + "    if(sizeAtt>0.0) //todo as define"
            .endl() + "        wid=width*finalPosition.w*0.5;"

            .endl() + "    vec2 dir1 = normalize( screenPos2 - screenPos );"
            .endl() + "    vec2 dir2 = normalize( screenPos3 - screenPos2 );"

            .endl() + "    if( screenPos2 == screenPos ) dir1 = normalize( screenPos3 - screenPos2 );"

            .endl() + "    vec2 normal = vec2( -dir1.y, dir1.x ) * 0.5 * wid;"
            .endl() + "    vec2 normal2 = vec2( -dir2.y, dir2.x ) * 0.5 * wid;"

            .endl() + "    float m=pos.x;"
            .endl() + "    vec4 offset = vec4( mix(normal,normal2,m) * (pos.y), 0.0, 1.0 );"

            .endl() + "    finalPosition = mix(finalPosition,finalPosition2,pos.x);"
            .endl() + "    fProgress=distance(finalPosition.xy+offset.xy+vec2(0.0,pos.y)+vec2(scrollX,scrollY)*-aspect,finalPosition2.xy+offset.xy+vec2(0.0,pos.y)+vec2(scrollX,scrollY)*-aspect);"

            .endl() + "    finalPosition.xy += offset.xy;"

            .endl() + "    finalPosition.y*=-aspect;"

            .endl() + "    finalPosition.xy*=zoom;"
            .endl() + "    finalPosition.x+=scrollX;"
            .endl() + "    finalPosition.y+=scrollY;"
            .endl() + "    finalPosition.z=zpos;"

            .endl() + "    gl_Position = finalPosition;"
            .endl() + "}"

            .endl() + "", ""

            .endl() + "IN vec2 texCoord;"
            .endl() + "IN vec4 fcolor;"
            .endl() + "IN float fProgress;"
            .endl() + "IN float fspeed;"

            .endl() + "UNI vec2 mousePos;"

            .endl() + "UNI float a;"
            .endl() + "UNI float time;"

            .endl() + "{{MODULES_HEAD}}"
            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    vec4 col=fcolor;"
            .endl() + "    float darken=1.0;"

            .endl() + "    float minOpacity=0.7;"

            .endl() + "    if(fspeed==0.0)darken=minOpacity;"
            .endl() + "    if(fspeed==1.0)darken=1.0;"
            .endl() + "    if(fspeed>=2.0)"
            .endl() + "    {"
            .endl() + "        darken=step(0.7,mod((-time*fspeed/2.0)+fProgress*0.1*(fspeed*0.1),1.0))+minOpacity; "
            .endl() + "        darken=clamp(darken,0.3,1.0);"
            .endl() + "    }"

            .endl() + "    {{MODULE_COLOR}}"
            .endl() + "    col.rgb*=darken;"
            .endl() + "    outColor = col;"
            .endl() + "}");

        this._uniTime = new CGL.Uniform(this._shader, "f", "time", 0);
        this._uniZoom = new CGL.Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new CGL.Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new CGL.Uniform(this._shader, "f", "resY", 0);
        this._uniZpos = new CGL.Uniform(this._shader, "f", "zpos", 0.96);
        this._uniscrollX = new CGL.Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new CGL.Uniform(this._shader, "f", "scrollY", 0);
        this._uniWidth = new CGL.Uniform(this._shader, "f", "width", 0.3);
        this._uniMousePos = new CGL.Uniform(this._shader, "2f", "mousePos");
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
            // console.log("yay");

            this.rebuild();
            // this._mesh.unBind();
        }
    }

    getSplineIndex()
    {
        this._count++;
        this._splines[this._count] =
        {
            "points": [],
            "color": [1, 1, 1, 1],
            "speed": 1,
            "index": this._count
        };

        this._rebuildLater = true;

        return this._count;
    }

    _float32Diff(a, b)
    {
        return Math.abs(a - b) > 0.0001;
    }

    setSplineSpeed(idx, speed)
    {
        if (this._splines[idx].speed != speed)
        {
            this._splines[idx].speed = speed;
            this._updateAttribsSpeed(idx);
            // this._rebuildLater = true;
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
            this._updateAttribsCoordinates(idx);
        }
    }

    deleteSpline(idx)
    {
        const sp = this._splines[idx];

        this.setSplineColor(idx, 0, 0, 0, 0);

        if (this._splines[idx].origPoints)
            for (let i = 0; i < this._splines[idx].origPoints.length; i += 3)
            {
                this._splines[idx].origPoints[i + 0] =
            this._splines[idx].origPoints[i + 1] =
            this._splines[idx].origPoints[i + 2] = 0;
            }
        this.setSpline(idx, this._splines[idx].origPoints);
    }

    setSpline(idx, points)
    {
        let isDifferent = true;
        let isDifferentLength = false;

        if (!this._rebuildLater)
        {
            if (this._splines[idx] && this._splines[idx].origPoints)
            {
                isDifferent = false;
                if (points.length != this._splines[idx].origPoints.length)
                {
                // length of spline changed, we need to rebuild the whole buffer....
                    isDifferent = true;
                    isDifferentLength = true;
                    this._rebuildLater = true;
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

        if (!isDifferentLength) // length is the same, update vertices only
        {
            // this._rebuildLater = true;

            this._updateAttribsCoordinates(idx);

            // setAttributeRange(attr, array, start, end)
        }
    }

    setWidth(w)
    {
        this._uniWidth.set(w);
    }

    buildMesh()
    {
        const num = this._thePoints.length / 3;
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

        this._mesh.addVertexNumbers = false;
        this._mesh.updateVertices(this._geom);
    }

    _updateAttribsSpeed(idx)
    {
        if (!this._mesh)
        {
            this._rebuildLater = true;
            return;
        }

        let count = 0;

        const off = this._splines[idx].startOffset || 0;
        const points = this._splines[idx].points;
        if (!points) return;

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


    _updateAttribsCoordinates(idx)
    {
        if (!this._mesh || !this._colors)
        {
            this._rebuildLater = true;
            return;
        }

        let count = 0;

        const off = this._splines[idx].startOffset || 0;
        const points = this._splines[idx].points;


        // if (!off)console.log(idx, this._splines[idx]);
        // console.log(points.length, off);
        if (!points) return;

        for (let i = 0; i < points.length / 3; i++)
        {
            for (let j = 0; j < 6; j++)
            {
                this._colors[(off + count) / 3 * 4 + 0] = this._splines[idx].color[0];
                this._colors[(off + count) / 3 * 4 + 1] = this._splines[idx].color[1];
                this._colors[(off + count) / 3 * 4 + 2] = this._splines[idx].color[2];
                this._colors[(off + count) / 3 * 4 + 3] = this._splines[idx].color[3];

                for (let k = 0; k < 3; k++)
                {
                    this._points[off + count] = points[(Math.max(0, i - 1)) * 3 + k];
                    this._points2[off + count] = points[(i + 0) * 3 + k];
                    this._points3[off + count] = points[(i + 1) * 3 + k];
                    count++;
                }
            }
        }

        this._mesh.setAttributeRange(this._mesh.getAttribute("vcolor"), this._colors, (off / 3) * 4, ((off + count) / 3) * 4);
        this._mesh.setAttributeRange(this._mesh.getAttribute("spline"), this._points, off, off + count);
        this._mesh.setAttributeRange(this._mesh.getAttribute("spline2"), this._points2, off, off + count);
        this._mesh.setAttributeRange(this._mesh.getAttribute("spline3"), this._points3, off, off + count);
    }

    rebuild()
    {
        if (this._splines.length == 0) return;

        // console.log("rebuild!");
        this._splineIndex = [];
        let count = 0;
        let numPoints = 0;

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
        this.buildMesh();

        const newLength = numPoints * 3 * 6;
        if (newLength == 0) return;

        count = 0;
        let lastIndex = 0;
        let drawable = 0;


        if (this._points.length != newLength)
        {
            this._colors = new Float32Array(newLength / 3 * 4);

            this._points = new Float32Array(newLength);
            this._points2 = new Float32Array(newLength);
            this._points3 = new Float32Array(newLength);

            this._doDraw = new Float32Array(newLength / 3);
            this._pointsProgress = new Float32Array(newLength / 3);
            this._speeds = new Float32Array(newLength / 3);

            for (let i = 0; i < newLength / 3; i++) this._pointsProgress[i] = i / (newLength / 3);
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


        this._mesh.setAttribute("speed", this._speeds, 1);
        this._mesh.setAttribute("splineDoDraw", this._doDraw, 1);

        this._mesh.setAttribute("vcolor", this._colors, 4);

        this._mesh.setAttribute("spline", this._points, 3);
        this._mesh.setAttribute("spline2", this._points2, 3);
        this._mesh.setAttribute("spline3", this._points3, 3);
        this._mesh.setAttribute("splineProgress", this._pointsProgress, 1);

        for (const i in this._splines)
        {
            // console.log("spl ", i);
            this._updateAttribsCoordinates(this._splines[i].index);
        }


        const rows = [[
            "idx",
            "origPoints",
            "offset",
            "verts"]];


        for (let i = 0; i < this._splines.length; i++)
        {
            if (this._splines[i].points)
                rows.push([
                    i,
                    (this._splines[i].origPoints || []).length / 3,
                    this._splines[i].startOffset / 3,
                    this._splines[i].points.length / 3]);
        }

        // console.table(rows);
        // console.log("this._points.length", this._points.length / 3 / 6);


        this._rebuildLater = false;
    }

    ip(a, b, p)
    {
        return a + p * (b - a);
    }

    tessEdges(oldArr)
    {
        if (!oldArr) return;
        let count = 0;
        const step = 0.003;
        const oneMinusStep = 1 - step;
        const l = oldArr.length * 3 - 3;


        if (!l || l < 0) return;
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

        return this._arrEdges;
    }
};
