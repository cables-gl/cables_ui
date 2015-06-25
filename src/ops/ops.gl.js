
//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl=Ops.Gl || {};


var GL=null;

Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='render';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var initTranslate=vec3.create();
    vec3.set(initTranslate, 0,0,-2);

    this.onAnimFrame=function(time)
    {
        cgl.canvasWidth=self.canvas.clientWidth;
        cgl.canvasHeight=self.canvas.clientHeight;

        gl.enable(gl.DEPTH_TEST);
        GL.clearColor(0,0,0,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        gl.viewport(0,0,self.canvas.clientWidth,self.canvas.clientHeight);
        mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.01, 1100.0);

        cgl.pushPMatrix();
        cgl.pushMvMatrix();

        mat4.identity(cgl.mvMatrix);
        mat4.translate(cgl.mvMatrix,cgl.mvMatrix, initTranslate);

        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA,GL.ONE_MINUS_SRC_ALPHA);

        cgl.beginFrame();

        self.trigger.call();

        cgl.popMvMatrix();
        cgl.popPMatrix();
        cgl.endFrame();
    };

    this.canvas = document.getElementById("glcanvas");
    GL = this.canvas.getContext("experimental-webgl");
    gl = this.canvas.getContext("experimental-webgl");

};

Ops.Gl.Renderer.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.ClearColor = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearColor';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r"));
    this.g=this.addInPort(new Port(this,"g"));
    this.b=this.addInPort(new Port(this,"b"));

    this.r.val=0.3;
    this.g.val=0.3;
    this.b.val=0.3;
    this.render.onTriggered=function()
    {
        GL.clearColor(self.r.val,self.g.val,self.b.val,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        self.trigger.call();
    };
};

Ops.Gl.ClearColor.prototype = new Op();

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
        GL.clear(GL.DEPTH_BUFFER_BIT);
        self.trigger.call();
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
        gl.lineWidth(self.lineWidth.val);
        self.trigger.call();
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
        self.trigger.call();
        cgl.points=false;

    };

    this.pointSize.val=5;
};

Ops.Gl.Points.prototype = new Op();



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
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE));
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    
    this.filename.onValueChanged=function()
    {
        console.log('load texture...');
        self.tex=CGL.Texture.load(self.filename.val,function()
            {
                console.log('tex load FINISHED!!!');

                self.textureOut.val=self.tex;
            });
        self.textureOut.val=self.tex;

    };

    this.filename.val='assets/skull.png';
};

Ops.Gl.Texture.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.TextureText = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TextureText';
    this.text=this.addInPort(new Port(this,"text"));
    this.fontSize=this.addInPort(new Port(this,"fontSize"));
    this.align=this.addInPort(new Port(this,"align"));
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
        gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),self.buffer.itemSize, gl.FLOAT, false, 0, 0);
        cgl.getShader().bind();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
        gl.drawArrays(gl.LINE_STRIP, 0, self.buffer.numItems);

        self.trigger.call();
    };

    this.buffer = gl.createBuffer();
    
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
        gl.lineWidth(4);

        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.vertices), gl.STATIC_DRAW);
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

// ----------------------------------------------------------------


Ops.Gl.Shader= Ops.Gl.Shader || {};

Ops.Gl.Shader.Schwurbel = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Schwurbel';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.timer=this.addInPort(new Port(this,"time"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);

        if(!self.timer.uniLoc)
        {
            shader.bind();
            self.timer.uniLoc=gl.getUniformLocation(shader.getProgram(), "time");
        }
        gl.uniform1f(self.timer.uniLoc, self.timer.val);

        cgl.setPreviousShader(shader);

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float time;\n'+
        '\n'+
        'void main()\n'+
        '{\n'+
        'float c=sqrt(sin(time*0.02)*cos((time+gl_FragCoord.y)*0.02)+sin(time+gl_FragCoord.x*0.02)*sin(time+gl_FragCoord.y*0.02));\n'+
        'gl_FragColor = vec4( c,c,c,1.0);\n'+
        '}\n';

    var shader=new CGL.Shader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Schwurbel.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Shader.Noise = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Noise';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var timeUniform=-1;
    var timeStart=-1;

    this.doRender=function()
    {
        cgl.setShader(shader);
        if(timeUniform==-1)
        {
            timeStart=Date.now();
            shader.bind();
            timeUniform=gl.getUniformLocation(shader.getProgram(), "time");
        }

        gl.uniform1f(timeUniform, (Date.now()-timeStart)/1000);
        cgl.setPreviousShader();

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float time;\n'+
        '\n'+
        'float random(vec2 co)\n'+
        '{\n'+
        '   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n'+
        '}\n'+
        'void main()\n'+
        '{\n'+
        '   float c=random(time*gl_FragCoord.xy);'+
        '   gl_FragColor = vec4( c,c,c,1.0);\n'+
        '}\n';


    var shader=new CGL.Shader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Noise.prototype = new Op();

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
        self.trigger.call();
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
        self.trigger.call();
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
        self.trigger.call();
        cgl.popMvMatrix();
    };

};

Ops.Gl.Matrix.LookatCamera.prototype = new Op();


// --------------------------------------------------------------------------

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
        self.trigger.call();
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

            self.trigger.call();

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

    this.name='render to texture';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var frameBuf;
    var texture=new CGL.Texture();

    this.width=this.addInPort(new Port(this,"texture width"));
    this.height=this.addInPort(new Port(this,"texture height"));
    this.tex=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));

    this.width.val=1024;
    this.height.val=1024;

    texture.setSize(this.width.val,this.height.val);

    frameBuf = GL.createFramebuffer();
    GL.bindFramebuffer(GL.FRAMEBUFFER, frameBuf);

    var renderbuffer = GL.createRenderbuffer();
    GL.bindRenderbuffer(GL.RENDERBUFFER, renderbuffer);
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, this.width.val,this.height.val);
    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture.tex, 0);
    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, renderbuffer);
    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindRenderbuffer(GL.RENDERBUFFER, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);

    self.tex.val=texture;

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();

        GL.bindFramebuffer(GL.FRAMEBUFFER, frameBuf);
        
        cgl.pushPMatrix();
        gl.viewport(0, 0, 1920,1080);
        mat4.perspective(cgl.pMatrix,45, self.width.val/self.height.val, 0.01, 1100.0);

        self.trigger.call();

        cgl.popPMatrix();
        
        GL.bindFramebuffer(GL.FRAMEBUFFER, null);
        
        cgl.popMvMatrix();
        gl.viewport(0, 0, cgl.canvasWidth,cgl.canvasHeight);
    };


};

Ops.Gl.Render2Texture.prototype = new Op();

