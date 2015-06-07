//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html

Ops.Gl={};
var GL=null;
var GL=null;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
    var self=this;

    var simpleShader=new glShader();
 

    this.name='WebGL Renderer';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var initTranslate=vec3.create();
    vec3.set(initTranslate, 0,0,-2);

    this.onAnimFrame=function(time)
    {
        currentShader=simpleShader;

        GL.clearColor(0,0,0,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        gl.viewport(0,0,640,360);
        mat4.perspective(pMatrix,45, 800 / 480, 0.01, 1100.0);
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix,mvMatrix, initTranslate);

        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA,GL.ONE_MINUS_SRC_ALPHA);

        self.trigger.call();
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

    this.render.onTriggered=function()
    {
        GL.clearColor(self.r.val,self.g.val,self.b.val,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        self.trigger.call();
    };

};

Ops.Gl.ClearColor.prototype = new Op();


var currentShader=null;

// --------------------------------------------------------------------------

Ops.Gl.Meshes={};



Ops.Gl.Meshes.Rectangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        currentShader.setAttributeVertex( self.squareVertexPositionBuffer.itemSize);
        currentShader.bind();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.squareVertexPositionBuffer.numItems);

        self.trigger.call();
    };

    this.squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 3;
    this.squareVertexPositionBuffer.numItems = 4;
};

Ops.Gl.Meshes.Rectangle.prototype = new Op();






Ops.Gl.Meshes.ObjMesh = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='OBJ Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh)
        {
            self.mesh.render(currentShader);
        }

        self.trigger.call();
    };


    ajaxRequest('assets/43_ChinUpperRaise.obj',function(response)
    {
        console.log(response);
                
        var r=parseOBJ(response);
        console.log(r);
        
        self.mesh=new Mesh(r);
        


    });




};

Ops.Gl.Meshes.ObjMesh.prototype = new Op();




// ----------------------------------------------------------------


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
        currentShader.setAttributeVertex( self.buffer.itemSize);
        currentShader.bind();
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

Ops.Gl.Meshes.Triangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Triangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        currentShader.setAttributeVertex( self.squareVertexPositionBuffer.itemSize);
        currentShader.bind();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.squareVertexPositionBuffer.numItems);

        self.trigger.call();
    };

    this.squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.vertices = [
         0.0,  1.0,  0.0,
        -1.0,  -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 3;
    this.squareVertexPositionBuffer.numItems = 3;


};

Ops.Gl.Meshes.Triangle.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Shader={};

Ops.Gl.Shader.BasicMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='BasicMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        currentShader=shader;

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float r;\n'+
        'uniform float g;\n'+
        'uniform float b;\n'+
        'uniform float a;\n'+
        '\n'+
        'void main()\n'+
        '{\n'+
        '   gl_FragColor = vec4(r,g,b,a);\n'+
        '}\n';


    var shader=new glShader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();

    this.r=this.addInPort(new Port(this,"r"));
    this.r.onValueChanged=function()
    {
        shader.bind();
        if(!self.r.uniLoc) self.r.uniLoc=gl.getUniformLocation(shader.getProgram(), "r");
        gl.uniform1f(self.r.uniLoc, self.r.val);
    };

    this.g=this.addInPort(new Port(this,"g"));
    this.g.onValueChanged=function()
    {
        shader.bind();
        if(!self.g.uniLoc) self.g.uniLoc=gl.getUniformLocation(shader.getProgram(), "g");
        gl.uniform1f(self.g.uniLoc, self.g.val);
    };

    this.b=this.addInPort(new Port(this,"b"));
    this.b.onValueChanged=function()
    {
        shader.bind();
        if(!self.b.uniLoc) self.b.uniLoc=gl.getUniformLocation(shader.getProgram(), "b");
        gl.uniform1f(self.b.uniLoc, self.b.val);
    };

    this.a=this.addInPort(new Port(this,"a"));
    this.a.onValueChanged=function()
    {
        shader.bind();
        if(!self.a.uniLoc) self.a.uniLoc=gl.getUniformLocation(shader.getProgram(), "a");
        gl.uniform1f(self.a.uniLoc, self.a.val);
    };

    this.r.val=Math.random();
    this.g.val=Math.random();
    this.b.val=Math.random();
    this.a.val=1.0;

    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();

// --------------------------------------------------------------------------

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
        currentShader=shader;
        if(!self.timer.uniLoc)
        {
            shader.bind();
            self.timer.uniLoc=gl.getUniformLocation(shader.getProgram(), "time");
        }
        gl.uniform1f(self.timer.uniLoc, self.timer.val);

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

    var shader=new glShader();
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
        if(timeUniform==-1)
        {
            timeStart=Date.now();
            shader.bind();
            timeUniform=gl.getUniformLocation(shader.getProgram(), "time");
        }

        gl.uniform1f(timeUniform, (Date.now()-timeStart)/1000);
        currentShader=shader;

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


    var shader=new glShader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Noise.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Cube = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Cube';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));


    this.render.onTriggered=function()
    {
        GL.bindBuffer(gl.ARRAY_BUFFER, this.cubeVerticesBuffer);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, self.cubeVerticesIndexBuffer);
        // setMatrixUniforms();
        GL.drawElements(GL.TRIANGLES, 36, GL.UNSIGNED_SHORT, 0);
    };

    this.cubeVerticesIndexBuffer=null;
    this.cubeVerticesBuffer=null;
    // this.cubeVerticesColorBuffer=null;

    this.init=function()
    {
        var vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0
          ];

  this.cubeVerticesBuffer = GL.createBuffer();
  
  GL.bindBuffer(GL.ARRAY_BUFFER, this.cubeVerticesBuffer);

  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);

        // var colors = [
        //     [1.0,  1.0,  1.0,  1.0],    // Front face: white
        //     [1.0,  0.0,  0.0,  1.0],    // Back face: red
        //     [0.0,  1.0,  0.0,  1.0],    // Top face: green
        //     [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
        //     [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
        //     [1.0,  0.0,  1.0,  1.0]     // Left face: purple
        //   ];

        // var generatedColors = [];

        // for (j=0; j<6; j++)
        // {
        //     var c = colors[j];
        //     for (var i=0; i<4; i++)
        //     {
        //       generatedColors = generatedColors.concat(c);
        //     }
        // }

        // cubeVerticesColorBuffer = GL.createBuffer();
        // GL.bindBuffer(GL.ARRAY_BUFFER, cubeVerticesColorBuffer);
        // GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(generatedColors), GL.STATIC_DRAW);

        this.cubeVerticesIndexBuffer = GL.createBuffer();

        // console.log(this.cubeVerticesIndexBuffer);
                
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.cubeVerticesIndexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        var cubeVertexIndices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
        ];

        // Now send the element array to GL

        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), GL.STATIC_DRAW);
    };

    this.init();

};

Ops.Gl.Cube.prototype = new Op();


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

        mat4.translate(mvMatrix,mvMatrix, vec);
        self.trigger.call();
    };

};

Ops.Gl.Matrix.Translate.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Matrix.Transform = function()
{
    Op.apply(this, arguments);
    var self=this;
    var DEG2RAD = 3.14159/180.0;
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
    var oldMatrix = mat4.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;
    var doTranslate=false;

    this.render.onTriggered=function()
    {
        mat4.copy(oldMatrix, mvMatrix);

        mat4.multiply(mvMatrix,mvMatrix,transMatrix);

        self.trigger.call();

        mat4.copy(mvMatrix,oldMatrix);
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

        if(self.rotX.val!==0)mat4.rotateX(transMatrix,transMatrix, self.rotX.val*DEG2RAD);
        if(self.rotY.val!==0)mat4.rotateY(transMatrix,transMatrix, self.rotY.val*DEG2RAD);
        if(self.rotZ.val!==0)mat4.rotateZ(transMatrix,transMatrix, self.rotZ.val*DEG2RAD);

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

Ops.Gl.Matrix.Translate.prototype = new Op();





