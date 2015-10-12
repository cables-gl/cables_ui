
//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl=Ops.Gl || {};




Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='renderer';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var identTranslate=vec3.create();
    vec3.set(identTranslate, 0,0,-2);
    cgl.canvas = document.getElementById("glcanvas");
    cgl.patch=self.patch;

    this.onAnimFrame=function(time)
    {
        if(cgl.canvasWidth!=cgl.canvas.clientWidth || cgl.canvasHeight!=cgl.canvas.clientHeight)
        {
            cgl.canvasWidth=cgl.canvas.clientWidth;
            self.width.val=cgl.canvasWidth;
            cgl.canvasHeight=cgl.canvas.clientHeight;
            self.height.val=cgl.canvasHeight;
        }

        Ops.Gl.Renderer.renderStart(identTranslate);

        self.trigger.trigger();

        if(CGL.Texture.previewTexture)
        {
            if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview();
            CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
        }
        Ops.Gl.Renderer.renderEnd();
    };

};


Ops.Gl.Renderer.renderStart=function(identTranslate)
{
    cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.gl.clearColor(0,0,0,1);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    cgl.setViewPort(0,0,cgl.canvas.clientWidth,cgl.canvas.clientHeight);
    mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.01, 1100.0);

    cgl.pushPMatrix();
    cgl.pushMvMatrix();

    mat4.identity(cgl.mvMatrix);
    mat4.translate(cgl.mvMatrix,cgl.mvMatrix, identTranslate);

    cgl.gl.enable(cgl.gl.BLEND);
    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.beginFrame();
};

Ops.Gl.Renderer.renderEnd=function(identTranslate)
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

    this.name='Perspective';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.fovY=this.addInPort(new Port(this,"fov",OP_PORT_TYPE_VALUE ));
    this.fovY.val=45;

    this.zNear=this.addInPort(new Port(this,"frustum near",OP_PORT_TYPE_VALUE ));
    this.zNear.val=0.01;

    this.zFar=this.addInPort(new Port(this,"frustum far",OP_PORT_TYPE_VALUE ));
    this.zFar.val=2000.0;


    this.render.onTriggered=function()
    {
        mat4.perspective(cgl.pMatrix,self.fovY.val*0.0174533, cgl.getViewPort()[2]/cgl.getViewPort()[3], self.zNear.val, self.zFar.val);
        cgl.pushPMatrix();

        self.trigger.trigger();

        cgl.popPMatrix();
    };

    this.fovY.onValueChanged=function()
    {

    };

};

Ops.Gl.Perspective.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.LetterBox = function()
{
    Op.apply(this, arguments);
    var self=this;

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


Ops.Gl.ClearColor = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearColor';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true'}));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r.val=0.3;
    this.g.val=0.3;
    this.b.val=0.3;
    this.a.val=1.0;
    this.render.onTriggered=function()
    {
        cgl.gl.clearColor(self.r.val,self.g.val,self.b.val,self.a.val);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        self.trigger.trigger();
    };
};

Ops.Gl.ClearColor.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.FaceCulling = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='FaceCulling';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.enable=this.addInPort(new Port(this,"enable",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.enable.val=true;

    this.facing=this.addInPort(new Port(this,"facing",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:['back','front','both']} ));
    this.facing.val='back';

    var whichFace=cgl.gl.BACK;
    this.render.onTriggered=function()
    {
        cgl.gl.cullFace(whichFace);

        if(self.enable.val) cgl.gl.enable(cgl.gl.CULL_FACE);
        else cgl.gl.disable(cgl.gl.CULL_FACE);

        self.trigger.trigger();

        cgl.gl.disable(cgl.gl.CULL_FACE);
    };

    this.facing.onValueChanged=function()
    {
        whichFace=cgl.gl.BACK;
        if(self.facing.val=='front')whichFace=cgl.gl.FRONT;
        if(self.facing.val=='both')whichFace=cgl.gl.FRONT_AND_BACK;
    };
};

Ops.Gl.FaceCulling.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Depth = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Depth';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.clear=this.addInPort(new Port(this,"clear depth",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.enable=this.addInPort(new Port(this,"enable depth testing",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.write=this.addInPort(new Port(this,"write to depth buffer",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.depthFunc=this.addInPort(new Port(this,"ratio",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:['never','always','less','less or equal','greater', 'greater or equal','equal','not equal']} ));

    var theDepthFunc=cgl.gl.LEQUAL;

    this.depthFunc.onValueChanged=function()
    {
        if(self.depthFunc.val=='never') theDepthFunc=cgl.gl.NEVER;
        if(self.depthFunc.val=='always') theDepthFunc=cgl.gl.ALWAYS;
        if(self.depthFunc.val=='less') theDepthFunc=cgl.gl.LESS;
        if(self.depthFunc.val=='less or equal') theDepthFunc=cgl.gl.LEQUAL;
        if(self.depthFunc.val=='greater') theDepthFunc=cgl.gl.GREATER;
        if(self.depthFunc.val=='greater or equal') theDepthFunc=cgl.gl.EQUAL;
        if(self.depthFunc.val=='equal') theDepthFunc=cgl.gl.EQUAL;
        if(self.depthFunc.val=='not equal') theDepthFunc=cgl.gl.NOTEQUAL;
    };

    this.depthFunc.val='less or equal';

    this.clear.val=false;
    this.enable.val=true;
    this.write.val=true;

    this.render.onTriggered=function()
    {
        if(true===self.clear.val) cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
        if(true!==self.enable.val) cgl.gl.disable(cgl.gl.DEPTH_TEST);
        if(true!==self.write.val) cgl.gl.depthMask(false);

        cgl.gl.depthFunc(theDepthFunc);

        self.trigger.trigger();

        cgl.gl.enable(cgl.gl.DEPTH_TEST);
        cgl.gl.depthMask(true);
        cgl.gl.depthFunc(cgl.gl.LEQUAL);
    };

};

Ops.Gl.Depth.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.ClearDepth = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearDepth';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
        self.trigger.trigger();
    };
};

Ops.Gl.ClearDepth.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Wireframe = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Wireframe';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.lineWidth=this.addInPort(new Port(this,"lineWidth"));

    this.render.onTriggered=function()
    {
        cgl.wireframe=true;
        cgl.gl.lineWidth(self.lineWidth.val);
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

    this.name='Points';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.pointSize=this.addInPort(new Port(this,"pointSize"));

    this.render.onTriggered=function()
    {
        cgl.points=true;
        // gl.pointSize(self.pointSize.val);
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

    this.name='mouse';
    this.mouseX=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.mouseY=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));

    this.normalize=this.addInPort(new Port(this,"normalize",OP_PORT_TYPE_VALUE,{display:'bool'}));

    this.canvas = document.getElementById("glcanvas");

    this.canvas.onmousemove = function(e)
    {
        if(self.normalize.val)
        {
            self.mouseX.val=e.offsetX/self.canvas.width*2.0-1.0;
            self.mouseY.val=e.offsetY/self.canvas.height*2.0-1.0;
        }
        else
        {
            self.mouseX.val=e.offsetX;
            self.mouseY.val=e.offsetY;
        }

    };
};

Ops.Gl.Mouse.prototype = new Op();

// --------------------------------------------------------------------------
    
Ops.Gl.TextureEmpty = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='texture empty';
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.tex=new CGL.Texture();
    
    var sizeChanged=function()
    {
        self.tex.setSize(self.width.val,self.height.val);
        self.textureOut.val=self.tex;
    };

    this.width.onValueChanged=sizeChanged;
    this.height.onValueChanged=sizeChanged;

    this.width.val=8;
    this.height.val=8;
};

Ops.Gl.TextureEmpty.prototype = new Op();

// --------------------------------------------------------------------------
    
Ops.Gl.Texture = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='texture';
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'image' } ));
    this.filter=this.addInPort(new Port(this,"filter",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['nearest','linear','mipmap']}));

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));
    
    this.filter.val='linear';
    this.cgl_filter=CGL.Texture.FILTER_LINEAR;

    var reload=function()
    {
        // console.log('load texture...');
        self.tex=CGL.Texture.load(self.filename.val,function()
        {
            self.textureOut.val=self.tex;
            self.width.val=self.tex.width;
            self.height.val=self.tex.height;
        },{filter:self.cgl_filter});
        self.textureOut.val=self.tex;

    };

    this.filename.onValueChanged=reload;
    this.filter.onValueChanged=function()
    {
        if(self.filter.val=='nearest') self.cgl_filter=CGL.Texture.FILTER_NEAREST;
        if(self.filter.val=='linear') self.cgl_filter=CGL.Texture.FILTER_LINEAR;
        if(self.filter.val=='mipmap') self.cgl_filter=CGL.Texture.FILTER_MIPMAP;

        reload();
    };


    this.textureOut.onPreviewChanged=function()
    {
        if(self.textureOut.showPreview) CGL.Texture.previewTexture=self.textureOut.val;
        // if(self.texture.showPreview) self.render.onTriggered=self.texture.val.preview;
        // else self.render.onTriggered=self.doRender;

        // console.log('show preview!');
    };

};

Ops.Gl.Texture.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.TextureText = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TextureText';
    this.text=this.addInPort(new Port(this,"text",OP_PORT_TYPE_VALUE,{type:'string'}));
    this.fontSize=this.addInPort(new Port(this,"fontSize"));
    this.align=this.addInPort(new Port(this,"align",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['left','center','right']}));
    this.font=this.addInPort(new Port(this,"font"));
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    
    this.fontSize.val=30;
    this.font.val='Arial';
    this.align.val='center';

    var canvas = document.createElement('canvas');
    canvas.id     = "hiddenCanvas";
    canvas.width  = 512;
    canvas.height = 512;
    canvas.style.display   = "none";
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(canvas);

    var fontImage = document.getElementById('hiddenCanvas');
    var ctx = fontImage.getContext('2d');

    function refresh()
    {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = self.fontSize.val+"px "+self.font.val;
        ctx.textAlign = self.align.val;
        if(self.align.val=='center') ctx.fillText(self.text.val, ctx.canvas.width / 2, ctx.canvas.height / 2);
        if(self.align.val=='left') ctx.fillText(self.text.val, 0, ctx.canvas.height / 2);
        if(self.align.val=='right') ctx.fillText(self.text.val, ctx.canvas.width, ctx.canvas.height / 2);
        ctx.restore();

        if(self.textureOut.val) self.textureOut.val.initTexture(fontImage);
            else self.textureOut.val=new CGL.Texture.fromImage(fontImage);
    }

    this.align.onValueChanged=refresh;
    this.text.onValueChanged=refresh;
    this.fontSize.onValueChanged=refresh;
    this.font.onValueChanged=refresh;
    this.text.val='cables';
};

Ops.Gl.TextureText.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Meshes.Plotter = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Plotter';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.v=this.addInPort(new Port(this,"value"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        cgl.gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),self.buffer.itemSize, cgl.gl.FLOAT, false, 0, 0);
        cgl.getShader().bind();
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
        self.vertices.push(self.v.val);
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

Ops.Gl.Matrix.Translate = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='translate';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.x=this.addInPort(new Port(this,"x"));
    this.y=this.addInPort(new Port(this,"y"));
    this.z=this.addInPort(new Port(this,"z"));
    this.x.val=0.0;
    this.y.val=0.0;
    this.z.val=0.0;
    
    var vec=vec3.create();

    this.render.onTriggered=function()
    {
        vec3.set(vec, self.x.val,self.y.val,self.z.val);
        cgl.pushMvMatrix();
        mat4.translate(cgl.mvMatrix,cgl.mvMatrix, vec);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };
};

Ops.Gl.Matrix.Translate.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Matrix.Scale = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='scale';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.scale=this.addInPort(new Port(this,"scale"));
    
    var vScale=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,transMatrix);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.scaleChanged=function()
    {
        doScale=false;
        vec3.set(vScale, self.scale.val,self.scale.val,self.scale.val);
        updateMatrix();
    };

    this.scale.onValueChanged=this.scaleChanged;
    this.scale.val=1.0;
    updateMatrix();
};

Ops.Gl.Matrix.Scale.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Matrix.LookatCamera = function()
{
    Op.apply(this, arguments);
    var self=this;

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

    this.centerX.val=0;
    this.centerY.val=0;
    this.centerZ.val=0;

    this.eyeX.val=5;
    this.eyeY.val=5;
    this.eyeZ.val=5;

    this.vecUpX.val=0;
    this.vecUpY.val=1;
    this.vecUpZ.val=0;
    
    var vUp=vec3.create();
    var vEye=vec3.create();
    var vCenter=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();

        vec3.set(vUp, self.vecUpX.val,self.vecUpY.val,self.vecUpZ.val);
        vec3.set(vEye, self.eyeX.val,self.eyeY.val,self.eyeZ.val);
        vec3.set(vCenter, self.centerX.val,self.centerY.val,self.centerZ.val);

        mat4.lookAt(cgl.mvMatrix, vEye, vCenter, vUp);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

};

Ops.Gl.Matrix.LookatCamera.prototype = new Op();

// ----------------------------------------------------


Ops.Gl.Matrix.Shear = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='Shear';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.shearX=this.addInPort(new Port(this,"shearX"));
    this.shearY=this.addInPort(new Port(this,"shearY"));

    var shearMatrix = mat4.create();

    function update()
    {
        mat4.identity(shearMatrix);
        shearMatrix[1]=Math.tan(self.shearX.val);
        shearMatrix[4]=Math.tan(self.shearY.val);
    }

    this.shearY.onValueChanged=update;
    this.shearX.onValueChanged=update;

    // 1, shearY, 0, 0, 
    //   shearX, 1, 0, 0,
    //   0, 0, 1, 0,
    //   0, 0, 0, 1 };

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();

        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,shearMatrix);
        self.trigger.trigger();

        cgl.popMvMatrix();
    };

    self.shearX.val=0.0;
    self.shearY.val=0.0;
};

Ops.Gl.Matrix.Shear.prototype = new Op();

// -----------------------------------------------------

Ops.Gl.Matrix.Transform = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='transform';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.posX=this.addInPort(new Port(this,"posX"));
    this.posY=this.addInPort(new Port(this,"posY"));
    this.posZ=this.addInPort(new Port(this,"posZ"));

    this.scaleX=this.addInPort(new Port(this,"scaleX"));
    this.scaleY=this.addInPort(new Port(this,"scaleY"));
    this.scaleZ=this.addInPort(new Port(this,"scaleZ"));

    this.rotX=this.addInPort(new Port(this,"rotX"));
    this.rotY=this.addInPort(new Port(this,"rotY"));
    this.rotZ=this.addInPort(new Port(this,"rotZ"));
   
    var vPos=vec3.create();
    var vScale=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;
    var doTranslate=false;

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,transMatrix);

        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

        if(self.rotX.val!==0)mat4.rotateX(transMatrix,transMatrix, self.rotX.val*CGL.DEG2RAD);
        if(self.rotY.val!==0)mat4.rotateY(transMatrix,transMatrix, self.rotY.val*CGL.DEG2RAD);
        if(self.rotZ.val!==0)mat4.rotateZ(transMatrix,transMatrix, self.rotZ.val*CGL.DEG2RAD);

        if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.translateChanged=function()
    {
        doTranslate=false;
        if(self.posX.val!==0.0 || self.posY.val!==0.0 || self.posZ.val!==0.0)doTranslate=true;
        vec3.set(vPos, self.posX.val,self.posY.val,self.posZ.val);
        updateMatrix();
    };

    this.scaleChanged=function()
    {
        doScale=false;
        if(self.scaleX.val!==0.0 || self.scaleY.val!==0.0 || self.scaleZ.val!==0.0)doScale=true;
        vec3.set(vScale, self.scaleX.val,self.scaleY.val,self.scaleZ.val);
        updateMatrix();
    };

    this.rotChanged=function()
    {
        updateMatrix();
    };

    this.rotX.onValueChanged=this.rotChanged;
    this.rotY.onValueChanged=this.rotChanged;
    this.rotZ.onValueChanged=this.rotChanged;

    this.scaleX.onValueChanged=this.scaleChanged;
    this.scaleY.onValueChanged=this.scaleChanged;
    this.scaleZ.onValueChanged=this.scaleChanged;

    this.posX.onValueChanged=this.translateChanged;
    this.posY.onValueChanged=this.translateChanged;
    this.posZ.onValueChanged=this.translateChanged;

    this.rotX.val=0.0;
    this.rotY.val=0.0;
    this.rotZ.val=0.0;

    this.scaleX.val=1.0;
    this.scaleY.val=1.0;
    this.scaleZ.val=1.0;

    this.posX.val=0.0;
    this.posY.val=0.0;
    this.posZ.val=0.0;

    updateMatrix();
};

Ops.Gl.Matrix.Transform.prototype = new Op();

// ----------------------------------------------------

Ops.Gl.Matrix.MatrixMul = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='matrix';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.matrix=this.addInPort(new Port(this,"matrix"),OP_PORT_TYPE_ARRAY);


    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,self.matrix.val);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };


    // this.matrix.onValueChanged=update;

    this.matrix.val=[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

};

Ops.Gl.Matrix.MatrixMul.prototype = new Op();


// -----------------------------------------

Ops.RandomCluster = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='random cluster';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.num=this.addInPort(new Port(this,"num"));
    this.size=this.addInPort(new Port(this,"size"));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION)) ;
    this.idx=this.addOutPort(new Port(this,"index")) ;
    this.rnd=this.addOutPort(new Port(this,"rnd")) ;
    this.randoms=[];
    this.randomsRot=[];
    this.randomsFloats=[];

    var transVec=vec3.create();

    this.exe.onTriggered=function()
    {
        for(var i=0;i<self.randoms.length;i++)
        {
            cgl.pushMvMatrix();

            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, self.randoms[i]);

            mat4.rotateX(cgl.mvMatrix,cgl.mvMatrix, self.randomsRot[i][0]);
            mat4.rotateY(cgl.mvMatrix,cgl.mvMatrix, self.randomsRot[i][1]);
            mat4.rotateZ(cgl.mvMatrix,cgl.mvMatrix, self.randomsRot[i][2]);

            self.idx.val=i;
            self.rnd.val=self.randomsFloats[i];

            self.trigger.trigger();

            cgl.popMvMatrix();
        }
    };

    function reset()
    {
        self.randoms=[];
        self.randomsRot=[];
        self.randomsFloats=[];

        for(var i=0;i<self.num.val;i++)
        {
            self.randomsFloats.push(Math.random());
            self.randoms.push(vec3.fromValues(
                (Math.random()-0.5)*self.size.val,
                (Math.random()-0.5)*self.size.val,
                (Math.random()-0.5)*self.size.val
                ));
            self.randomsRot.push(vec3.fromValues(
                Math.random()*360*CGL.DEG2RAD,
                Math.random()*360*CGL.DEG2RAD,
                Math.random()*360*CGL.DEG2RAD
                ));
        }
    }

    this.size.val=40;

    this.num.onValueChanged=reset;
    this.size.onValueChanged=reset;

    this.num.val=100;
};

Ops.RandomCluster.prototype = new Op();


// --------------------------------------------------------------------------

Ops.Gl.Render2Texture = function()
{
    Op.apply(this, arguments);
    var self=this;

    var depthTextureExt = cgl.gl.getExtension( "WEBKIT_WEBGL_depth_texture" ) ||
                    cgl.gl.getExtension( "MOZ_WEBGL_depth_texture" ) ||
                    cgl.gl.getExtension('WEBGL_depth_texture');
    // var depthTextureExt = cgl.gl.getExtension("WEBKIT_WEBGL_depth_texture"); // Or browser-appropriate prefix

    this.name='render to texture';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var frameBuf;
    var texture=new CGL.Texture();
    var textureDepth=new CGL.Texture({isDepthTexture:true});

    this.useVPSize=this.addInPort(new Port(this,"use viewport size",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.width=this.addInPort(new Port(this,"texture width"));
    this.height=this.addInPort(new Port(this,"texture height"));
    // this.clear=this.addInPort(new Port(this,"clear",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    // this.clear.val=true;

    this.tex=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.texDepth=this.addOutPort(new Port(this,"textureDepth",OP_PORT_TYPE_TEXTURE));
    var renderbuffer=null;

    frameBuf = cgl.gl.createFramebuffer();

    self.tex.val=texture;
    self.texDepth.val=textureDepth;

    function resize()
    {
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);

        self.width.val=cgl.getViewPort()[2];
        self.height.val=cgl.getViewPort()[3];

        if(renderbuffer)cgl.gl.deleteRenderbuffer(renderbuffer);

        renderbuffer = cgl.gl.createRenderbuffer();
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, renderbuffer);
        cgl.gl.renderbufferStorage(cgl.gl.RENDERBUFFER, cgl.gl.DEPTH_COMPONENT16, self.width.val,self.height.val);

        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, texture.tex, 0);
        cgl.gl.framebufferRenderbuffer(cgl.gl.FRAMEBUFFER, cgl.gl.DEPTH_ATTACHMENT, cgl.gl.RENDERBUFFER, renderbuffer);

        cgl.gl.framebufferTexture2D(
            cgl.gl.FRAMEBUFFER,
            cgl.gl.DEPTH_ATTACHMENT,
            cgl.gl.TEXTURE_2D,
            textureDepth.tex,
            0 );

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        // console.log('resize r2t',self.width.val,self.height.val);

        texture.setSize(self.width.val,self.height.val);
        textureDepth.setSize(self.width.val,self.height.val);
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

    this.width.val=1920;
    this.height.val=1080;
    this.useVPSize.val=true;

    var oldViewport;

    this.onResize=resize;


    function render()
    {
        cgl.pushMvMatrix();

        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

        if(self.useVPSize.val)
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

        cgl.gl.viewport(0, 0, self.width.val,self.height.val);
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
            this.lifeTime=Math.random()*self.lifetime.val;
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
        var time=self.timer.val;
        for(var i=0;i<particles.length;i++)
        {
            if(particles[i].isDead)particles[i].reAnimate(time);
            
            particles[i].update(time);

            cgl.pushMvMatrix();

            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, particles[i].pos);


            self.idx.val=i;
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

Ops.Gl.Identity = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Identity';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);
        mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.01, 1100.0);

        self.trigger.trigger();

        cgl.popMvMatrix();
    };

};

Ops.Gl.Identity.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.CanvasSize = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='CanvasSize';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var w=0,h=0;

    this.exe.onTriggered=function()
    {
        if(cgl.canvasHeight!=h) h=self.height.val=cgl.canvasHeight;
        if(cgl.canvasWidth!=w) w=self.width.val=cgl.canvasWidth;
        self.trigger.trigger();
    };
};

Ops.Gl.CanvasSize.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.ViewPortSize = function()
{
    Op.apply(this, arguments);
    var self=this;

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

Ops.Gl.Performance = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Performance';
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));

    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION)) ;

    
    var canvas = document.createElement('canvas');
    canvas.id     = "performance";
    canvas.width  = 512;
    canvas.height = 128;
    canvas.style.display   = "block";
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(canvas);

    var fontImage = document.getElementById('performance');
    var ctx = fontImage.getContext('2d');

    var text='';

    ctx.font = "13px arial";
    ctx.fillStyle = 'white';

    var frames=0;
    var fps=0;
    var fpsStartTime=0;

    var lastTime=0;

    var queue=[];
    for(var i=0;i<canvas.width;i++)
    {
        queue[i]=-1;
    }

    var avgMs=0;
    var text2='';

    var ll=0;
    var selfTime=0;

    function refresh()
    {
        ll=performance.now();

        var ms=performance.now()-lastTime;
        queue.push(ms);
        queue.shift();
        frames++;
        
        if(fpsStartTime===0)fpsStartTime=Date.now();
        if(Date.now()-fpsStartTime>=1000)
        {
            fps=frames;
            frames=0;
            text='fps: '+fps;
            fpsStartTime=Date.now();

            var count=0;
            for(var i=0;i<queue.length;i++)
            {
                if(queue[i]>-1)
                {
                    avgMs+=queue[i];
                    count++;
                }
            }
            avgMs/=count;
            text2='avg ms: '+Math.round(avgMs*100)/100+' ('+Math.round((selfTime)*100)/100+')';

        }
        ctx.clearRect(0,0,canvas.width,canvas.height);

        ctx.fillStyle="#222222";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#aaaaaa";

        for(var i=0;i<512;i++)
        {
            ctx.fillRect(i,canvas.height-queue[i],1,queue[i]);
        }

        ctx.fillText(text, 10, 20);
        ctx.fillText(text2, 10, 35);
        ctx.restore();

        if(self.textureOut.val) self.textureOut.val.initTexture(fontImage);
            else self.textureOut.val=new CGL.Texture.fromImage(fontImage);

        lastTime=performance.now();
        selfTime=performance.now()-ll;
        
        self.trigger.trigger();
    }

    self.exe.onTriggered=refresh;
    if(CABLES.UI)gui.setLayout();
};

Ops.Gl.Performance.prototype = new Op();

// --------------------------------------------------------------------------

