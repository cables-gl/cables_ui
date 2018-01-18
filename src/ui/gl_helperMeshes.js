
var CABLES=CABLES||{};

CABLES.GL_MARKER={};


CABLES.GL_MARKER.startFramebuffer=function(cgl)
{
    if(!CABLES.GL_MARKER.FB)
    {
        CABLES.GL_MARKER.FB={};
        CABLES.GL_MARKER.FB.fb=new CGL.Framebuffer2(cgl,8,8,
            {
                isFloatingPointTexture:false,
                depth:true,
                clear:false,
                multisamplingSamples:4
            });
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
    CABLES.GL_MARKER.FB.fb.renderEnd(cgl);
};


CABLES.GL_MARKER.drawSphere=function(cgl,size)
{

    if(!CABLES.GL_MARKER.SPHERE)
    {
        CABLES.GL_MARKER.SPHERE={};
        CABLES.GL_MARKER.SPHERE.buffer = cgl.gl.createBuffer();
        CABLES.GL_MARKER.SPHERE.vScale=vec3.create();
        function bufferData()
        {
            var points=[];
            var segments=24;
            var i=0,degInRad=0;
            var radius=0.5;
    
            for (i=0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0/Math.round(segments))*i*CGL.DEG2RAD;
                points.push(Math.cos(degInRad)*radius);
                points.push(0);
                points.push(Math.sin(degInRad)*radius);
            }
    
            for (i=0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0/Math.round(segments))*i*CGL.DEG2RAD;
                points.push(Math.cos(degInRad)*radius);
                points.push(Math.sin(degInRad)*radius);
                points.push(0);
            }
    
            for (i=0; i <= Math.round(segments); i++)
            {
                degInRad = (360.0/Math.round(segments))*i*CGL.DEG2RAD;
                points.push(0);
                points.push(Math.cos(degInRad)*radius);
                points.push(Math.sin(degInRad)*radius);
            }
    
            cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, CABLES.GL_MARKER.SPHERE.buffer);
            cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(points), cgl.gl.STATIC_DRAW);
            CABLES.GL_MARKER.SPHERE.buffer.itemSize = 3;
            CABLES.GL_MARKER.SPHERE.buffer.numItems = points.length/CABLES.GL_MARKER.SPHERE.buffer.itemSize;
        }
        bufferData();

    }

    CABLES.GL_MARKER.startFramebuffer(cgl);
    

    cgl.pushModelMatrix();

    vec3.set(CABLES.GL_MARKER.SPHERE.vScale, size,size,size);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.SPHERE.vScale);

    var shader=cgl.getDefaultShader();
    // var shader=cgl.getShader();
    if(cgl.lastMesh)cgl.lastMesh.unBind();
    shader.bind();
    cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, CABLES.GL_MARKER.SPHERE.buffer);

    cgl.gl.vertexAttribPointer(shader.getAttrVertexPos(),CABLES.GL_MARKER.SPHERE.buffer.itemSize, cgl.gl.FLOAT, false, 0, 0);
    cgl.gl.enableVertexAttribArray(shader.getAttrVertexPos());


    cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, CABLES.GL_MARKER.SPHERE.buffer);
    cgl.gl.drawArrays(cgl.gl.LINE_STRIP, 0, CABLES.GL_MARKER.SPHERE.buffer.numItems);

    cgl.popModelMatrix();
    
    CABLES.GL_MARKER.endFramebuffer(cgl);
};

CABLES.GL_MARKER.drawAxisMarker=function(cgl,size)
{
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
        geom.resetTextureCoords();
        
        CABLES.GL_MARKER.MARKER.mesh=new CGL.Mesh(cgl, geom, cgl.gl.LINES);
        CABLES.GL_MARKER.MARKER.mesh.setGeom(geom);
       
        var frag=''
        .endl()+'precision highp float;'
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
    cgl.pushMvMatrix();
    
    cgl.setShader(CABLES.GL_MARKER.MARKER.shader);

    vec3.set(CABLES.GL_MARKER.MARKER.vScale, size,size,size);
    mat4.scale(cgl.mvMatrix,cgl.mvMatrix, CABLES.GL_MARKER.MARKER.vScale);

    cgl.gl.disable(cgl.gl.DEPTH_TEST);

    CABLES.GL_MARKER.MARKER.mesh.render(cgl.getShader());

    cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.setPreviousShader();
    cgl.popMvMatrix();

    CABLES.GL_MARKER.endFramebuffer(cgl);
};










CABLES.GL_MARKER.drawCube=function(cgl,sizeX,sizeY,sizeZ)
{
    if(!CABLES.GL_MARKER.CUBE)
    {
        CABLES.GL_MARKER.CUBE={};      
        CABLES.GL_MARKER.CUBE.vScale=vec3.create();

        function bufferData()
        {
            var verts=[];

            verts.push(-1,-1, 1);
            verts.push( 1,-1, 1);
            verts.push( 1, 1, 1);
            verts.push(-1, 1, 1);
            verts.push(-1,-1, 1);

            verts.push(-1,-1,-1);
            verts.push( 1,-1,-1);
            verts.push( 1, 1,-1);
            verts.push(-1, 1,-1);
            verts.push(-1,-1,-1);

            verts.push(-1,-1,-1);
            verts.push(-1, 1,-1);
            verts.push(-1, 1, 1);
            verts.push(-1,-1, 1);
            verts.push(-1,-1,-1);

            verts.push(1,-1,-1);
            verts.push(1, 1,-1);
            verts.push(1, 1, 1);
            verts.push(1,-1, 1);
            verts.push(1,-1,-1);

            var geom=new CGL.Geometry();
            geom.vertices=verts;
            geom.resetTextureCoords();

            CABLES.GL_MARKER.CUBE.cube =new CGL.Mesh(cgl,geom,cgl.gl.LINE_STRIP);
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

    var shader=cgl.getDefaultShader();

    shader.bind();

    CABLES.GL_MARKER.CUBE.cube.render(shader);

    cgl.popModelMatrix();
    CABLES.GL_MARKER.endFramebuffer(cgl);

};




CABLES.GL_MARKER.drawMarkerLayer=function(cgl,size)
{
    return;
    
    if(!CABLES.GL_MARKER.FB || !CABLES.GL_MARKER.FB.fb)
    {
        return;
    }

    var currentViewPort=cgl.getViewPort();
    // if(currentViewPort[2]==w && currentViewPort[3]==h)return;
    var w=currentViewPort[2];
    var h=currentViewPort[3];
    
    if(!CABLES.GL_MARKER.fullscreenRectMesh)
    {
        console.log("init overlay mesh and layer");
        var fsGeom=new CGL.Geometry("fullscreen rectangle");

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
            0.0, 0.0
        ]);

        fsGeom.vertexNormals = new Float32Array([
            0,0,1,
            0,0,1,
            0,0,1,
            0,0,1
        ]);

        fsGeom.verticesIndices = new Float32Array([
            0, 1, 2,
            3, 1, 2
        ]);

        CABLES.GL_MARKER.fsGeom=fsGeom;
        CABLES.GL_MARKER.fullscreenRectMesh=new CGL.Mesh(cgl,fsGeom);
        // CABLES.GL_MARKER.fullscreenRectMesh.setGeom(fsGeom);

        // ------------

        var shader=new CGL.Shader(cgl,'marker overlay');

        var shader_frag=''
            .endl()+'UNI sampler2D tex;'
            .endl()+'IN vec2 texCoord;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'   gl_FragColor = texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)));'
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

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w,h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mvMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    // cgl.setShader(CABLES.GL_MARKER.fullscreenRectShader);
    // CABLES.GL_MARKER.fullscreenRectShader.bind();
    // cgl.getShader().bind

    CABLES.GL_MARKER.fullscreenRectMesh.render(cgl.getShader());

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
    // cgl.setPreviousShader();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();
};