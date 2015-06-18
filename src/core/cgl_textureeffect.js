var CGL=CGL || {};

CGL.TextureEffect=function()
{
    var self=this;
    var geom=new CGL.Geometry();

    geom.vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];

    geom.texCoords = [
         1.0, 1.0,
         0.0, 1.0,
         1.0, 0.0,
         0.0, 0.0
    ];

    geom.verticesIndices = [
        0, 1, 2,
        3, 1, 2
    ];

    var mesh=new CGL.Mesh(geom);

    var textureSource=null;
    var textureTarget=new CGL.Texture();

    var frameBuf = GL.createFramebuffer();
    var renderbuffer = GL.createRenderbuffer();

    var switched=false;

    this.startEffect=function()
    {
        switched=false;
    };

    this.setSourceTexture=function(tex)
    {

        if(tex===null)
        {
            textureSource=new CGL.Texture();
            textureSource.setSize(16,16);
        }
        else
        {
            textureSource=tex;
        }
        console.log(textureSource.width,textureSource.height);
        
        textureTarget.setSize(textureSource.width,textureSource.height);


        GL.bindFramebuffer(GL.FRAMEBUFFER, frameBuf);

        GL.bindRenderbuffer(GL.RENDERBUFFER, renderbuffer);
        GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, textureSource.width,textureSource.height);
        GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, textureTarget.tex, 0);
        GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, renderbuffer);
        GL.bindTexture(GL.TEXTURE_2D, null);
        GL.bindRenderbuffer(GL.RENDERBUFFER, null);
        GL.bindFramebuffer(GL.FRAMEBUFFER, null);


        console.log(
            self.getCurrentTargetTexture().height,
            self.getCurrentSourceTexture().height
            );

        // textures[1]=tex;
    };


    this.getCurrentTargetTexture=function()
    {
        if(switched)return textureSource;
            else return textureTarget;
    };

    this.getCurrentSourceTexture=function()
    {
        if(switched)return textureTarget;
            else return textureSource;
    };

    this.bind=function()
    {
        if(textureSource===null) throw 'no base texture set!';

        // GL.bindFramebuffer(GL.FRAMEBUFFER, frameBuf);

        cgl.pushMvMatrix();

        // cgl.currentTextureEffect=effect;



        GL.bindFramebuffer(GL.FRAMEBUFFER, frameBuf);
        GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, self.getCurrentTargetTexture().tex, 0);

        cgl.pushPMatrix();
        gl.viewport(0, 0, self.getCurrentTargetTexture().width,self.getCurrentTargetTexture().height);
        mat4.perspective(cgl.pMatrix,45, self.getCurrentTargetTexture().width/self.getCurrentTargetTexture().height, 0.01, 1100.0);


        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);


        GL.clearColor(0,1,0,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    };

    this.finish=function()
    {
        mesh.render(cgl.getShader());

        cgl.popPMatrix();
        cgl.popMvMatrix();

        cgl.popPMatrix();

        GL.bindFramebuffer(GL.FRAMEBUFFER, null);

        cgl.popMvMatrix();
        gl.viewport(0, 0, cgl.canvasWidth,cgl.canvasHeight);

        switched=!switched;

    };

};