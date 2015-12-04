
//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl=Ops.Gl || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};

Ops.Gl.Renderer = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;

    if(!this.patch.cgl)
    {
        console.log(' no cgl!');
    }

    var cgl=this.patch.cgl;
    if(cgl.aborted)return;


    this.name='renderer';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var identTranslate=vec3.create();
    vec3.set(identTranslate, 0,0,-2);

    this.onDelete=function()
    {
        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        self.patch.removeOnAnimFrame(self);
    };

    this.onAnimFrame=function(time)
    {
        if(cgl.aborted || cgl.canvas.clientWidth===0 || cgl.canvas.clientHeight===0)return;

        if(cgl.canvasWidth==-1)
        {
            cgl.setCanvas(self.patch.config.glCanvasId);
            return;
        }

        if(cgl.canvasWidth!=cgl.canvas.clientWidth || cgl.canvasHeight!=cgl.canvas.clientHeight)
        {
            cgl.canvasWidth=cgl.canvas.clientWidth;
            self.width.set(cgl.canvasWidth);
            cgl.canvasHeight=cgl.canvas.clientHeight;
            self.height.set(cgl.canvasHeight);
        }

        Ops.Gl.Renderer.renderStart(cgl,identTranslate);

        self.trigger.trigger();

        if(CGL.Texture.previewTexture)
        {
            if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
            CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
        }
        Ops.Gl.Renderer.renderEnd(cgl);
    };

};


Ops.Gl.Renderer.renderStart=function(cgl,identTranslate)
{
    cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.gl.clearColor(0,0,0,0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    cgl.setViewPort(0,0,cgl.canvas.clientWidth,cgl.canvas.clientHeight);
    mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.1, 1000.0);

    cgl.pushPMatrix();
    cgl.pushMvMatrix();

    mat4.identity(cgl.mvMatrix);
    mat4.translate(cgl.mvMatrix,cgl.mvMatrix, identTranslate);

    cgl.gl.enable(cgl.gl.BLEND);
    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);


    cgl.beginFrame();
};

Ops.Gl.Renderer.renderEnd=function(cgl,identTranslate)
{

    // clear alpha channel
    cgl.gl.clearColor(1, 1, 1, 1);
    cgl.gl.colorMask(false, false, false, true);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);

    cgl.popMvMatrix();
    cgl.popPMatrix();

    cgl.endFrame();
};

Ops.Gl.Renderer.prototype = new CABLES.Op();




// --------------------------------------------------------------------------

Ops.Gl.Wireframe = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Wireframe';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.lineWidth=this.addInPort(new Port(this,"lineWidth"));

    this.render.onTriggered=function()
    {
        cgl.wireframe=true;
        // cgl.gl.lineWidth(self.lineWidth.val);
        self.trigger.trigger();
        cgl.wireframe=false;

    };

    this.lineWidth.val=2;
};

Ops.Gl.Wireframe.prototype = new CABLES.Op();

// --------------------------------------------------------------------------

Ops.Gl.Points = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Points';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.pointSize=this.addInPort(new Port(this,"pointSize"));

    this.render.onTriggered=function()
    {
        cgl.points=true;
        self.trigger.trigger();
        cgl.points=false;

    };

    this.pointSize.val=5;
};

Ops.Gl.Points.prototype = new CABLES.Op();


// --------------------------------------------------------------------------

Ops.Gl.TextureEmpty = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='texture empty';
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.tex=new CGL.Texture(cgl);

    var sizeChanged=function()
    {
        self.tex.setSize(self.width.get(),self.height.get());
        self.textureOut.set( self.tex );
    };

    this.width.onValueChanged=sizeChanged;
    this.height.onValueChanged=sizeChanged;

    this.width.set(8);
    this.height.set(8);
};

Ops.Gl.TextureEmpty.prototype = new CABLES.Op();

// --------------------------------------------------------------------------

Ops.Gl.TextureCycler = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='TextureCycler';

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    var textures=[];
    var texturePorts=[];

    function setTextureArray()
    {
        textures.length=0;
        for(var i in self.portsIn)
        {
            if(self.portsIn[i].isLinked() && self.portsIn[i].get())
            {
                textures.push(self.portsIn[i].get());
            }
        }
    }

    this.getPort=function(name)
    {
        var p=self.getPortByName(name);

        if(p)return p;

        if(name.startsWith('texture')) p=addPort(name);
        return p;
    };

    function checkPorts()
    {
        var allLinked=true;
        for(var i in self.portsIn)
        {
            if(!self.portsIn[i].isLinked())
            {
                allLinked=false;
            }
        }

        if(allLinked)
        {
            addPort();
        }

        setTextureArray();
    }

    function addPort(n)
    {
        if(!n)n="texture"+texturePorts.length;
        var newPort=self.addInPort(new Port(self,n,OP_PORT_TYPE_TEXTURE));

        // newPort.onLink=checkPorts;
        newPort.onLinkChanged=checkPorts;
        newPort.onValueChanged=checkPorts;

        texturePorts.push(newPort);
        checkPorts();
    }

    addPort();

    var index=0;

    this.exe.onTriggered=function()
    {
        if(textures.length===0)
        {
            self.textureOut.set(null);
            return;
        }

        index++;
        if(index>textures.length-1)index=0;
        self.textureOut.set(textures[index]);
    };

    this.textureOut.onPreviewChanged=function()
    {
        if(self.textureOut.showPreview) CGL.Texture.previewTexture=self.textureOut.get();
    };

};

Ops.Gl.TextureCycler.prototype = new CABLES.Op();

// --------------------------------------------------------------------------


// --------------------------------------------------------------------------

Ops.Gl.Meshes=Ops.Gl.Meshes || {};

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Plotter = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Plotter';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.v=this.addInPort(new Port(this,"value"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        cgl.getShader().bind();
        cgl.gl.enableVertexAttribArray(cgl.getShader().getAttrVertexPos());
        cgl.gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),self.buffer.itemSize, cgl.gl.FLOAT, false, 0, 0);
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, self.buffer);
        cgl.gl.drawArrays(cgl.gl.LINE_STRIP, 0, self.buffer.numItems);

        self.trigger.trigger();
    };

    this.buffer = cgl.gl.createBuffer();

    var num=50;
    this.vertices = [];
    for(var i=0;i<num;i++)
    {
        this.vertices.push(1/num*i);
        this.vertices.push(Math.random()-0.5);
        this.vertices.push(0);
    }

    function bufferData()
    {
        cgl.gl.lineWidth(4);

        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, self.buffer);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(self.vertices), cgl.gl.STATIC_DRAW);
        self.buffer.itemSize = 3;
        self.buffer.numItems = num;
    }
    bufferData();

    this.v.onValueChanged=function()
    {
        self.vertices.splice(0,3);
        self.vertices.push(1);
        self.vertices.push(self.v.get());
        self.vertices.push(0);

        for(var i=0;i<num*3;i+=3)
        {
            self.vertices[i]=1/num*i;
        }

        bufferData();
    };
};

Ops.Gl.Meshes.Plotter.prototype = new CABLES.Op();


// --------------------------------------------------------------------------



// --------------------------------------------------------------------------


Ops.Gl.Render2Texture = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;


    this.name='render to texture';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    this.useVPSize=this.addInPort(new Port(this,"use viewport size",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.width=this.addInPort(new Port(this,"texture width"));
    this.height=this.addInPort(new Port(this,"texture height"));

    this.tex=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.texDepth=this.addOutPort(new Port(this,"textureDepth",OP_PORT_TYPE_TEXTURE));


    var fb=new CGL.Framebuffer(cgl);

    self.tex.set( fb.getTextureColor() );
    self.texDepth.set ( fb.getTextureDepth() );


    function resize()
    {
        // cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
        // cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, depthBuffer);
        //
        if(self.useVPSize.val)
        {
            self.width.set( cgl.getViewPort()[2] );
            self.height.set( cgl.getViewPort()[3] );
        }

        fb.setSize( self.width.get(),self.height.get() );
        //
        // texture.setSize(self.width.get(),self.height.get());
        // textureDepth.setSize(self.width.get(),self.height.get());
        //
        // // if(depthBuffer)cgl.gl.deleteRenderbuffer(depthBuffer);
        //
        // cgl.gl.renderbufferStorage(cgl.gl.RENDERBUFFER, cgl.gl.DEPTH_COMPONENT16, self.width.get(),self.height.get());
        //
        // cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, texture.tex, 0);
        // cgl.gl.framebufferRenderbuffer(cgl.gl.FRAMEBUFFER, cgl.gl.DEPTH_ATTACHMENT, cgl.gl.RENDERBUFFER, depthBuffer);
        //
        // cgl.gl.framebufferTexture2D(
        //     cgl.gl.FRAMEBUFFER,
        //     cgl.gl.DEPTH_ATTACHMENT,
        //     cgl.gl.TEXTURE_2D,
        //     textureDepth.tex,
        //     0 );
        //
        // if (!cgl.gl.isFramebuffer(frameBuf)) {
        //     throw("Invalid framebuffer");
        // }
        // var status = cgl.gl.checkFramebufferStatus(cgl.gl.FRAMEBUFFER);
        // switch (status) {
        //     case cgl.gl.FRAMEBUFFER_COMPLETE:
        //         break;
        //     case cgl.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
        //     case cgl.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
        //     case cgl.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
        //     case cgl.gl.FRAMEBUFFER_UNSUPPORTED:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
        //     default:
        //         throw("Incomplete framebuffer: " + status);
        // }
        //
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        // cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
        // cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        // console.log('resize r2t',self.width.get(),self.height.get());

    }


    this.useVPSize.onValueChanged=function()
    {
        if(self.useVPSize.val)
        {
            self.width.onValueChanged=null;
            self.height.onValueChanged=null;
        }
        else
        {
            self.width.onValueChanged=resize;
            self.height.onValueChanged=resize;
        }
    };

    this.width.set(512);
    this.height.set(512);
    this.useVPSize.set(true);

    var oldViewport;

    this.onResize=resize;


    function render()
    {
        // cgl.pushMvMatrix();
        cgl.gl.disable(cgl.gl.SCISSOR_TEST);
        //
        // if(self.useVPSize.get())
        // {
        //     if(texture.width!=cgl.getViewPort()[2] || texture.height!=cgl.getViewPort()[3] )
        //     {
        //         console.log('not the same ? ',texture.width, cgl.getViewPort()[2] , texture.height , cgl.getViewPort()[3]);
        //
        //         for(var i=0;i<self.patch.ops.length;i++)
        //         {
        //             if(self.patch.ops[i].onResize)self.patch.ops[i].onResize();
        //         }
        //     }
        // }
        //
        // cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
        //
        // cgl.pushPMatrix();
        // cgl.gl.viewport(0, 0, self.width.get() ,self.height.get() );
        //
        // cgl.gl.clearColor(0,0,0,0);
        // cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        //
        // self.trigger.trigger();
        //
        // cgl.popPMatrix();
        //
        // cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);
        //
        // cgl.popMvMatrix();

        fb.renderStart(cgl);
        self.trigger.trigger();
        fb.renderEnd(cgl);

        cgl.resetViewPort();
        cgl.gl.enable(cgl.gl.SCISSOR_TEST);
    }

    function preview()
    {
        render();
        self.tex.val.preview();
    }

    this.tex.onPreviewChanged=function()
    {
        if(self.tex.showPreview) self.render.onTriggered=preview;
        else self.render.onTriggered=render;
    };

    self.render.onTriggered=render;
};

Ops.Gl.Render2Texture.prototype = new CABLES.Op();



// --------------------------------------------------------------------------

Ops.Gl.SpotLight = function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='SpotLight';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.show=this.addInPort(new Port(this,"show",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.show.set(true);

    this.x=this.addInPort(new Port(this,"eye x",OP_PORT_TYPE_VALUE));
    this.y=this.addInPort(new Port(this,"eye y",OP_PORT_TYPE_VALUE));
    this.z=this.addInPort(new Port(this,"eye z",OP_PORT_TYPE_VALUE));

    this.tx=this.addInPort(new Port(this,"target x",OP_PORT_TYPE_VALUE));
    this.ty=this.addInPort(new Port(this,"target y",OP_PORT_TYPE_VALUE));
    this.tz=this.addInPort(new Port(this,"target z",OP_PORT_TYPE_VALUE));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var buffer = cgl.gl.createBuffer();

    this.exe.onTriggered=function()
    {
        if(self.show.get())
        {
            var shader=cgl.getShader();
            shader.bind();

            cgl.pushMvMatrix();

            cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
            cgl.gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),3, cgl.gl.FLOAT, false, 0, 0);
            cgl.gl.enableVertexAttribArray(cgl.getShader().getAttrVertexPos());

            cgl.gl.drawArrays(cgl.gl.LINES, 0, 4);
            cgl.gl.drawArrays(cgl.gl.POINTS, 0, 4);
            // cgl.gl.drawArrays(cgl.gl.POINTS, 0, 2);
            cgl.gl.disableVertexAttribArray(cgl.getShader().getAttrVertexPos());

            cgl.popMvMatrix();
        }

        self.trigger.trigger();

    };

    function update()
    {
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(
            [
                self.x.get(),
                self.y.get(),
                self.z.get(),
                self.tx.get(),
                self.ty.get(),
                self.tz.get(),

                self.x.get(),
                self.y.get(),
                self.z.get(),
                self.tx.get()+0.1,
                self.ty.get()+0.1,
                self.tz.get()+0.1,

                // self.x.get(),
                // self.y.get(),
                // self.z.get(),
                // self.tx.get()+0.1,
                // self.ty.get()+0.1,
                // self.tz.get(),


            ]), cgl.gl.STATIC_DRAW);

    }

    this.x.onValueChanged=update;
    this.y.onValueChanged=update;
    this.z.onValueChanged=update;

    this.tx.onValueChanged=update;
    this.ty.onValueChanged=update;
    this.tz.onValueChanged=update;

};

Ops.Gl.SpotLight.prototype = new CABLES.Op();
