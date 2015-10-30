
//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl=Ops.Gl || {};





Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
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
        self.patch.removeOnAnimFrame(self);
    };

    this.onAnimFrame=function(time)
    {
        if(cgl.aborted)return;
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
    cgl.gl.clearColor(0,0,0,1);
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
    cgl.popMvMatrix();
    cgl.popPMatrix();

    cgl.endFrame();
};

Ops.Gl.Renderer.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Gl.Perspective = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Perspective';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.fovY=this.addInPort(new Port(this,"fov y",OP_PORT_TYPE_VALUE ));
    this.fovY.val=45;

    this.zNear=this.addInPort(new Port(this,"frustum near",OP_PORT_TYPE_VALUE ));
    this.zNear.val=0.01;

    this.zFar=this.addInPort(new Port(this,"frustum far",OP_PORT_TYPE_VALUE ));
    this.zFar.val=2000.0;

    this.render.onTriggered=function()
    {
        mat4.perspective(cgl.pMatrix,cgl.frameStore.perspective.fovy*0.0174533, cgl.getViewPort()[2]/cgl.getViewPort()[3], cgl.frameStore.perspective.zNear, cgl.frameStore.perspective.zFar);
        cgl.pushPMatrix();

        self.trigger.trigger();

        cgl.popPMatrix();
    };

    function changed()
    {
        cgl.frameStore.perspective=
        {
            fovy:parseFloat(self.fovY.val),
            zFar:parseFloat(self.zFar.val),
            zNear:parseFloat(self.zNear.val),
        };
    }

    this.fovY.onValueChanged=changed;
    this.zFar.onValueChanged=changed;
    this.zNear.onValueChanged=changed;
    changed();

};

Ops.Gl.Perspective.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Orthogonal = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Orthogonal';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.bounds=this.addInPort(new Port(this,"bounds",OP_PORT_TYPE_VALUE ));
    this.bounds.val=45;

    this.zNear=this.addInPort(new Port(this,"frustum near",OP_PORT_TYPE_VALUE ));
    this.zNear.val=0.01;

    this.zFar=this.addInPort(new Port(this,"frustum far",OP_PORT_TYPE_VALUE ));
    this.zFar.val=2000.0;

    this.render.onTriggered=function()
    {
        var ratio=cgl.getViewPort()[2]/cgl.getViewPort()[3];

        cgl.pushPMatrix();
        mat4.ortho(cgl.pMatrix, 0, self.bounds.get()*ratio, 0, self.bounds.get(), self.zNear.get(), self.zFar.get());

        self.trigger.trigger();

        cgl.popPMatrix();
    };

    function changed()
    {
    }

    this.bounds.onValueChanged=changed;
    this.zFar.onValueChanged=changed;
    this.zNear.onValueChanged=changed;

};

Ops.Gl.Orthogonal.prototype = new Op();


// --------------------------------------------------------------------------

Ops.Gl.LetterBox = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='letterbox';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.ratio=this.addInPort(new Port(this,"ratio",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:[1.25,1.3333333333,1.777777777778,2.33333333333333]} ));
    this.ratio.val=1.777777777778;

    var x=0,y=0,w=1000,h=1000;


    function resize()
    {
        var _w=cgl.canvasHeight*self.ratio.val;
        var _h=cgl.canvasHeight;
        var _x=0;
        var _y=0;
        if(_w>cgl.canvasWidth)
        {
           _w=cgl.canvasWidth;
           _h=cgl.canvasWidth/self.ratio.val;
        }

        if(_w<cgl.canvasWidth) _x=(cgl.canvasWidth-_w)/2;
        if(_h<cgl.canvasHeight) _y=(cgl.canvasHeight-_h)/2;


        if(_w!=w || _h!=h || _x!=x ||_y!=y)
        {
            w=_w;
            h=_h;
            x=_x;
            y=_y;

            cgl.setViewPort(x,y,w,h);

            for(var i=0;i<self.patch.ops.length;i++)
            {
                if(self.patch.ops[i].onResize)self.patch.ops[i].onResize();
            }
        }
    }

    this.render.onTriggered=function()
    {
        cgl.gl.enable(cgl.gl.SCISSOR_TEST);

        resize();

        cgl.gl.scissor(x,y,w,h);
        cgl.setViewPort(x,y,w,h);
        
        mat4.perspective(cgl.pMatrix,45, self.ratio.val, 0.01, 1100.0);


        self.trigger.trigger();
        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

    };
};

Ops.Gl.LetterBox.prototype = new Op();
Ops.Gl.AspectRatioBorder=Ops.Gl.LetterBox;

// --------------------------------------------------------------------------


Ops.Gl.ClearAlpha = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ClearAlpha';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.a.val=1.0;

    this.render.onTriggered=function()
    {
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clearColor(0, 0, 0, self.a.val);
        cgl.gl.clear(cgl.gl.GL_COLOR_BUFFER_BIT | cgl.gl.GL_DEPTH_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);

        self.trigger.trigger();
    };
};

Ops.Gl.ClearAlpha.prototype = new Op();



// --------------------------------------------------------------------------

Ops.Gl.Wireframe = function()
{
    Op.apply(this, arguments);
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

Ops.Gl.Wireframe.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Points = function()
{
    Op.apply(this, arguments);
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

Ops.Gl.Points.prototype = new Op();

// --------------------------------------------------------------------------



Ops.Gl.Mouse = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='mouse';
    this.mouseX=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.mouseY=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));
    this.mouseDown=this.addOutPort(new Port(this,"button down",OP_PORT_TYPE_VALUE));
    this.mouseClick=this.addOutPort(new Port(this,"click",OP_PORT_TYPE_VALUE));

    this.normalize=this.addInPort(new Port(this,"normalize",OP_PORT_TYPE_VALUE,{display:'bool'}));

    this.smooth=this.addInPort(new Port(this,"smooth",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.smoothSpeed=this.addInPort(new Port(this,"smoothSpeed",OP_PORT_TYPE_VALUE));

    this.multiply=this.addInPort(new Port(this,"multiply",OP_PORT_TYPE_VALUE));
    this.multiply.set(1.0);

    this.smoothSpeed.set(20);
    var speed=this.smoothSpeed.get();

    var smoothTimer;

    function setValue(x,y)
    {
        if(self.normalize.get())
        {
            self.mouseX.set( (x/cgl.canvas.width*2.0-1.0)*self.multiply.get() );
            self.mouseY.set( (y/cgl.canvas.height*2.0-1.0)*self.multiply.get() );
        }
        else
        {
            self.mouseX.set( x*self.multiply.get() );
            self.mouseY.set( y*self.multiply.get() );
        }
    }

    this.smooth.onValueChanged=function()
    {
        if(self.smooth.get()) smoothTimer = setInterval(updateSmooth, 15);
            else clearTimeout(smoothTimer);
    };

    var smoothX,smoothY;
    var lineX=0,lineY=0;

    var mouseX=cgl.canvas.width/2;
    var mouseY=cgl.canvas.height/2;
    lineX=mouseX;
    lineY=mouseY;

    this.mouseX.set(mouseX);
    this.mouseY.set(mouseY);

    function updateSmooth()
    {
        if(speed<=0)speed=0.01;
        var distanceX = Math.abs(mouseX - lineX);
        var speedX = Math.round( distanceX / speed, 0 );
        lineX = (lineX < mouseX) ? lineX + speedX : lineX - speedX;

        var distanceY = Math.abs(mouseY - lineY);
        var speedY = Math.round( distanceY / speed, 0 );
        lineY = (lineY < mouseY) ? lineY + speedY : lineY - speedY;

        setValue(lineX,lineY);
    }

    cgl.canvas.onmouseenter = function(e)
    {
        speed=self.smoothSpeed.get();
    };

    cgl.canvas.onmousedown = function(e)
    {
        self.mouseDown.set(true);
    };

    cgl.canvas.onmouseup = function(e)
    {
        self.mouseDown.set(false);
        self.mouseClick.set(false);
    };

    cgl.canvas.onmouseclick = function(e)
    {
        self.mouseClick.set(true);
    };

    cgl.canvas.onmousewheel=function(e)
    {
        // console.log('e',e);
    };

    function mouseLeave(e)
    {
        speed=100;
        if(self.smooth.get())
        {
            mouseX=cgl.canvas.width/2;
            mouseY=cgl.canvas.height/2;
        }
    }
    cgl.canvas.onmouseleave=mouseLeave;

    cgl.canvas.onmousemove = function(e)
    {
        if(self.smooth.get())
        {
            mouseX=e.offsetX;
            mouseY=e.offsetY;
        }
        else
        {
            setValue(e.offsetX,e.offsetY);
        }
    };

};

Ops.Gl.Mouse.prototype = new Op();



// --------------------------------------------------------------------------
    
Ops.Gl.TextureEmpty = function()
{
    Op.apply(this, arguments);
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

Ops.Gl.TextureEmpty.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.TextureCycler = function()
{
    Op.apply(this, arguments);
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

Ops.Gl.TextureCycler.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Texture = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='texture';
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'image' } ));
    this.filter=this.addInPort(new Port(this,"filter",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['nearest','linear','mipmap']}));

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.flip=this.addInPort(new Port(this,"flip",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.flip.set(false);
    
    this.cgl_filter=CGL.Texture.FILTER_MIPMAP;

    var reload=function()
    {
        if(self.filename.get())
        {
            // console.log('load texture... '+self.filename.val);
            self.tex=CGL.Texture.load(cgl,self.patch.getFilePath(self.filename.get()),function()
            {
                self.textureOut.val=self.tex;
                self.width.set(self.tex.width);
                self.height.set(self.tex.height);

                if(!self.tex.isPowerOfTwo()) self.uiAttr({warning:'texture dimensions not power of two! - texture filtering will not work.'});
                else self.uiAttr({warning:''});

            },{flip:self.flip.get(),filter:self.cgl_filter});
            self.textureOut.set(self.tex);
        }

    };

    this.flip.onValueChanged=reload;
    this.filename.onValueChanged=reload;
    this.filter.onValueChanged=function()
    {
        if(self.filter.get()=='nearest') self.cgl_filter=CGL.Texture.FILTER_NEAREST;
        if(self.filter.get()=='linear') self.cgl_filter=CGL.Texture.FILTER_LINEAR;
        if(self.filter.get()=='mipmap') self.cgl_filter=CGL.Texture.FILTER_MIPMAP;

        reload();
    };
    this.filter.set('linear');
    

    this.textureOut.onPreviewChanged=function()
    {
        if(self.textureOut.showPreview) CGL.Texture.previewTexture=self.textureOut.get();
    };

};

Ops.Gl.Texture.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes=Ops.Gl.Meshes || {};

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Plotter = function()
{
    Op.apply(this, arguments);
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

Ops.Gl.Meshes.Plotter.prototype = new Op();


// --------------------------------------------------------------------------

Ops.Gl.Matrix={};


// --------------------------------------------------------------------------

Ops.Gl.Matrix.LookatCamera = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='LookatCamera';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.centerX=this.addInPort(new Port(this,"centerX"));
    this.centerY=this.addInPort(new Port(this,"centerY"));
    this.centerZ=this.addInPort(new Port(this,"centerZ"));

    this.eyeX=this.addInPort(new Port(this,"eyeX"));
    this.eyeY=this.addInPort(new Port(this,"eyeY"));
    this.eyeZ=this.addInPort(new Port(this,"eyeZ"));

    this.vecUpX=this.addInPort(new Port(this,"upX"));
    this.vecUpY=this.addInPort(new Port(this,"upY"));
    this.vecUpZ=this.addInPort(new Port(this,"upZ"));

    this.centerX.set(0);
    this.centerY.set(0);
    this.centerZ.set(0);

    this.eyeX.set(5);
    this.eyeY.set(5);
    this.eyeZ.set(5);

    this.vecUpX.set(0);
    this.vecUpY.set(1);
    this.vecUpZ.set(0);
    
    var vUp=vec3.create();
    var vEye=vec3.create();
    var vCenter=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();

        vec3.set(vUp, self.vecUpX.get(),self.vecUpY.get(),self.vecUpZ.get());
        vec3.set(vEye, self.eyeX.get(),self.eyeY.get(),self.eyeZ.get());
        vec3.set(vCenter, self.centerX.get(),self.centerY.get(),self.centerZ.get());

        mat4.lookAt(cgl.mvMatrix, vEye, vCenter, vUp);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

};

Ops.Gl.Matrix.LookatCamera.prototype = new Op();

// -----------------------------------------------------

Ops.Gl.Matrix.MatrixMul = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;
    this.name='matrix';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.matrix=this.addInPort(new Port(this,"matrix"),OP_PORT_TYPE_ARRAY);

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,self.matrix.get());
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    this.matrix.set( [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] );
};

Ops.Gl.Matrix.MatrixMul.prototype = new Op();



// --------------------------------------------------------------------------

Ops.Gl.Render2Texture = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    var depthTextureExt = cgl.gl.getExtension('WEBGL_depth_texture') ||
                    cgl.gl.getExtension( "WEBKIT_WEBGL_depth_texture" ) ||
                    cgl.gl.getExtension( "MOZ_WEBGL_depth_texture" );

    if(!depthTextureExt)
    {
        console.log('depth buffer ext problem');
    }

    // var depthTextureExt = cgl.gl.getExtension("WEBKIT_WEBGL_depth_texture"); // Or browser-appropriate prefix

    this.name='render to texture';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var frameBuf;
    var texture=new CGL.Texture(cgl);
    var textureDepth=new CGL.Texture(cgl,{isDepthTexture:true});

    this.useVPSize=this.addInPort(new Port(this,"use viewport size",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.width=this.addInPort(new Port(this,"texture width"));
    this.height=this.addInPort(new Port(this,"texture height"));

    this.tex=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.texDepth=this.addOutPort(new Port(this,"textureDepth",OP_PORT_TYPE_TEXTURE));
    var depthBuffer=null;

    frameBuf = cgl.gl.createFramebuffer();
    depthBuffer = cgl.gl.createRenderbuffer();

    self.tex.set( texture );
    self.texDepth.set ( textureDepth );

    function resize()
    {
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, depthBuffer);

        self.width.set( cgl.getViewPort()[2] );
        self.height.set( cgl.getViewPort()[3] );
        texture.setSize(self.width.get(),self.height.get());
        textureDepth.setSize(self.width.get(),self.height.get());

        // if(depthBuffer)cgl.gl.deleteRenderbuffer(depthBuffer);

        
        cgl.gl.renderbufferStorage(cgl.gl.RENDERBUFFER, cgl.gl.DEPTH_COMPONENT16, self.width.get(),self.height.get());

        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, texture.tex, 0);
        cgl.gl.framebufferRenderbuffer(cgl.gl.FRAMEBUFFER, cgl.gl.DEPTH_ATTACHMENT, cgl.gl.RENDERBUFFER, depthBuffer);

        cgl.gl.framebufferTexture2D(
            cgl.gl.FRAMEBUFFER,
            cgl.gl.DEPTH_ATTACHMENT,
            cgl.gl.TEXTURE_2D,
            textureDepth.tex,
            0 );

        // if (!cgl.gl.isFramebuffer(frameBuf)) {
        //     throw("Invalid framebuffer");
        // }
        // var status = cgl.gl.checkFramebufferStatus(cgl.gl.FRAMEBUFFER);
        // switch (status) {
        //     case cgl.gl.FRAMEBUFFER_COMPLETE:
        //         break;
        //     case cgl.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
        //         break;
        //     case cgl.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
        //         break;
        //     case cgl.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
        //         break;
        //     case cgl.gl.FRAMEBUFFER_UNSUPPORTED:
        //         throw("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
        //         break;
        //     default:
        //         throw("Incomplete framebuffer: " + status);
        // }

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

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

    this.width.set(1920);
    this.height.set(1080);
    this.useVPSize.set(true);

    var oldViewport;

    this.onResize=resize;


    function render()
    {
        cgl.pushMvMatrix();

        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

        if(self.useVPSize.get())
        {
            if(texture.width!=cgl.getViewPort()[2] || texture.height!=cgl.getViewPort()[3] )
            {
                console.log('not the same ? ',texture.width, cgl.getViewPort()[2] , texture.height , cgl.getViewPort()[3]);
                        
                for(var i=0;i<self.patch.ops.length;i++)
                {
                    if(self.patch.ops[i].onResize)self.patch.ops[i].onResize();
                }
            }
        }

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);

        cgl.pushPMatrix();
        // cgl.gl.viewport(-self.width/2, 0, self.width.val/2,self.height.val);

        cgl.gl.viewport(0, 0, self.width.get() ,self.height.get() );
        // mat4.perspective(cgl.pMatrix,45, 1, 0.01, 1100.0);

        // if(self.clear.val)
        // {
        //     cgl.gl.clearColor(0,0,0,1);
        //     cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        // }
        // else
        // {
            cgl.gl.clearColor(0,0,0,0);
            cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        // }

        self.trigger.trigger();

        cgl.popPMatrix();
        
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);
        
        cgl.popMvMatrix();
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

Ops.Gl.Render2Texture.prototype = new Op();











// ----------------------------------------------------

Ops.Gl.Spray = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='spray';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    

    this.timer=this.addInPort(new Port(this,"time"));

    this.num=this.addInPort(new Port(this,"num"));
    this.size=this.addInPort(new Port(this,"size"));

    
    this.lifetime=this.addInPort(new Port(this,"lifetime"));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION)) ;
    this.idx=this.addOutPort(new Port(this,"index")) ;
    this.lifeTimePercent=this.addOutPort(new Port(this,"lifeTimePercent")) ;
    var particles=[];

    var transVec=vec3.create();

    function Particle()
    {
        this.pos=null;

        this.startPos=null;
        this.startTime=0;
        this.lifeTime=0;
        this.lifeTimePercent=0;
        this.endTime=0;

        this.pos=[0,0,0];
        this.moveVec=[0,0,0];
        this.idDead=false;

        this.update=function(time)
        {
            var timeRunning=time-this.startTime;
            if(time>this.endTime)this.isDead=true;
            this.lifeTimePercent=timeRunning/this.lifeTime;
        
            this.pos=vec3.fromValues(
                this.startPos[0]+timeRunning*this.moveVec[0],
                this.startPos[1]+timeRunning*this.moveVec[1],
                this.startPos[2]+timeRunning*this.moveVec[2]
                );
        };

        this.reAnimate=function(time)
        {
            this.isDead=false;
            this.startTime=time;
            this.lifeTime=Math.random()*self.lifetime.get();
            this.endTime=time+this.lifeTime;
            this.startPos=vec3.fromValues(
                Math.random()*0.5,
                Math.random()*0.5,
                Math.random()*0.5);

            this.moveVec=[
                Math.random()*0.2,
                Math.random()*0.2,
                Math.random()*0.2
                ];

                    

        };
        this.reAnimate(0);
    }




    this.exe.onTriggered=function()
    {
        // var time=self.patch.timer.getTime();
        var time=self.timer.get();
        for(var i=0;i<particles.length;i++)
        {
            if(particles[i].isDead)particles[i].reAnimate(time);
            
            particles[i].update(time);

            cgl.pushMvMatrix();

            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, particles[i].pos);


            self.idx.set(i);
            self.lifeTimePercent.val= particles[i].lifeTimePercent;
            // self.rnd.val=self.randomsFloats[i];

            self.trigger.trigger();

            cgl.popMvMatrix();
        }
    };

    function reset()
    {
        particles.length=0;

        for(var i=0;i<self.num.val;i++)
        {
            var p=new Particle();
            p.reAnimate(0);
            particles.push(p);
        }
    }

    this.num.onValueChanged=reset;
    this.size.onValueChanged=reset;
    this.lifetime.onValueChanged=reset;

    this.num.val=100;
    reset();
};

Ops.Gl.Spray.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.ViewPortSize = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ViewPortSize';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.x=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.y=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var w=0,h=0,x=0,y=0;

    this.exe.onTriggered=function()
    {
        if(cgl.getViewPort()[0]!=x) w=self.x.val=cgl.getViewPort()[0];
        if(cgl.getViewPort()[1]!=y) h=self.y.val=cgl.getViewPort()[1];
        if(cgl.getViewPort()[2]!=h) h=self.width.val=cgl.getViewPort()[2];
        if(cgl.getViewPort()[3]!=w) w=self.height.val=cgl.getViewPort()[3];
        self.trigger.trigger();
    };
};

Ops.Gl.ViewPortSize.prototype = new Op();



// --------------------------------------------------------------------------

Ops.Gl.SpotLight = function()
{
    Op.apply(this, arguments);
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

Ops.Gl.SpotLight.prototype = new Op();





















