
var CGL=CGL || {};

CGL.State=function()
{
    var self=this;
    var mvMatrixStack=[];
    var pMatrixStack=[];
    var shaderStack=[];

    this.pMatrix=mat4.create();
    this.mvMatrix=mat4.create();

    mat4.identity(self.mvMatrix);

    var simpleShader=new CGL.Shader();
    var currentShader=simpleShader;


    this.canvasWidth=640;
    this.canvasHeight=360;



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

