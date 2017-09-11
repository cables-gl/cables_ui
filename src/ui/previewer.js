CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.currentPreviewTimeout=-1;

CABLES.UI.Preview=function()
{
    var paused=false;


    var previewDataPort=null;
    var previewDataOp=null;
    var mesh=null;
    var shader=null;
    var previewCanvas=null;


    this.show=function()
    {
        previewCanvas=null;
        paused=false;
        var html = CABLES.UI.getHandleBarHtml('preview', {} );
        $('#meta_content_preview').html(html);
    };

    // this.showHover=function(event)
    // {
    //     previewCanvas=null;
    //     paused=false;
    //     var html = CABLES.UI.getHandleBarHtml('preview', {} );


    //     $('#hoverPreviewer').html(html);

    //     if(event)
    //     {
    //         $('#hoverPreviewer').css('top',event.clientY+50);
    //         $('#hoverPreviewer').css('left',event.clientX+25);
    //     }
    // };


    this.hide=function()
    {
        paused=true;
    };

    this.render=function()
    {
        if(paused)return;
        if(!previewCanvas && document.getElementById('preview_img'))
        {
            previewCanvasEle=document.getElementById('preview_img');
            previewCanvas=document.getElementById('preview_img').getContext("2d");
        }

        if(previewCanvas && previewDataOp && previewDataPort && previewDataPort.get())
        {
            var cgl=previewDataOp.patch.cgl;

            if(!mesh)
            {
                var geom=new CGL.Geometry("preview op rect");

                geom.vertices = [
                     1.0,  1.0,  0.0,
                    -1.0,  1.0,  0.0,
                     1.0, -1.0,  0.0,
                    -1.0, -1.0,  0.0
                ];

                geom.texCoords = [
                     1.0, 0.0,
                     0.0, 0.0,
                     1.0, 1.0,
                     0.0, 1.0
                ];

                geom.verticesIndices = [
                    0, 1, 2,
                    3, 1, 2
                ];

                mesh=new CGL.Mesh(cgl,geom);

            }
            if(!shader)
            {
                shader=new CGL.Shader(cgl,'MinimalMaterial');
                shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
                shader.setSource(vert,frag);
            }

            // mat4.perspective(cgl.pMatrix,45, 1, 0.1, 1100.0);

            cgl.pushPMatrix();
            mat4.ortho(cgl.pMatrix,
                -1,
                1,
                1,
                -1,
                0.001,
                11
                );

            cgl.setTexture(0,previewDataPort.get().tex);

            mesh.render(shader);

            cgl.popPMatrix();
            cgl.resetViewPort();

            var containerEle=document.getElementById("preview_img_container");

            previewCanvasEle.style.width=containerEle.offsetWidth;
            previewCanvasEle.style.height=containerEle.offsetWidth*(previewDataPort.get().height/previewDataPort.get().width);

            previewCanvas.clearRect(0, 0,previewCanvasEle.width, previewCanvasEle.height);
            previewCanvas.drawImage(cgl.canvas, 0, 0,previewCanvasEle.width, previewCanvasEle.height);

            cgl.gl.clearColor(0,0,0,0.0);
            cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        }
    };

    this.toggleBackground=function()
    {
        $('#preview_img').toggleClass('dark');
        $('#preview_img').toggleClass('bright');
    };

    this.setTexture=function(opid,portName)
    {
        previewDataOp=gui.scene().getOpById(opid);
        if(!previewDataOp)
        {
            console.log('opid not found:',opid);
            return;
        }
        previewDataPort=previewDataOp.getPort(portName);
        if(!previewDataPort)
        {
            console.log('port not found:',portName);
            return;
        }

        $('#meta_content_preview .opname').html(previewDataOp.name);

        // updatePreview();
    };


var frag=''.endl()
.endl()+'IN vec2 texCoord;'
.endl()+'UNI sampler2D tex;'

.endl()+'void main()'
.endl()+'{'
.endl()+'    vec4 col=vec4(1.0,1.0,1.0,1.0);'
.endl()+'    col=texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)));'
.endl()+'    outColor = col;'
.endl()+'}';

var vert=''.endl()
.endl()+'IN vec3 vPosition;'
.endl()+'IN vec2 attrTexCoord;'

.endl()+'OUT vec2 texCoord;'

.endl()+'UNI mat4 projMatrix;'
.endl()+'UNI mat4 modelMatrix;'
.endl()+'UNI mat4 viewMatrix;'

.endl()+'void main()'
.endl()+'{'
.endl()+'    texCoord=attrTexCoord;'
.endl()+'    vec4 pos = vec4( vPosition, 1. );'
.endl()+'    mat4 mvMatrix=viewMatrix * modelMatrix;'
.endl()+'    gl_Position = projMatrix * mvMatrix * pos;'
.endl()+'}';


};
