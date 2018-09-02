
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.currentPreviewTimeout=-1;

CABLES.UI.Preview=function()
{
    this._paused=false;
    this._previewDataPort=null;
    this._previewDataOp=null;
    this._mesh=null;
    this._shader=null;
    this._previewCanvas=null;
    this._previewCanvasEle=null;
    this._lastTime=0;
};


CABLES.UI.Preview.FRAGSHADER=''.endl()
    .endl()+'IN vec2 texCoord;'
    .endl()+'UNI sampler2D tex;'

    .endl()+'void main()'
    .endl()+'{'
    .endl()+'    vec4 col=vec4(1.0,1.0,1.0,1.0);'
    .endl()+'    col=texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)));'
    .endl()+'    outColor = col;'
    .endl()+'}';

CABLES.UI.Preview.VERTSHADER=''.endl()
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


CABLES.UI.Preview.prototype.show=function()
{
    this._previewCanvas=null;
    this._paused=false;
    var html = CABLES.UI.getHandleBarHtml('preview', {} );
    $('#meta_content_preview').html(html);
};

CABLES.UI.Preview.prototype.hide=function()
{
    this._paused=true;
};

CABLES.UI.Preview.prototype.render=function()
{
    if(this._paused)return;
    var now=performance.now();
    if(now-this._lastTime<30)return;
    this._lastTime=now;

    if(!this._previewCanvas && document.getElementById('preview_img'))
    {
        this._previewCanvasEle=document.getElementById('preview_img');
        this._previewCanvas=document.getElementById('preview_img').getContext("2d");
    }

    if(this._previewCanvas && this._previewDataOp && this._previewDataPort && this._previewDataPort.get())
    {
        const cgl=this._previewDataOp.patch.cgl;

        if(!this._mesh)
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

            this._mesh=new CGL.Mesh(cgl,geom);

        }
        if(!this._shader)
        {
            this._shader=new CGL.Shader(cgl,'MinimalMaterial');
            this._shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
            this._shader.setSource(CABLES.UI.Preview.VERTSHADER,CABLES.UI.Preview.FRAGSHADER);
        }

        cgl.pushPMatrix();
        mat4.ortho(cgl.pMatrix,
            -1,
            1,
            1,
            -1,
            0.001,
            11
            );

        cgl.setTexture(0,this._previewDataPort.get().tex);

        this._mesh.render(this._shader);

        cgl.popPMatrix();
        cgl.resetViewPort();

        const containerEle=document.getElementById("preview_img_container");
        const w=Math.min(containerEle.offsetWidth,this._previewDataPort.get().width||256);
        const h=w*(this._previewDataPort.get().height/this._previewDataPort.get().width);
        this._previewCanvasEle.width=w;
        this._previewCanvasEle.height=h;

        this._previewCanvas.clearRect(0, 0,this._previewCanvasEle.width, this._previewCanvasEle.height);
        this._previewCanvas.drawImage(cgl.canvas, 0, 0,this._previewCanvasEle.width, this._previewCanvasEle.height);

        cgl.gl.clearColor(0,0,0,0.0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }
};

CABLES.UI.Preview.prototype.toggleBackground=function()
{
    $('#preview_img').toggleClass('dark');
    $('#preview_img').toggleClass('bright');
};

CABLES.UI.Preview.prototype.setTexture=function(opid,portName)
{
    this._previewDataOp=gui.scene().getOpById(opid);
    if(!this._previewDataOp)
    {
        console.log('opid not found:',opid);
        return;
    }
    this._previewDataPort=this._previewDataOp.getPort(portName);
    if(!this._previewDataPort)
    {
        console.log('port not found:',portName);
        return;
    }

    // +' - '+this._previewDataPort.get().width+'x'+this._previewDataPort.get().height
    $('#meta_content_preview .opname').html(this._previewDataOp.name);
};

