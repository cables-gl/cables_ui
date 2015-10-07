
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
        self.trigger.trigger();
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
        self.trigger.trigger();
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

    this.mesh=null;
    var geom=new CGL.Geometry();
    var x=0,y=0,z=0,w=0;

    this.render.onTriggered=function()
    {
        if(
          cgl.getViewPort()[2]!=w ||
          cgl.getViewPort()[3]!=h ) rebuild();

        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);
        mat4.ortho(cgl.pMatrix, 0, w, h, 0, -10.0, 1000);

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        self.mesh.render(cgl.getShader());

        cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

        cgl.popPMatrix();
        cgl.popMvMatrix();

        self.trigger.trigger();
    };

    this.onResize=this.rebuild;

    function rebuild()
    {
        var currentViewPort=cgl.getViewPort().slice();

        x=currentViewPort[0];
        y=currentViewPort[1];
        w=currentViewPort[2];
        h=currentViewPort[3];

        var xx=0,xy=0;
        geom.vertices = [
             xx+w, xy+h,  0.0,
             xx,   xy+h,  0.0,
             xx+w, xy,    0.0,
             xx,   xy,    0.0
        ];

        geom.texCoords = [
             1.0, 0.0,
             0.0, 0.0,
             1.0, 1.0,
             0.0, 1.0
        ];

        geom.verticesIndices = [
            0, 1, 2,
            3, 1, 2
        ];

        if(!self.mesh) self.mesh=new CGL.Mesh(geom);
        else self.mesh.setGeom(geom);
    }
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
    this.innerRadius=this.addInPort(new Port(this,"innerRadius",OP_PORT_TYPE_VALUE,{display:"range"}));
    this.percent=this.addInPort(new Port(this,"percent"));

    this.steps=this.addInPort(new Port(this,"steps",OP_PORT_TYPE_VALUE,{type:"int"}));
    this.steps.val=0.0;
    this.invertSteps=this.addInPort(new Port(this,"invertSteps",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.invertSteps.val=false;


    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        mesh.render(cgl.getShader());
        self.trigger.trigger();
    };

    this.segments.val=40;
    this.radius.val=1;
    this.innerRadius.val=0;
    this.percent.val=1;


    var geom=new CGL.Geometry();
    var mesh=new CGL.Mesh(geom);

    function calc()
    {
        geom.clear();
        var i=0,degInRad=0;
        var oldPosX=0,oldPosY=0;
        var oldPosXTexCoord=0,oldPosYTexCoord=0;

        var oldPosXIn=0,oldPosYIn=0;
        var oldPosXTexCoordIn=0,oldPosYTexCoordIn=0;

        var posxTexCoord=0,posyTexCoord=0;
        var posx=0,posy=0;

        if(self.innerRadius.val<=0)
        {
          for (i=0; i <= self.segments.val*self.percent.val; i++)
          {
              degInRad = (360/self.segments.val)*i*CGL.DEG2RAD;
              posx=Math.cos(degInRad)*self.radius.val;
              posy=Math.sin(degInRad)*self.radius.val;

              posxTexCoord=(Math.cos(degInRad)+1.0)/2;
              posyTexCoord=(Math.sin(degInRad)+1.0)/2;

              geom.addFace(
                          [posx,posy,0],
                          [oldPosX,oldPosY,0],
                          [0,0,0]
                          );

              geom.texCoords.push(posxTexCoord,posyTexCoord,oldPosXTexCoord,oldPosYTexCoord,0.5,0.5);

              oldPosXTexCoord=posxTexCoord;
              oldPosYTexCoord=posyTexCoord;

              oldPosX=posx;
              oldPosY=posy;
          }
        }
        else
        {
          
          var count=0;
          for (i=0; i <= self.segments.val*self.percent.val; i++)
          {
              count++;

              degInRad = (360/self.segments.val)*i*CGL.DEG2RAD;
              posx=Math.cos(degInRad)*self.radius.val;
              posy=Math.sin(degInRad)*self.radius.val;

              var posxIn=Math.cos(degInRad)*self.innerRadius.val*self.radius.val;
              var posyIn=Math.sin(degInRad)*self.innerRadius.val*self.radius.val;

              posxTexCoord=(Math.cos(degInRad)+1.0)/2;
              posyTexCoord=(Math.sin(degInRad)+1.0)/2;

              var posxTexCoordIn=(Math.cos(degInRad)+1.0)/2*self.innerRadius.val;
              var posyTexCoordIn=(Math.sin(degInRad)+1.0)/2*self.innerRadius.val;

              // if(count%5!==0)
              if(self.steps.val===0.0 ||
                (count%parseInt(self.steps.val,10)===0 && !self.invertSteps.val) ||
                (count%parseInt(self.steps.val,10)!==0 && self.invertSteps.val)
                )

              {
                  geom.addFace(
                              [posx,posy,0],
                              [oldPosX,oldPosY,0],
                              [posxIn,posyIn,0]
                              );

                  geom.addFace(
                              [posxIn,posyIn,0],
                              [oldPosX,oldPosY,0],
                              [oldPosXIn,oldPosYIn,0]
                              );

                  geom.texCoords.push(posxTexCoord,posyTexCoord,oldPosXTexCoord,oldPosYTexCoord,posxTexCoordIn,posyTexCoordIn);
                  geom.texCoords.push(posxTexCoordIn,posyTexCoordIn,oldPosXTexCoord,oldPosYTexCoord,oldPosXTexCoordIn,oldPosYTexCoordIn);
              }

              oldPosXTexCoordIn=posxTexCoordIn;
              oldPosYTexCoordIn=posyTexCoordIn;

              oldPosXTexCoord=posxTexCoord;
              oldPosYTexCoord=posyTexCoord;

              oldPosX=posx;
              oldPosY=posy;

              oldPosXIn=posxIn;
              oldPosYIn=posyIn;
            }


        }

        mesh.setGeom(geom);
    }

    this.segments.onValueChanged=calc;
    this.radius.onValueChanged=calc;
    this.innerRadius.onValueChanged=calc;
    this.percent.onValueChanged=calc;
    this.steps.onValueChanged=calc;
    this.invertSteps.onValueChanged=calc;
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
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{display:'file',type:'string',filter:'mesh'}));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh) self.mesh.render(cgl.getShader());

        self.trigger.trigger();
    };



    this.filename.onValueChanged=function()
    {
        // console.log('load texture...');
        // self.tex=CGL.Texture.load(self.filename.val,function()
        //     {
        //         console.log('tex load FINISHED!!!');

        //         self.textureOut.val=self.tex;
        //     });
        // self.textureOut.val=self.tex;

      CGL.incrementLoadingAssets();
      ajaxRequest(self.filename.val,function(response)
      {
          // console.log(response);
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
          CGL.decrementLoadingAssets();

      });


    };

    // this.filename.val='assets/skull.obj';

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
        self.trigger.trigger();
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

