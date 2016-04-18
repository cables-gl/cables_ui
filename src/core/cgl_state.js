
var CGL=CGL || {};

CGL.State=function()
{
    var self=this;
    var mvMatrixStack=[];
    var vMatrixStack=[];
    var pMatrixStack=[];
    var shaderStack=[];
    var viewPort=[0,0,0,0];

    this.temporaryTexture=null;
    this.frameStore={};
    this.gl=null;
    this.pMatrix=mat4.create();
    this.mvMatrix=mat4.create();
    this.vMatrix=mat4.create();
    this.canvas=null;
    mat4.identity(self.mvMatrix);
    mat4.identity(self.vMatrix);

    var simpleShader=new CGL.Shader(this,"simpleshader");
    var currentShader=simpleShader;
    var aborted=false;

    this.setCanvas=function(id)
    {
        this.canvas=document.getElementById(id);

        if(!this.patch.config.canvas) this.patch.config.canvas={};
        if(!this.patch.config.canvas.hasOwnProperty('preserveDrawingBuffer')) this.patch.config.canvas.preserveDrawingBuffer=true;
        if(!this.patch.config.canvas.hasOwnProperty('premultipliedAlpha')) this.patch.config.canvas.premultipliedAlpha=true;
        if(!this.patch.config.canvas.hasOwnProperty('alpha')) this.patch.config.canvas.alpha=true;
        if(!this.patch.config.canvas.hasOwnProperty('antialias')) this.patch.config.canvas.antialias=true;

        this.gl=this.canvas.getContext("experimental-webgl",this.patch.config.canvas);

        if(!this.gl)
        {
            if(this.patch.config.onError)this.patch.config.onError('sorry, could not initialize WebGL. Please check if your Browser supports WebGL.');
            this.aborted=true;
            return;
        }
        else
        {

            var ext = this.gl.getExtension("ANGLE_instanced_arrays");
            if(!ext)
            {
                console.err('no instanced arrays extension');
            }

            this.canvasWidth=this.canvas.clientWidth;
            this.canvasHeight=this.canvas.clientHeight;
        }
    };

    this.canvasWidth=-1;
    this.canvasHeight=-1;

    this.doScreenshot=false;
    this.screenShotDataURL=null;


    this.getViewPort=function()
    {
        return viewPort;
    };

    this.resetViewPort=function()
    {
        this.gl.viewport(
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
        this.gl.viewport(
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
        if(vMatrixStack.length>0) console.warn('view matrix stack length !=0 at end of rendering...');
        if(mvMatrixStack.length>0) console.warn('mvmatrix stack length !=0 at end of rendering...');
        if(pMatrixStack.length>0) console.warn('pmatrix stack length !=0 at end of rendering...');
        if(shaderStack.length>0) console.warn('shaderStack length !=0 at end of rendering...');
        mvMatrixStack.length=0;
        vMatrixStack.length=0;
        pMatrixStack.length=0;
        shaderStack.length=0;

        if(this.doScreenshot)
        {
            // clear alpha channel
            this.gl.clearColor(1, 1, 1, 1);
            this.gl.colorMask(false, false, false, true);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.colorMask(true, true, true, true);

            console.log('do screenshot');

            this.doScreenshot=false;
            this.screenShotDataURL = document.getElementById("glcanvas").toDataURL('image/png');
        }
    };

    // shader stack
    this.getShader=function()
    {
        if(currentShader)
            if(!this.frameStore || (true===this.frameStore.renderOffscreen == currentShader.offScreenPass===true))
                return currentShader;

        for(var i=shaderStack.length-1;i>=0;i--)
            if(shaderStack[i])
                if(this.frameStore.renderOffscreen == shaderStack[i].offScreenPass)
                    return shaderStack[i];

        // console.log('no shader found?');
    };

    this.getDefaultShader=function()
    {
        return simpleShader;
    };

    this.setShader=function(shader)
    {
        shaderStack.push(shader);
        currentShader=shader;
    };

    this.setPreviousShader=function()
    {
        if(shaderStack.length===0) throw "Invalid shader stack pop!";
        shaderStack.pop();
        currentShader = shaderStack[shaderStack.length-1];
    };


    // view matrix stack

    this.pushViewMatrix=function()
    {
        var copy=mat4.clone(self.vMatrix);
        // var copy = mat4.create();
        // mat4.copy(copy,self.mvMatrix);
        vMatrixStack.push(copy);
    };

    this.popViewMatrix=function()
    {
        if(vMatrixStack.length===0) throw "Invalid view popMatrix!";
        self.vMatrix = vMatrixStack.pop();
    };

    // modelview matrix stack

    this.pushMvMatrix=function()
    {
        // var copy = mat4.create();
        // mat4.copy(copy,self.mvMatrix);
        var copy=mat4.clone(self.mvMatrix);
        mvMatrixStack.push(copy);
    };

    this.popMvMatrix=function()
    {
        if(mvMatrixStack.length===0) throw "Invalid modelview popMatrix!";
        self.mvMatrix = mvMatrixStack.pop();
    };
    this.popModelMatrix=this.popMvMatrix;
    this.pushModelMatrix=this.pushMvMatrix;

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

    var identView=vec3.create();
    vec3.set(identView, 0,0,02);
    var ident=vec3.create();
    vec3.set(ident, 0,0,0);

    this.renderStart=function(cgl,identTranslate,identTranslateView)
    {


        if(!identTranslate)identTranslate=ident;
        if(!identTranslateView)identTranslateView=identView;
        cgl.gl.enable(cgl.gl.DEPTH_TEST);
        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        cgl.setViewPort(0,0,cgl.canvas.clientWidth,cgl.canvas.clientHeight);
        mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.1, 1000.0);

        cgl.pushPMatrix();
        cgl.pushMvMatrix();
        cgl.pushViewMatrix();

        mat4.identity(cgl.mvMatrix);
        mat4.identity(cgl.vMatrix);
        mat4.translate(cgl.mvMatrix,cgl.mvMatrix, identTranslate);
        // mat4.translate(cgl.mvMatrix,cgl.mvMatrix, identTranslate);
        mat4.translate(cgl.vMatrix,cgl.vMatrix, identTranslateView);

        cgl.gl.enable(cgl.gl.BLEND);
        cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

        cgl.beginFrame();
    };

    this.renderEnd=function(cgl,identTranslate)
    {
        cgl.popViewMatrix();
        cgl.popMvMatrix();
        cgl.popPMatrix();

        cgl.endFrame();
    };

    this.setTexture=function(slot,t)
    {
        this.gl.activeTexture(this.gl.TEXTURE0+slot);
        this.gl.bindTexture(this.gl.TEXTURE_2D, t);
    };

    this.fullScreen=function()
    {
        if(this.canvas.requestFullscreen) this.canvas.requestFullscreen();
        else if(this.canvas.mozRequestFullScreen) this.canvas.mozRequestFullScreen();
        else if(this.canvas.webkitRequestFullscreen) this.canvas.webkitRequestFullscreen();
        else if(this.canvas.msRequestFullscreen) this.canvas.msRequestFullscreen();
    };

};
