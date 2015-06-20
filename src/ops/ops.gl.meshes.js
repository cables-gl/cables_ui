
Ops.Gl.Meshes=Ops.Gl.Meshes || {};

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Triangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Triangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        self.mesh.render(cgl.getShader());
        self.trigger.call();
    };

    var geom=new CGL.Geometry();
    geom.vertices = [
         0.0,  1.0,  0.0,
        -1.0,  -1.0,  0.0,
         1.0, -1.0,  0.0
    ];

    geom.verticesIndices = [
        0, 1, 2
    ];
    this.mesh=new CGL.Mesh(geom);
};

Ops.Gl.Meshes.Triangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Rectangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.width=this.addInPort(new Port(this,"width"));
    this.height=this.addInPort(new Port(this,"height"));
    this.width.val=1.0;
    this.height.val=1.0;

    this.render.onTriggered=function()
    {
        self.mesh.render(cgl.getShader());
        self.trigger.call();
    };

    var geom=new CGL.Geometry();
    this.mesh=null;

    function rebuild()
    {
        geom.vertices = [
             self.width.val/2,  self.height.val/2,  0.0,
            -self.width.val/2,  self.height.val/2,  0.0,
             self.width.val/2, -self.height.val/2,  0.0,
            -self.width.val/2, -self.height.val/2,  0.0
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
        if(!self.mesh) self.mesh=new CGL.Mesh(geom);
        self.mesh.setGeom(geom);
    }
    rebuild();

    this.width.onValueChanged=rebuild;
    this.height.onValueChanged=rebuild;
};

Ops.Gl.Meshes.Rectangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.FullscreenRectangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='fullscreen rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        self.mesh.render(cgl.getShader());
        self.trigger.call();

        cgl.popPMatrix();
        cgl.popMvMatrix();

    };

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
    this.mesh=new CGL.Mesh(geom);
};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Circle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Circle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.segments=this.addInPort(new Port(this,"segments"));
    this.radius=this.addInPort(new Port(this,"radius"));
    this.percent=this.addInPort(new Port(this,"percent"));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        mesh.render(cgl.getShader());
        self.trigger.call();
    };

    this.segments.val=20;
    this.radius.val=1;
    this.percent.val=1;

    var geom=new CGL.Geometry();
    var mesh=new CGL.Mesh(geom);

    function calc()
    {
        geom.clear();
        var oldPosX=0;
        var oldPosY=0;

        for (var i=0; i <= self.segments.val*self.percent.val; i++)
        {
            var degInRad = (360/self.segments.val)*i*CGL.DEG2RAD;
            var posx=Math.cos(degInRad)*self.radius.val;
            var posy=Math.sin(degInRad)*self.radius.val;

            geom.addFace(
                        [posx,posy,0],
                        [oldPosX,oldPosY,0],
                        [0,0,0]
                        );

            geom.texCoords.push(0,0,0,0,0,0);

            oldPosX=posx;
            oldPosY=posy;
        }

        mesh.setGeom(geom);
    }

    this.segments.onValueChanged=calc;
    this.radius.onValueChanged=calc;
    this.percent.onValueChanged=calc;
    calc();
};

Ops.Gl.Meshes.Circle.prototype = new Op();

// --------------------------------------------------------------------------

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
        if(self.mesh) self.mesh.render(cgl.getShader());

        self.trigger.call();
    };

    ajaxRequest('assets/skull.obj',function(response)
    {
        console.log(response);
                
        var r=parseOBJ(response);

        unwrap = function(ind, crd, cpi)
        {
            var ncrd = new Array(Math.floor(ind.length/3)*cpi);
            for(var i=0; i<ind.length; i++)
            {
                for(var j=0; j<cpi; j++)
                {
                    ncrd[i*cpi+j] = crd[ind[i]*cpi+j];
                }
            }
            return ncrd;
        };

        var l=r.verticesIndices.length;
            r.vertices = unwrap(r.verticesIndices, r.vertices, 3);
            r.texCoords = unwrap(r.texCoordsIndices  , r.texCoords  , 2);
            r.vertexNormals = unwrap(r.vertexNormalIndices  , r.vertexNormals  , 3);
            r.verticesIndices = [];
            for(var i=0; i<l; i++) r.verticesIndices.push(i);
        
        self.mesh=new CGL.Mesh(r);
    });
};

Ops.Gl.Meshes.ObjMesh.prototype = new Op();

// ----------------------------------------------------------------

Ops.Gl.Meshes.Cube = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Cube';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh!==null) self.mesh.render(cgl.getShader());
        self.trigger.call();
    };

    var geom=new CGL.Geometry();

        geom.vertices = [
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
          -1.0,  1.0, -1.0,
        ];

        geom.texCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
        ];

        geom.vertexNormals = [
            // Front face
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,

            // Back face
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,

            // Top face
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,

            // Bottom face
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,

            // Right face
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,

            // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];


        geom.verticesIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];

    this.mesh=new CGL.Mesh(geom);
};

Ops.Gl.Meshes.Cube.prototype = new Op();

// ----------------------------------------------------------------

