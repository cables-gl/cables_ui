import { mat4, vec3 } from "gl-matrix";
import { Framebuffer2, Geometry, Mesh, Shader, Uniform } from "cables-corelibs";
import overlayShaderVert from "./overlaymeshes.vert";
import { gui } from "../../gui.js";

const helperMeshes = {};
helperMeshes.count = 0;

export default helperMeshes;

helperMeshes.startFramebuffer = function (cgl)
{
    if (!helperMeshes.FB || !helperMeshes.FB.fb)
    {
        helperMeshes.FB = {};

        helperMeshes.FB.fb = new Framebuffer2(cgl, 8, 8, {
            "isFloatingPointTexture": false,
            "depth": true,
            "clear": false,
            "multisampling": true,
            "multisamplingSamples": 4,
        });
    }

    if (helperMeshes.FB.oldWidth != cgl.getViewPort()[2] || helperMeshes.FB.oldHeight != cgl.getViewPort()[3])
    {
        helperMeshes.FB.fb.setSize(cgl.getViewPort()[2], cgl.getViewPort()[3]);
        helperMeshes.FB.oldWidth = cgl.getViewPort()[2];
        helperMeshes.FB.oldHeight = cgl.getViewPort()[3];
    }

    helperMeshes.FB.fb.renderStart(cgl);

    if (cgl.frameCycler != helperMeshes.FB.oldFrameCycle)
    {
        cgl.gl.clearColor(0, 0, 0, 0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        helperMeshes.FB.oldFrameCycle = cgl.frameCycler;
    }
};

helperMeshes.endFramebuffer = function (cgl)
{
    helperMeshes.FB.fb.renderEnd();
};

helperMeshes.getDefaultShader = function (cgl, options = {})
{
    let name = "defaultShader";

    if (options.billboarded)name = "defaultShaderBillboard";

    if (!helperMeshes[name])
    {
        helperMeshes[name] = new Shader(cgl, "marker shader");
        helperMeshes[name].setSource(overlayShaderVert, Shader.getDefaultFragmentShader(0.6, 0.6, 0.6));
        if (options.billboarded)helperMeshes[name].toggleDefine("BILLBOARD", true);
    }
    return helperMeshes[name];
};

helperMeshes.getSelectedShader = function (cgl, options = {})
{
    let name = "selectedShader";

    if (options.billboarded)name = "selectedShaderBillboard";

    if (!helperMeshes[name])
    {
        helperMeshes[name] = new Shader(cgl, "marker shader");
        helperMeshes[name].setSource(overlayShaderVert, Shader.getDefaultFragmentShader(0, 1, 1));
        if (options.billboarded)helperMeshes[name].toggleDefine("BILLBOARD", true);
    }
    return helperMeshes[name];
};

helperMeshes.drawCircle = function (op, size)
{
    const cgl = op.patch.cgl;

    if (!helperMeshes.CIRCLE)
    {
        helperMeshes.CIRCLE = {};

        helperMeshes.CIRCLE.vScale = vec3.create();
        function bufferData()
        {
            let verts = [];
            let tc = [];
            const segments = 80;
            let degInRad = 0;
            const radius = 1;

            for (let i = 0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0 / Math.round(segments)) * i * CGL.DEG2RAD;
                verts.push(
                    Math.cos(degInRad) * radius,
                    Math.sin(degInRad) * radius,
                    0
                );
                tc.push(0, 0);
            }

            let geom = new Geometry("sphere marker");
            geom.setPointVertices(verts);
            geom.setTexCoords(tc);
            geom.vertexNormals = verts.slice();
            helperMeshes.CIRCLE.mesh = new Mesh(cgl, geom);
        }

        bufferData();
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    helperMeshes.startFramebuffer(cgl);

    vec3.set(helperMeshes.CIRCLE.vScale, size, size, size);
    mat4.scale(cgl.mvMatrix, cgl.mvMatrix, helperMeshes.CIRCLE.vScale);

    let shader = helperMeshes.getDefaultShader(cgl, { "billboarded": true });

    if (gui.patchView.isCurrentOp(op)) shader = helperMeshes.getSelectedShader(cgl, { "billboarded": true });
    shader.glPrimitive = cgl.gl.LINE_STRIP;

    helperMeshes.CIRCLE.mesh.render(shader);
    helperMeshes.count++;
    cgl.popModelMatrix();
    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawSphere = function (op, size)
{
    const cgl = op.patch.cgl;

    if (!helperMeshes.SPHERE)
    {
        helperMeshes.SPHERE = {};

        helperMeshes.SPHERE.vScale = vec3.create();
        function bufferData()
        {
            let verts = [];
            let tc = [];
            const segments = 80;
            let i = 0, degInRad = 0;
            const radius = 1;

            for (i = 0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0 / Math.round(segments)) * i * CGL.DEG2RAD;
                verts.push(Math.cos(degInRad) * radius);
                verts.push(0);
                verts.push(Math.sin(degInRad) * radius);
                tc.push(0, 0);
            }

            const geom = new Geometry("sphere marker");
            geom.setPointVertices(verts);
            geom.setTexCoords(tc);
            geom.vertexNormals = verts.slice();

            //---

            verts = [];
            tc = [];
            for (i = 0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0 / Math.round(segments)) * i * CGL.DEG2RAD;
                verts.push(Math.cos(degInRad) * radius);
                verts.push(Math.sin(degInRad) * radius);
                verts.push(0);
                tc.push(0, 0);
            }

            const geom2 = new Geometry("sphere marker");
            geom2.setPointVertices(verts);
            geom2.setTexCoords(tc);
            geom2.vertexNormals = verts.slice();

            //---

            verts = [];
            tc = [];
            for (i = 0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0 / Math.round(segments)) * i * CGL.DEG2RAD;
                verts.push(0);
                verts.push(Math.cos(degInRad) * radius);
                verts.push(Math.sin(degInRad) * radius);
                tc.push(0, 0);
            }

            const geom3 = new Geometry("sphere marker");
            geom3.setPointVertices(verts);
            geom3.setTexCoords(tc);
            geom3.vertexNormals = verts.slice();

            geom.merge(geom2);
            geom.merge(geom3);
            helperMeshes.SPHERE.mesh = new Mesh(cgl, geom);
        }

        bufferData();
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    helperMeshes.startFramebuffer(cgl);

    vec3.set(helperMeshes.SPHERE.vScale, size, size, size);
    mat4.scale(cgl.mvMatrix, cgl.mvMatrix, helperMeshes.SPHERE.vScale);

    let shader = helperMeshes.getDefaultShader(cgl);
    if (gui.patchView.isCurrentOp(op)) shader = helperMeshes.getSelectedShader(cgl);

    shader.glPrimitive = cgl.gl.LINE_STRIP;
    helperMeshes.SPHERE.mesh.render(shader);
    helperMeshes.count++;
    cgl.popModelMatrix();

    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawAxisMarker = function (op, size)
{
    const cgl = op.patch.cgl;

    if (!helperMeshes.MARKER)
    {
        helperMeshes.MARKER = {};

        const geom = new Geometry("marker");
        geom.setPointVertices([
            0.00001, 0, 0, 1, 0, 0,
            0, 0.00001, 0, 0, 1, 0,
            0, 0, 0.00001, 0, 0, 1
        ]);
        // geom.resetTextureCoords();

        helperMeshes.MARKER.mesh = new Mesh(cgl, geom, { "glPrimitive": cgl.gl.LINES });
        helperMeshes.MARKER.mesh.setGeom(geom);

        const frag = "".endl() + "IN vec3 axisColor;".endl() + "void main()".endl() + "{".endl() + "    vec4 col=vec4(axisColor,1.0);".endl() + "    outColor = col;".endl() + "}";

        const vert = "".endl()
            + "IN vec3 vPosition;".endl()
            + "UNI mat4 projMatrix;".endl()
            + "UNI mat4 mvMatrix;".endl()
            + "OUT vec3 axisColor;".endl()
            + "void main()".endl()
            + "{".endl()
            + "   vec4 pos=vec4(vPosition, 1.0);".endl()
            + "   if(pos.x!=0.0)axisColor=vec3(1.0,0.3,0.0);".endl()
            + "   if(pos.y!=0.0)axisColor=vec3(0.0,1.0,0.2);".endl()
            + "   if(pos.z!=0.0)axisColor=vec3(0.0,0.5,1.0);".endl()
            + "   gl_Position = projMatrix * mvMatrix * pos;".endl()
            + "}";

        helperMeshes.MARKER.shader = new Shader(cgl, "markermaterial");
        helperMeshes.MARKER.shader.setSource(vert, frag);

        helperMeshes.MARKER.vScale = vec3.create();
    }

    helperMeshes.startFramebuffer(cgl);

    if (size === undefined) size = 2;
    cgl.pushModelMatrix();

    cgl.pushShader(helperMeshes.MARKER.shader);

    vec3.set(helperMeshes.MARKER.vScale, size, size, size);
    mat4.scale(cgl.mvMatrix, cgl.mvMatrix, helperMeshes.MARKER.vScale);

    cgl.pushDepthTest(false);

    helperMeshes.MARKER.mesh.render(cgl.getShader());

    helperMeshes.count++;
    cgl.popDepthTest();
    cgl.popShader();
    cgl.popModelMatrix();

    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawLineSourceDest = function (op, sourceX, sourceY, sourceZ, destX, destY, destZ)
{
    const cgl = op.patch.cgl;
    if (!helperMeshes.ARROW_SRC_DST)
    {
        helperMeshes.ARROW_SRC_DST = {};

        const verts = [];
        verts.push(sourceX, sourceY, sourceZ);
        verts.push(destX, destY, destZ);

        const tc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const geom = new Geometry("helpermesh");
        geom.vertices = verts;
        geom.setTexCoords(tc);
        geom.vertexNormals = verts.slice();
        helperMeshes.ARROW_SRC_DST.geom = geom;
        helperMeshes.ARROW_SRC_DST.cube = new Mesh(cgl, geom, { "glPrimitive": cgl.gl.LINES });
    }
    else
    {
        helperMeshes.ARROW_SRC_DST.geom.setVertices([sourceX, sourceY, sourceZ, destX, destY, destZ]);
        helperMeshes.ARROW_SRC_DST.cube.updateVertices(helperMeshes.ARROW_SRC_DST.geom);
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    helperMeshes.startFramebuffer(cgl);

    let shader = helperMeshes.getDefaultShader(cgl);
    if (gui.patchView.isCurrentOp(op)) shader = helperMeshes.getSelectedShader(cgl);

    helperMeshes.ARROW_SRC_DST.cube.render(shader);
    helperMeshes.count++;

    cgl.popModelMatrix();
    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawArrow = function (op, sizeX, rotX, rotY, rotZ)
{
    const cgl = op.patch.cgl;

    if (!helperMeshes.ARROW)
    {
        helperMeshes.ARROW = {};
        helperMeshes.ARROW.vScale = vec3.create();

        function bufferData()
        {
            const verts = [];

            verts.push(0, -1, 0);
            verts.push(0.25, -0.75, 0);

            verts.push(0, -1, 0);
            verts.push(-0.25, -0.75, 0);

            verts.push(0, -1, 0);
            verts.push(0, 0, 0);

            const tc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            const geom = new Geometry("helpermesh");
            geom.vertices = verts;
            geom.setTexCoords(tc);
            geom.vertexNormals = verts.slice();

            helperMeshes.ARROW.cube = new Mesh(cgl, geom, { "glPrimitive": cgl.gl.LINES });
        }

        bufferData();
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    helperMeshes.startFramebuffer(cgl);

    vec3.set(helperMeshes.ARROW.vScale, sizeX, sizeX, sizeX);
    mat4.scale(cgl.mvMatrix, cgl.mvMatrix, helperMeshes.ARROW.vScale);

    if (rotX) mat4.rotateX(cgl.mvMatrix, cgl.mvMatrix, rotX * CGL.DEG2RAD);
    if (rotY) mat4.rotateY(cgl.mvMatrix, cgl.mvMatrix, rotY * CGL.DEG2RAD);
    if (rotZ) mat4.rotateZ(cgl.mvMatrix, cgl.mvMatrix, rotZ * CGL.DEG2RAD);

    let shader = helperMeshes.getDefaultShader(cgl);
    if (gui.patchView.isCurrentOp(op)) shader = helperMeshes.getSelectedShader(cgl);

    helperMeshes.ARROW.cube.render(shader);
    helperMeshes.count++;

    cgl.popModelMatrix();
    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawXPlane = function (op, sizeX, rotX, rotY, rotZ)
{
    const cgl = op.patch.cgl;

    if (!helperMeshes.XPLANE)
    {
        helperMeshes.XPLANE = {};
        helperMeshes.XPLANE.vScale = vec3.create();

        function bufferData()
        {
            const verts = [
                -1, -1, 0,
                1, 1, 0,
                -1, 1, 0,
                1, -1, 0,
                1, 1, 0,
                -1, 1, 0,
                -1, -1, 0,
                1, -1, 0
            ];

            const tc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            const geom = new Geometry("helpermesh");
            geom.vertices = verts;
            geom.setTexCoords(tc);
            geom.vertexNormals = verts.slice();

            helperMeshes.XPLANE.mesh = new Mesh(cgl, geom, cgl.gl.LINE_STRIP);
        }

        bufferData();
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    helperMeshes.startFramebuffer(cgl);

    vec3.set(helperMeshes.XPLANE.vScale, sizeX, sizeX, sizeX);
    mat4.scale(cgl.mvMatrix, cgl.mvMatrix, helperMeshes.XPLANE.vScale);

    if (rotX) mat4.rotateX(cgl.mvMatrix, cgl.mvMatrix, rotX * CGL.DEG2RAD);
    if (rotY) mat4.rotateY(cgl.mvMatrix, cgl.mvMatrix, rotY * CGL.DEG2RAD);
    if (rotZ) mat4.rotateZ(cgl.mvMatrix, cgl.mvMatrix, rotZ * CGL.DEG2RAD);

    let shader = helperMeshes.getDefaultShader(cgl);
    if (gui.patchView.isCurrentOp(op)) shader = helperMeshes.getSelectedShader(cgl);

    helperMeshes.XPLANE.mesh.render(shader);
    helperMeshes.count++;

    cgl.popModelMatrix();
    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawCube = function (op, sizeX, sizeY, sizeZ)
{
    const cgl = op.patch.cgl;

    if (!helperMeshes.CUBE)
    {
        helperMeshes.CUBE = {};
        helperMeshes.CUBE.vScale = vec3.create();

        function bufferData()
        {
            const verts = new Float32Array([
                -1, -1, 1,
                1, -1, 1,
                1, 1, 1,
                -1, 1, 1,
                -1, -1, 1,

                -1, -1, -1,
                1, -1, -1,
                1, 1, -1,
                -1, 1, -1,
                -1, -1, -1,

                -1, -1, -1,
                -1, 1, -1,
                -1, 1, 1,
                -1, -1, 1,
                -1, -1, -1,

                1, -1, -1,
                1, 1, -1,
                1, 1, 1,
                1, -1, 1,
                1, -1, -1
            ]);

            const tc = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

            const geom = new Geometry("helpermesh");
            geom.vertices = verts;
            geom.setTexCoords(tc);
            geom.vertexNormals = verts.slice();

            helperMeshes.CUBE.mesh = new Mesh(cgl, geom, cgl.gl.LINE_STRIP);
        }

        bufferData();
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    helperMeshes.startFramebuffer(cgl);

    if (sizeY == undefined) sizeY = sizeX;
    if (sizeZ == undefined) sizeZ = sizeX;
    vec3.set(helperMeshes.CUBE.vScale, sizeX, sizeY, sizeZ);
    mat4.scale(cgl.mvMatrix, cgl.mvMatrix, helperMeshes.CUBE.vScale);

    let shader = helperMeshes.getDefaultShader(cgl);
    if (gui.patchView.isCurrentOp(op)) shader = helperMeshes.getSelectedShader(cgl);

    helperMeshes.CUBE.mesh.render(shader);
    helperMeshes.count++;

    cgl.popModelMatrix();
    helperMeshes.endFramebuffer(cgl);
};

helperMeshes.drawMarkerLayer = function (cgl, size)
{
    if (!gui.shouldDrawOverlay) return;

    if (helperMeshes.count == 0) return;
    helperMeshes.count = 0;

    if (!helperMeshes.FB || !helperMeshes.FB.fb) return;

    const currentViewPort = cgl.getViewPort();
    const w = currentViewPort[2];
    const h = currentViewPort[3];

    if (!helperMeshes.fullscreenRectMesh || helperMeshes.FSWIDTH != w || helperMeshes.FSHEIGHT != h)
    {
        const fsGeom = new Geometry("fullscreen rectangle");

        helperMeshes.FSWIDTH = w;
        helperMeshes.FSHEIGHT = h;

        // prettier-ignore
        fsGeom.vertices = new Float32Array([
            w, h, 0,
            0, h, 0,
            w, 0, 0,
            0, 0, 0
        ]);

        fsGeom.texCoords = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ]);

        fsGeom.vertexNormals = new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ]);

        fsGeom.verticesIndices = new Uint16Array([
            0, 1, 2,
            3, 1, 2,
        ]);

        // helperMeshes.fsGeom=fsGeom;
        if (!helperMeshes.fullscreenRectMesh) helperMeshes.fullscreenRectMesh = new Mesh(cgl, fsGeom);
        else helperMeshes.fullscreenRectMesh.setGeom(fsGeom);

        // ------------

        if (!helperMeshes.fullscreenRectShader)
        {
            const shader = new Shader(cgl, "marker overlay");

            const shader_frag = "".endl()
                + "UNI sampler2D tex;".endl()
                + "IN vec2 texCoord;".endl()
                + "void main()".endl()
                + "{"

                /*
                 * .endl()+'   vec3 gray = vec3(dot( vec3(0.2126,0.7152,0.0722),  texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y))).rgb ));'
                 * .endl()+'   gl_FragColor = vec4(gray,1.0);'
                 */

                    .endl()
                + "   gl_FragColor = texture2D(tex,texCoord);"
                // .endl()+'   if(gl_FragColor.a<0.5)gl_FragColor.a=0.7;'

                    .endl()
                + "}";

            const shader_vert = "".endl()
                + "IN vec3 vPosition;".endl()
                + "UNI mat4 projMatrix;".endl()
                + "UNI mat4 mvMatrix;".endl()
                + "OUT vec2 texCoord;".endl()
                + "IN vec2 attrTexCoord;".endl()
                + "void main()".endl()
                + "{".endl()
                + "   vec4 pos=vec4(vPosition, 1.0);".endl()
                + "   texCoord=vec2(attrTexCoord.x,1.0-attrTexCoord.y);".endl()
                + "   gl_Position = projMatrix * mvMatrix * pos;".endl()
                + "}";

            shader.setSource(shader_vert, shader_frag);
            shader.texUniform = new Uniform(shader, "t", "tex", 0);

            helperMeshes.fullscreenRectShader = shader;

            /*
             * shader.bindTextures = function ()
             * {
             *     cgl.gl.activeTexture(cgl.gl.TEXTURE0);
             *     cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, helperMeshes.FB.fb.getTextureColor().tex);
             * };
             */
        }
    }

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w, h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mvMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    helperMeshes.fullscreenRectShader.popTextures();
    helperMeshes.fullscreenRectShader.pushTexture(helperMeshes.fullscreenRectShader.texUniform, helperMeshes.FB.fb.getTextureColor().tex);

    cgl.pushShader(helperMeshes.fullscreenRectShader);

    /*
     * helperMeshes.fullscreenRectShader.bind();
     * cgl.getShader().bind
     */

    /*
     * for (var i =0;i< cgl.gl.getProgramParameter(cgl.getShader().getProgram(), cgl.gl.ACTIVE_ATTRIBUTES) ; i++)
     * {
     *     console.log(i, cgl.gl.getActiveAttrib(cgl.getShader().getProgram(), i) );
     * }
     */

    cgl.pushBlend(true);

    cgl.gl.blendEquation(cgl.gl.FUNC_ADD);
    cgl.gl.blendFunc(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);

    helperMeshes.fullscreenRectMesh.render(cgl.getShader());
    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
    cgl.popBlend();

    cgl.popShader();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    cgl.frameCycler = !cgl.frameCycler;
};
