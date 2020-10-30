var CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

// const cgl = op.patch.cgl;


// const pointsDoDraw = new Float32Array();


CABLES.GLGUI.SplineDrawer = class
{
    constructor(cgl, options)
    {
        this._cgl = cgl;

        this._rebuildLater = true;
        this._mesh = null;
        this._verts = [];

        this._geom = new CGL.Geometry("splinemesh2");
        this._pointsProgress = new Float32Array();
        this._points = new Float32Array();
        this._points2 = new Float32Array();
        this._points3 = new Float32Array();
        this._doDraw = new Float32Array();
        this._thePoints = [];
        this._arrEdges = [];
        this._splineIndex = null;

        this._splines =
            [[0, 100, 0, 100, 200, 0, 300, 100, 0, 0, 0, 0]];

        this._shader = new CGL.Shader(cgl, "Linedrawer");
        this._shader.setSource(""
            .endl() + "{{MODULES_HEAD}}"
            .endl() + "IN vec3 vPosition;"
            .endl() + "IN float attrVertIndex;"
            .endl() + "IN vec3 spline,spline2,spline3;"
            .endl() + "OUT float r;"

            .endl() + "OUT vec2 texCoord;"
            .endl() + "OUT vec3 norm;"

            .endl() + "UNI float zoom,resX,resY,scrollX,scrollY;"

            .endl() + "float width=1.0;"
            .endl() + "float texOffset=0.0;"
            .endl() + "float sizeAtt=0.0;"

            .endl() + "#define PI 3.1415926538"
            .endl() + "float aspect=1.7777;"

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
            .endl() + "    res.x *= aspect;"
            .endl() + "    return res;"
            .endl() + "}"
            .endl() + ""
            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    texCoord=vPosition.xy;"
            .endl() + "    texCoord.y=texCoord.y*0.5+0.5;"
            .endl() + "    texCoord.x+=texOffset;"

            .endl() + "    vec4 pos=vec4(vPosition, 1.0);"

            .endl() + "    r=0.0;"
            .endl() + ""
            .endl() + "    vec4 finalPosition  =  (vec4(spline2,1.0));"
            .endl() + "    vec4 finalPosition2 =  (vec4(spline3,1.0));"
            .endl() + ""
            .endl() + "    vec2 screenPos =fix( vec4(spline,1.0));"
            .endl() + "    vec2 screenPos2=fix( vec4(spline2,1.0));"
            .endl() + "    vec2 screenPos3=fix( vec4(spline3,1.0));"
            .endl() + ""
            .endl() + "    float wid=width*10.0;"
            .endl() + "    if(sizeAtt>0.0) //todo as define"
            .endl() + "        wid=width*finalPosition.w*0.5;"
            .endl() + ""
            .endl() + "    vec2 dir1 = normalize( screenPos2 - screenPos );"
            .endl() + "    vec2 dir2 = normalize( screenPos3 - screenPos2 );"
            .endl() + ""
            .endl() + "    if( screenPos2 == screenPos ) dir1 = normalize( screenPos3 - screenPos2 );"
            .endl() + ""
            .endl() + "    vec2 normal = vec2( -dir1.y, dir1.x ) * 0.5 * wid;"
            .endl() + "    vec2 normal2 = vec2( -dir2.y, dir2.x ) * 0.5 * wid;"
            .endl() + "    "
            .endl() + "    float m=pos.x;"
            .endl() + "    vec4 offset = vec4( mix(normal,normal2,m) * (pos.y), 0.0, 1.0 );"
            .endl() + ""
            .endl() + "    finalPosition = mix(finalPosition,finalPosition2,pos.x);"
            .endl() + "    finalPosition.xy += offset.xy;"

            .endl() + "    finalPosition.xy*=zoom;"
            .endl() + "    finalPosition.x+=scrollX;"
            .endl() + "    finalPosition.y+=scrollY;"

            .endl() + "    gl_Position = finalPosition;"
            .endl() + "}"


            .endl() + "", ""

            .endl() + "IN vec2 texCoord;"
            // .endl() + "IN float r=1.0;"
            .endl() + "UNI float a;"
            // .endl() + "UNI sampler2D tex;"
            .endl() + ""
            .endl() + "{{MODULES_HEAD}}"
            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    vec4 col=vec4(1.0,1.0,1.0,1.0);"
            .endl() + "    {{MODULE_COLOR}}"
            .endl() + "    outColor = col;"
            .endl() + "}");

        this._uniTime = new CGL.Uniform(this._shader, "f", "time", 0);
        this._uniZoom = new CGL.Uniform(this._shader, "f", "zoom", 0);
        this._uniResX = new CGL.Uniform(this._shader, "f", "resX", 0);
        this._uniResY = new CGL.Uniform(this._shader, "f", "resY", 0);
        this._uniscrollX = new CGL.Uniform(this._shader, "f", "scrollX", 0);
        this._uniscrollY = new CGL.Uniform(this._shader, "f", "scrollY", 0);
    }

    render(resX, resY, scrollX, scrollY, zoom)
    {
        if (this._rebuildLater) this.rebuild();

        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0 / zoom);
        this._uniTime.set(performance.now() / 1000);

        this._mesh.render(this._shader);
    }

    buildMesh()
    {
        this._verts.length = 0;

        const max = 1;
        const min = -max;

        for (let i = 0; i < this._thePoints.length / 3; i++)
        {
            this._verts.push(
                max, min, 0, 0, min, 0, max, max, 0,
                0, min, 0, 0, max, 0, max, max, 0
            );
        }
        this._geom.vertices = this._verts;

        // if(mesh)mesh.dispose();
        if (!this._mesh) this._mesh = new CGL.Mesh(this._cgl, this._geom);

        this._mesh.addVertexNumbers = true;
        this._mesh.setGeom(this._geom);
        this._mesh.addVertexNumbers = true;
    }

    rebuild()
    {
        const inpoints = this._splines;

        if (!inpoints || inpoints.length === 0)
        {
            this._mesh = null;
            return;
        }

        if (inpoints[0].length)
        {
            const arr = [];
            this._splineIndex = [];
            let count = 0;

            for (let i = 0; i < inpoints.length; i++)
            {
                for (let j = 0; j < inpoints[i].length / 3; j++)
                {
                    this._splineIndex[(count - 3) / 3] = i;// (i) / inpoints.length;

                    arr[count++] = inpoints[i][j * 3 + 0];
                    arr[count++] = inpoints[i][j * 3 + 1];
                    arr[count++] = inpoints[i][j * 3 + 2];
                }
            }
            this._thePoints = arr;
        }
        else
        {
            this._splineIndex = null;
            this._thePoints = inpoints;
        }

        // if (inHardEdges.get())
        this._thePoints = this.tessEdges(this._thePoints);

        this.buildMesh();

        const newLength = this._thePoints.length * 6;
        let count = 0;
        let lastIndex = 0;
        let drawable = 0;

        if (this._points.length != newLength)
        {
            this._points = new Float32Array(newLength);
            this._points2 = new Float32Array(newLength);
            this._points3 = new Float32Array(newLength);

            this._doDraw = new Float32Array(newLength / 3);
            this._pointsProgress = new Float32Array(newLength / 3);

            for (let i = 0; i < newLength / 3; i++) this._pointsProgress[i] = i / (newLength / 3);
        }

        for (let i = 0; i < this._thePoints.length / 3; i++)
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

                for (let k = 0; k < 3; k++)
                {
                    this._points[count] = this._thePoints[(Math.max(0, i - 1)) * 3 + k];
                    this._points2[count] = this._thePoints[(i + 0) * 3 + k];
                    this._points3[count] = this._thePoints[(i + 1) * 3 + k];
                    count++;
                }
            }
        }

        this._mesh.setAttribute("spline", this._points, 3);
        this._mesh.setAttribute("spline2", this._points2, 3);
        this._mesh.setAttribute("spline3", this._points3, 3);
        this._mesh.setAttribute("splineDoDraw", this._doDraw, 1);
        this._mesh.setAttribute("splineProgress", this._pointsProgress, 1);

        this._rebuildLater = false;
    }

    ip(a, b, p)
    {
        return a + p * (b - a);
    }

    tessEdges(oldArr)
    {
        let count = 0;
        const step = 0.001;
        const oneMinusStep = 1 - step;
        const l = oldArr.length * 3 - 3;
        this._arrEdges.length = l;

        const tessSplineIndex = [];

        if (this._splineIndex) tessSplineIndex[0] = this._splineIndex[1];

        for (let i = 0; i < oldArr.length - 3; i += 3)
        {
            this._arrEdges[count++] = oldArr[i + 0];
            this._arrEdges[count++] = oldArr[i + 1];
            this._arrEdges[count++] = oldArr[i + 2];
            if (this._splineIndex) tessSplineIndex[count / 3] = this._splineIndex[i / 3];

            this._arrEdges[count++] = this.ip(oldArr[i + 0], oldArr[i + 3], step);
            this._arrEdges[count++] = this.ip(oldArr[i + 1], oldArr[i + 4], step);
            this._arrEdges[count++] = this.ip(oldArr[i + 2], oldArr[i + 5], step);
            if (this._splineIndex) tessSplineIndex[count / 3] = this._splineIndex[i / 3];

            this._arrEdges[count++] = this.ip(oldArr[i + 0], oldArr[i + 3], oneMinusStep);
            this._arrEdges[count++] = this.ip(oldArr[i + 1], oldArr[i + 4], oneMinusStep);
            this._arrEdges[count++] = this.ip(oldArr[i + 2], oldArr[i + 5], oneMinusStep);
            if (this._splineIndex) tessSplineIndex[count / 3] = this._splineIndex[i / 3];
        }

        if (this._splineIndex) this._splineIndex = tessSplineIndex;

        return this._arrEdges;
    }
};
