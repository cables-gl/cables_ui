
var CGL=CGL || {};

CGL.State=function()
{
    var self=this;
    var mvMatrixStack=[];
    var pMatrixStack=[];
    var shaderStack=[];

    this.pMatrix=mat4.create();
    this.mvMatrix=mat4.create();
    this.canvas=null;
    mat4.identity(self.mvMatrix);

    var simpleShader=new CGL.Shader();
    var currentShader=simpleShader;

    var canvas = document.getElementById("glcanvas");
    this.gl=canvas.getContext("experimental-webgl",
        {
            preserveDrawingBuffer: true,
            antialias:true
        });
    this.canvasWidth=640;
    this.canvasHeight=360;

    this.wireframe=false;
    this.points=false;

    this.doScreenshot=false;
    this.screenShotDataURL=null;

    var viewPort=[0,0,0,0];

    this.getViewPort=function()
    {
        return viewPort;
    };

    this.resetViewPort=function()
    {
        cgl.gl.viewport(
            viewPort[0],
            viewPort[1],
            viewPort[2],
            viewPort[3]);
    };
    this.setViewPort=function(x,y,w,h)
    {
        viewPort[0]=parseInt(x,10);
        viewPort[1]=parseInt(y,10);
        viewPort[2]=parseInt(w,10);
        viewPort[3]=parseInt(h,10);
        cgl.gl.viewport(
            viewPort[0],
            viewPort[1],
            viewPort[2],
            viewPort[3]);
    };

    this.beginFrame=function()
    {
        self.setShader(simpleShader);
    };

    this.endFrame=function()
    {
        self.setPreviousShader();
        if(mvMatrixStack.length>0) console.warn('mvmatrix stack length !=0 at end of rendering...');
        if(pMatrixStack.length>0) console.warn('pmatrix stack length !=0 at end of rendering...');
        if(shaderStack.length>0) console.warn('shaderStack length !=0 at end of rendering...');
        mvMatrixStack.length=0;
        pMatrixStack.length=0;
        shaderStack.length=0;

        if(this.doScreenshot)
        {
            console.log('do screenshot');

            this.doScreenshot=false;
            this.screenShotDataURL = document.getElementById("glcanvas").toDataURL('image/png');
        }

    };

    // shader stack

    this.getShader=function()
    {
        return currentShader;
    };

    this.setShader=function(shader)
    {
        shaderStack.push(shader);
        currentShader=shader;
    };

    this.setPreviousShader=function()
    {
        if(shaderStack.length===0) throw "Invalid movelview popMatrix!";
        shaderStack.pop();
        currentShader = shaderStack[shaderStack.length-1];
    };

    // modelview matrix stack

    this.pushMvMatrix=function()
    {
        var copy = mat4.create();
        mat4.copy(copy,self.mvMatrix);
        mvMatrixStack.push(copy);
    };

    this.popMvMatrix=function()
    {
        if(mvMatrixStack.length===0) throw "Invalid movelview popMatrix!";
        self.mvMatrix = mvMatrixStack.pop();
    };

    // projection matrix stack

    this.pushPMatrix=function()
    {
        var copy = mat4.create();
        mat4.copy(copy,self.pMatrix);
        pMatrixStack.push(copy);
    };

    this.popPMatrix=function()
    {
        if(pMatrixStack.length===0) throw "Invalid projection popMatrix!";
        self.pMatrix = pMatrixStack.pop();
    };


};

cgl=new CGL.State();

