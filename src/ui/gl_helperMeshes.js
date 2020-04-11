
var CABLES=CABLES||{};

CABLES.GL_MARKER={};
CABLES.GL_MARKER.count=0;

CABLES.GL_MARKER.startFramebuffer=function(cgl)
{
    if(!CABLES.GL_MARKER.FB || !CABLES.GL_MARKER.FB.fb)
    {
        // console.log("CREATE FB!");
        CABLES.GL_MARKER.FB={};
        CABLES.GL_MARKER.FB.fb=new CGL.Framebuffer2(cgl,8,8,
            {
                isFloatingPointTexture:false,
                depth:true,
                clear:false,
                multisampling:true,
                multisamplingSamples:4
            });
        // console.log("CREATE FB!",CABLES.GL_MARKER.FB.fb);
    }

    if( CABLES.GL_MARKER.FB.oldWidth!=cgl.getViewPort()[2] ||
        CABLES.GL_MARKER.FB.oldHeight!=cgl.getViewPort()[3] )
        {
            CABLES.GL_MARKER.FB.fb.setSize(cgl.getViewPort()[2],cgl.getViewPort()[3]);
            CABLES.GL_MARKER.FB.oldWidth=cgl.getViewPort()[2];
            CABLES.GL_MARKER.FB.oldHeight=cgl.getViewPort()[3];
        }

    CABLES.GL_MARKER.FB.fb.renderStart(cgl);

    if(cgl.frameCycler!=CABLES.GL_MARKER.FB.oldFrameCycle)
    {
        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        CABLES.GL_MARKER.FB.oldFrameCycle=cgl.frameCycler;
    }
};

CABLES.GL_MARKER.endFramebuffer=function(cgl)
{
    // CABLES.GL_MARKER.FB.fb.pop();
    CABLES.GL_MARKER.FB.fb.renderEnd();
};

CABLES.GL_MARKER.getDefaultShader=function(cgl)
{
    if(!CABLES.GL_MARKER.defaultShader)
    {
        CABLES.GL_MARKER.defaultShader=new CGL.Shader(cgl, "marker shader");
        CABLES.GL_MARKER.defaultShader.setSource(CGL.Shader.getDefaultVertexShader(), CGL.Shader.getDefaultFragmentShader(0.6,0.6,0.6));
    }
    return CABLES.GL_MARKER.defaultShader;
}

CABLES.GL_MARKER.getSelectedShader=function(cgl)
{
    if(!CABLES.GL_MARKER.selectedShader)
    {
        CABLES.GL_MARKER.selectedShader=new CGL.Shader(cgl, "marker shader");
        CABLES.GL_MARKER.selectedShader.setSource(CGL.Shader.getDefaultVertexShader(), CGL.Shader.getDefaultFragmentShader(0,1,1));
    }
    return CABLES.GL_MARKER.selectedShader;
}

CABLES.GL_MARKER.drawSphere=function(op,size)
{
    var cgl=op.patch.cgl;

    if(!CABLES.GL_MARKER.SPHERE)
    {
        CABLES.GL_MARKER.SPHERE={};

        CABLES.GL_MARKER.SPHERE.vScale=vec3.create();
        function bufferData()
        {
            var verts=[];
            var tc=[];
            var segments=80;
            var i=0,degInRad=0;
            var radius=1;

            for (i=0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0/Math.round(segments))*i*CGL.DEG2RAD;
                verts.push(Math.cos(degInRad)*radius);
                verts.push(0);
                verts.push(Math.sin(degInRad)*radius);
                tc.push(0,0);
            }

            var geom=new CGL.Geometry("sphere marker");
            geom.setPointVertices(verts);
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();
            CABLES.GL_MARKER.SPHERE.mesh=new CGL.Mesh(cgl, geom);

            //---

            verts=[];
            tc=[];
            for (i=0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0/Math.round(segments))*i*CGL.DEG2RAD;
                verts.push(Math.cos(degInRad)*radius);
                verts.push(Math.sin(degInRad)*radius);
                verts.push(0);
                tc.push(0,0);
            }

            var geom=new CGL.Geometry("sphere marker");
            geom.setPointVertices(verts);
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();
            CABLES.GL_MARKER.SPHERE.mesh2=new CGL.Mesh(cgl, geom);

            //---

            verts=[];
            tc=[];
            for (i=0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0/Math.round(segments))*i*CGL.DEG2RAD;
                verts.push(0);
                verts.push(Math.cos(degInRad)*radius);
                verts.push(Math.sin(degInRad)*radius);
                tc.push(0,0);
            }

            var geom=new CGL.Geometry("sphere marker");
            geom.setPointVertices(verts);
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();
            CABLES.GL_MARKER.SPHERE.mesh3=new CGL.Mesh(cgl, geom);
        }
        bufferData();
    }

    if(cgl.lastMesh)cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    CABLES.GL_MARKER.startFramebuffer(cgl);

    vec3.set(CABLES.GL_MARKER.SPHERE.vScale, size, size, size);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.SPHERE.vScale);

    var shader=CABLES.GL_MARKER.getDefaultShader(cgl);

    if(gui.patch().isCurrentOp(op))shader=CABLES.GL_MARKER.getSelectedShader(cgl);
    shader.glPrimitive=cgl.gl.LINE_STRIP;
    CABLES.GL_MARKER.SPHERE.mesh.render(shader);
    CABLES.GL_MARKER.SPHERE.mesh2.render(shader);
    CABLES.GL_MARKER.SPHERE.mesh3.render(shader);
    CABLES.GL_MARKER.count++;
    cgl.popModelMatrix();
    CABLES.GL_MARKER.endFramebuffer(cgl);
};




CABLES.GL_MARKER.drawAxisMarker=function(op,size)
{
    var cgl=op.patch.cgl;

    if(!CABLES.GL_MARKER.MARKER)
    {
        CABLES.GL_MARKER.MARKER={};

        var geom=new CGL.Geometry("marker");
        geom.setPointVertices(
            [
                0.00001, 0, 0,   1,0,0,
                0, 0.00001, 0,   0,1,0,
                0, 0, 0.00001,   0,0,1,
            ]);
        // geom.resetTextureCoords();

        CABLES.GL_MARKER.MARKER.mesh=new CGL.Mesh(cgl, geom, cgl.gl.LINES);
        CABLES.GL_MARKER.MARKER.mesh.setGeom(geom);

        var frag=''
            .endl()+'IN vec3 axisColor;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'    vec4 col=vec4(axisColor,1.0);'
            .endl()+'    outColor = col;'
            .endl()+'}';

        var vert=''
            .endl()+'IN vec3 vPosition;'
            .endl()+'UNI mat4 projMatrix;'
            .endl()+'UNI mat4 mvMatrix;'
            .endl()+'OUT vec3 axisColor;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'   vec4 pos=vec4(vPosition, 1.0);'
            .endl()+'   if(pos.x!=0.0)axisColor=vec3(1.0,0.3,0.0);'
            .endl()+'   if(pos.y!=0.0)axisColor=vec3(0.0,1.0,0.2);'
            .endl()+'   if(pos.z!=0.0)axisColor=vec3(0.0,0.5,1.0);'

            .endl()+'   gl_Position = projMatrix * mvMatrix * pos;'
            .endl()+'}';

        CABLES.GL_MARKER.MARKER.shader=new CGL.Shader(cgl,'markermaterial');
        CABLES.GL_MARKER.MARKER.shader.setSource(vert,frag);

        CABLES.GL_MARKER.MARKER.vScale=vec3.create();
    }

    CABLES.GL_MARKER.startFramebuffer(cgl);

    if(!size)size=2;
    cgl.pushModelMatrix();

    cgl.pushShader(CABLES.GL_MARKER.MARKER.shader);

    vec3.set(CABLES.GL_MARKER.MARKER.vScale, size,size,size);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.MARKER.vScale);

    cgl.pushDepthTest(false);


    CABLES.GL_MARKER.MARKER.mesh.render(cgl.getShader());

    CABLES.GL_MARKER.count++;
    cgl.popDepthTest();
    cgl.popShader();
    cgl.popModelMatrix();

    CABLES.GL_MARKER.endFramebuffer(cgl);
};


CABLES.GL_MARKER.drawLineSourceDest = function({ op, sourceX, sourceY, sourceZ, destX, destY, destZ })
{
    const cgl = op.patch.cgl;
    if (!CABLES.GL_MARKER.ARROW_SRC_DST)
    {
        CABLES.GL_MARKER.ARROW_SRC_DST = {};
        function bufferData() { // eslint-disable-line
            const verts = [];
            verts.push(sourceX, sourceY, sourceZ);
            verts.push(destX, destY, destZ);
            // verts.push(destX - 0.25, destY - 0.75, sourceZ);
            // verts.push(destX, destY, destZ);
            // verts.push(destX + 0.25, destY - 0.75, sourceZ);
            // verts.push(destX, destY, destZ);

            const tc=[0,0,0,0,0,0,0,0,0,0,0,0];
            const geom=new CGL.Geometry();
            geom.vertices=verts;
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();
            CABLES.GL_MARKER.ARROW_SRC_DST.geom = geom;
            CABLES.GL_MARKER.ARROW_SRC_DST.cube = new CGL.Mesh(cgl, geom, cgl.gl.LINES);
        }
        bufferData();
    } else {
        CABLES.GL_MARKER.ARROW_SRC_DST.geom.setVertices([sourceX, sourceY, sourceZ, destX, destY, destZ]);
        CABLES.GL_MARKER.ARROW_SRC_DST.cube.updateVertices(CABLES.GL_MARKER.ARROW_SRC_DST.geom);
    }

    if (cgl.lastMesh) cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    CABLES.GL_MARKER.startFramebuffer(cgl);

    let shader = CABLES.GL_MARKER.getDefaultShader(cgl);
    if (gui.patch().isCurrentOp(op)) shader = CABLES.GL_MARKER.getSelectedShader(cgl);

    CABLES.GL_MARKER.ARROW_SRC_DST.cube.render(shader);
    CABLES.GL_MARKER.count++;

    cgl.popModelMatrix();
    CABLES.GL_MARKER.endFramebuffer(cgl);
};

CABLES.GL_MARKER.drawArrow=function(op,sizeX,rotX,rotY,rotZ)
{
    var cgl=op.patch.cgl;

    if(!CABLES.GL_MARKER.ARROW)
    {
        CABLES.GL_MARKER.ARROW={};
        CABLES.GL_MARKER.ARROW.vScale=vec3.create();

        function bufferData()
        {
            var verts=[];

            verts.push(0,-1,0);
            verts.push(0.25,-0.75,0);

            verts.push(0,-1,0);
            verts.push(-0.25,-0.75,0);

            verts.push(0,-1,0);
            verts.push(0,0,0);

            var tc=[0,0,0,0,0,0,0,0,0,0,0,0];

            var geom=new CGL.Geometry();
            geom.vertices=verts;
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();

            CABLES.GL_MARKER.ARROW.cube =new CGL.Mesh(cgl,geom,cgl.gl.LINES);
        }
        bufferData();
    }

    if(cgl.lastMesh)cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    CABLES.GL_MARKER.startFramebuffer(cgl);

    vec3.set(CABLES.GL_MARKER.ARROW.vScale, sizeX,sizeX,sizeX);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.ARROW.vScale);

    if(rotX)mat4.rotateX(cgl.mvMatrix,cgl.mvMatrix, rotX*CGL.DEG2RAD);
    if(rotY)mat4.rotateY(cgl.mvMatrix,cgl.mvMatrix, rotY*CGL.DEG2RAD);
    if(rotZ)mat4.rotateZ(cgl.mvMatrix,cgl.mvMatrix, rotZ*CGL.DEG2RAD);


    var shader=CABLES.GL_MARKER.getDefaultShader(cgl);
    if(gui.patch().isCurrentOp(op))shader=CABLES.GL_MARKER.getSelectedShader(cgl);

    CABLES.GL_MARKER.ARROW.cube.render(shader);
    CABLES.GL_MARKER.count++;

    cgl.popModelMatrix();
    CABLES.GL_MARKER.endFramebuffer(cgl);
};










CABLES.GL_MARKER.drawXPlane=function(op,sizeX,rotX,rotY,rotZ)
{
    var cgl=op.patch.cgl;

    if(!CABLES.GL_MARKER.XPLANE)
    {
        CABLES.GL_MARKER.XPLANE={};
        CABLES.GL_MARKER.XPLANE.vScale=vec3.create();


        function bufferData()
        {
            var verts=[
                -1,-1, 0,
                1, 1, 0,
                -1, 1, 0,
                1,-1, 0,
                1, 1, 0,
                -1, 1, 0,
                -1,-1, 0,
                1,-1, 0];

            var tc=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

            var geom=new CGL.Geometry();
            geom.vertices=verts;
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();

            CABLES.GL_MARKER.XPLANE.mesh =new CGL.Mesh(cgl,geom,cgl.gl.LINE_STRIP);
        }
        bufferData();
    }

    if(cgl.lastMesh)cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    CABLES.GL_MARKER.startFramebuffer(cgl);

    vec3.set(CABLES.GL_MARKER.XPLANE.vScale, sizeX,sizeX,sizeX);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.XPLANE.vScale);

    if(rotX)mat4.rotateX(cgl.mvMatrix,cgl.mvMatrix, rotX*CGL.DEG2RAD);
    if(rotY)mat4.rotateY(cgl.mvMatrix,cgl.mvMatrix, rotY*CGL.DEG2RAD);
    if(rotZ)mat4.rotateZ(cgl.mvMatrix,cgl.mvMatrix, rotZ*CGL.DEG2RAD);


    var shader=CABLES.GL_MARKER.getDefaultShader(cgl);
    if(gui.patch().isCurrentOp(op))shader=CABLES.GL_MARKER.getSelectedShader(cgl);

    CABLES.GL_MARKER.XPLANE.mesh.render(shader);
    CABLES.GL_MARKER.count++;

    cgl.popModelMatrix();
    CABLES.GL_MARKER.endFramebuffer(cgl);
};





CABLES.GL_MARKER.drawCube=function(op,sizeX,sizeY,sizeZ)
{
    var cgl=op.patch.cgl;

    if(!CABLES.GL_MARKER.CUBE)
    {
        CABLES.GL_MARKER.CUBE={};
        CABLES.GL_MARKER.CUBE.vScale=vec3.create();

        function bufferData()
        {
            var verts=new Float32Array([
                -1,-1, 1,
                1,-1, 1,
                1, 1, 1,
                -1, 1, 1,
                -1,-1, 1,

                -1,-1,-1,
                1,-1,-1,
                1, 1,-1,
                -1, 1,-1,
                -1,-1,-1,

                -1,-1,-1,
                -1, 1,-1,
                -1, 1, 1,
                -1,-1, 1,
                -1,-1,-1,

                1,-1,-1,
                1, 1,-1,
                1, 1, 1,
                1,-1, 1,
                1,-1,-1]);

            var tc=new Float32Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

            var geom=new CGL.Geometry();
            geom.vertices=verts;
            geom.setTexCoords(tc);
            geom.vertexNormals=verts.slice();

            CABLES.GL_MARKER.CUBE.mesh =new CGL.Mesh(cgl,geom,cgl.gl.LINE_STRIP);
        }
        bufferData();
    }

    if(cgl.lastMesh)cgl.lastMesh.unBind();

    cgl.pushModelMatrix();
    CABLES.GL_MARKER.startFramebuffer(cgl);

    if(sizeY==undefined)sizeY=sizeX;
    if(sizeZ==undefined)sizeZ=sizeX;
    vec3.set(CABLES.GL_MARKER.CUBE.vScale, sizeX,sizeY,sizeZ);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.CUBE.vScale);

    var shader=CABLES.GL_MARKER.getDefaultShader(cgl);
    if(gui.patch().isCurrentOp(op))shader=CABLES.GL_MARKER.getSelectedShader(cgl);

    CABLES.GL_MARKER.CUBE.mesh.render(shader);
    CABLES.GL_MARKER.count++;

    cgl.popModelMatrix();
    CABLES.GL_MARKER.endFramebuffer(cgl);
};




CABLES.GL_MARKER.drawMarkerLayer = function (cgl, size)
{


    CABLES.UI.renderHelper = CABLES.UI.userSettings.get("helperMode");

    CABLES.UI.renderHelperCurrent = CABLES.UI.userSettings.get("helperModeCurrentOp");

    
    if(!CABLES.UI.renderHelperCurrent && !CABLES.UI.renderHelper)return;

    // if (!CABLES.UI.renderHelper) return;
    if (CABLES.GL_MARKER.count == 0) return;
    CABLES.GL_MARKER.count = 0;


    if (!CABLES.GL_MARKER.FB || !CABLES.GL_MARKER.FB.fb)
    {
        return;
    }


    var currentViewPort = cgl.getViewPort();
    var w = currentViewPort[2];
    var h = currentViewPort[3];


    if (!CABLES.GL_MARKER.fullscreenRectMesh || CABLES.GL_MARKER.FSWIDTH != w || CABLES.GL_MARKER.FSHEIGHT != h)
    {
        var fsGeom = new CGL.Geometry("fullscreen rectangle");

        CABLES.GL_MARKER.FSWIDTH = w;
        CABLES.GL_MARKER.FSHEIGHT = h;

        fsGeom.vertices = new Float32Array([
            w, h, 0,
            0, h, 0,
            w, 0, 0,
            0, 0, 0,
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
            0, 0, 1,
        ]);

        fsGeom.verticesIndices = new Float32Array([
            0, 1, 2,
            3, 1, 2,
        ]);

        // CABLES.GL_MARKER.fsGeom=fsGeom;
        if (!CABLES.GL_MARKER.fullscreenRectMesh) CABLES.GL_MARKER.fullscreenRectMesh = new CGL.Mesh(cgl, fsGeom);
        else CABLES.GL_MARKER.fullscreenRectMesh.setGeom(fsGeom);

        // ------------

        if (!CABLES.GL_MARKER.fullscreenRectShader)
        {
            var shader = new CGL.Shader(cgl, "marker overlay");

            var shader_frag = ''
                .endl()+'UNI sampler2D tex;'
                .endl()+'IN vec2 texCoord;'

                .endl()+'void main()'
                .endl()+'{'
                // .endl()+'   vec3 gray = vec3(dot( vec3(0.2126,0.7152,0.0722),  texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y))).rgb ));'
                // .endl()+'   gl_FragColor = vec4(gray,1.0);'

                .endl()+'   gl_FragColor = texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)));'
                // .endl()+'   if(gl_FragColor.a<0.5)gl_FragColor.a=0.7;'


                .endl()+'}';

            var shader_vert=''
                .endl()+'IN vec3 vPosition;'
                .endl()+'UNI mat4 projMatrix;'
                .endl()+'UNI mat4 mvMatrix;'
                .endl()+'OUT vec2 texCoord;'
                .endl()+'IN vec2 attrTexCoord;'

                .endl()+'void main()'
                .endl()+'{'
                .endl()+'   vec4 pos=vec4(vPosition, 1.0);'
                .endl()+'   texCoord=attrTexCoord;'
                .endl()+'   gl_Position = projMatrix * mvMatrix * pos;'
                .endl()+'}';

            shader.setSource(shader_vert,shader_frag);
            shader.texUniform=new CGL.Uniform(shader,'t','tex',0);

            CABLES.GL_MARKER.fullscreenRectShader=shader;

            shader.bindTextures=function()
            {
                cgl.gl.activeTexture(cgl.gl.TEXTURE0);
                cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, CABLES.GL_MARKER.FB.fb.getTextureColor().tex);
            }

        }
    }

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w,h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mvMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    cgl.pushShader(CABLES.GL_MARKER.fullscreenRectShader);
    // CABLES.GL_MARKER.fullscreenRectShader.bind();
    // cgl.getShader().bind

    // for (var i =0;i< cgl.gl.getProgramParameter(cgl.getShader().getProgram(), cgl.gl.ACTIVE_ATTRIBUTES) ; i++)
    // {
    //     console.log(i, cgl.gl.getActiveAttrib(cgl.getShader().getProgram(), i) );
    // }

    cgl.pushBlend(true);

    cgl.gl.blendEquation( cgl.gl.FUNC_ADD );
    cgl.gl.blendFunc(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);

    CABLES.GL_MARKER.fullscreenRectMesh.render(cgl.getShader());
    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
    cgl.popBlend();


    cgl.popShader();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    cgl.frameCycler=!cgl.frameCycler;
};
