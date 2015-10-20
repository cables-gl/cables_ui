
Ops.Gl.Meshes=Ops.Gl.Meshes || {};


Ops.Gl.Meshes.Triangle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

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
    this.mesh=new CGL.Mesh(cgl,geom);
};

Ops.Gl.Meshes.Triangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Rectangle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.width=this.addInPort(new Port(this,"width"));
    this.height=this.addInPort(new Port(this,"height"));
    
    this.pivotX=this.addInPort(new Port(this,"pivot x",OP_PORT_TYPE_VALUE,{display:'dropdown',values:["center","left","right"]} ));
    this.pivotX.val='center';

    this.pivotY=this.addInPort(new Port(this,"pivot y",OP_PORT_TYPE_VALUE,{display:'dropdown',values:["center","top","bottom"]} ));
    this.pivotY.val='center';

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
        var x=0;
        var y=0;
        if(self.pivotX.val=='center') x=0;
        if(self.pivotX.val=='right') x=-self.width.val/2;
        if(self.pivotX.val=='left') x=+self.width.val/2;

        if(self.pivotY.val=='center') y=0;
        if(self.pivotY.val=='top') y=-self.height.val/2;
        if(self.pivotY.val=='bottom') y=+self.height.val/2;

        geom.vertices = [
             self.width.val/2+x,  self.height.val/2+y,  0.0,
            -self.width.val/2+x,  self.height.val/2+y,  0.0,
             self.width.val/2+x, -self.height.val/2+y,  0.0,
            -self.width.val/2+x, -self.height.val/2+y,  0.0
        ];

        geom.texCoords = [
             1.0, 0.0,
             0.0, 0.0,
             1.0, 1.0,
             0.0, 1.0
        ];

        geom.verticesIndices = [
            0, 1, 2,
            2, 1, 3
        ];
        if(!self.mesh) self.mesh=new CGL.Mesh(cgl,geom);
        self.mesh.setGeom(geom);
    }
    rebuild();

    this.pivotX.onValueChanged=rebuild;
    this.pivotY.onValueChanged=rebuild;
    this.width.onValueChanged=rebuild;
    this.height.onValueChanged=rebuild;
};

Ops.Gl.Meshes.Rectangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.FullscreenRectangle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

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
             1.0, 1.0,
             0.0, 1.0,
             1.0, 0.0,
             0.0, 0.0
        ];

        geom.verticesIndices = [
            0, 1, 2,
            3, 1, 2
        ];

        if(!self.mesh) self.mesh=new CGL.Mesh(cgl,geom);
        else self.mesh.setGeom(geom);
    }
};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Circle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

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
    var mesh=new CGL.Mesh(cgl,geom);

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
    var cgl=this.patch.cgl;

    this.name='OBJ Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.calcNormals=this.addInPort(new Port(this,"calcNormals",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['no','face','vertex']}));
    this.calcNormals.val='no';

    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{display:'file',type:'string',filter:'mesh'}));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh) self.mesh.render(cgl.getShader());

        self.trigger.trigger();
    };


    var reloadObj=function()
    {
        // console.log('load texture...');
        // self.tex=CGL.Texture.load(self.filename.val,function()
        //     {
        //         console.log('tex load FINISHED!!!');

        //         self.textureOut.val=self.tex;
        //     });
        // self.textureOut.val=self.tex;

      CGL.incrementLoadingAssets();

      // console.log('filename:',self.filename.val);
      if(self.filename.val===0)
      {
        CGL.decrementLoadingAssets();
        return;
      }
      

      ajaxRequest(self.patch.getFilePath(self.filename.val),function(response)
      {
        console.log('parse obj');
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
          
          if(self.calcNormals.val=='face')r.calcNormals();
          else if(self.calcNormals.val=='vertex')r.calcNormals(true);

          self.mesh=new CGL.Mesh(cgl,r);


          CGL.decrementLoadingAssets();

      });

    };

    this.filename.onValueChanged=reloadObj;
    this.calcNormals.onValueChanged=function()
    {
        reloadObj();
    };



    // this.filename.val='assets/skull.obj';

};

Ops.Gl.Meshes.ObjMesh.prototype = new Op();

// ----------------------------------------------------------------

Ops.Gl.Meshes.Cube = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

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

    this.mesh=new CGL.Mesh(cgl,geom);
};

Ops.Gl.Meshes.Cube.prototype = new Op();

// ----------------------------------------------------------------


Ops.Gl.Meshes.Spline = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;
    cgl.frameStore.SplinePoints=[];

    this.name='Spline';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.thickness=this.addInPort(new Port(this,"thickness",OP_PORT_TYPE_VALUE));
    this.thickness.val=1.0;

    this.subDivs=this.addInPort(new Port(this,"subDivs",OP_PORT_TYPE_VALUE));
    this.centerpoint=this.addInPort(new Port(this,"centerpoint",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.centerpoint.val=false;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.triggerPoints=this.addOutPort(new Port(this,"triggerPoints",OP_PORT_TYPE_FUNCTION));
    
    var buffer = cgl.gl.createBuffer();



    function easeSmoothStep(perc)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*(3 - 2*x); // smoothstep
        return perc;
    }

    function easeSmootherStep(perc)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*x*(x*(x*6 - 15) + 10); // smootherstep
        return perc;
    }


    this.render.onTriggered=function()
    {
        self.trigger.trigger();
        bufferData();

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        cgl.getShader().bind();
        cgl.gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),buffer.itemSize, cgl.gl.FLOAT, false, 0, 0);
        cgl.gl.enableVertexAttribArray(cgl.getShader().getAttrVertexPos());

        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
        if(self.centerpoint.val)cgl.gl.drawArrays(cgl.gl.LINES, 0, buffer.numItems);
          else cgl.gl.drawArrays(cgl.gl.LINE_STRIP, 0, buffer.numItems);

        for(var i=0;i<cgl.frameStore.SplinePoints.length;i+=3)
        {
            var vec=[0,0,0];
            vec3.set(vec, cgl.frameStore.SplinePoints[i+0], cgl.frameStore.SplinePoints[i+1], cgl.frameStore.SplinePoints[i+2]);
            cgl.pushMvMatrix();
            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, vec);
            self.triggerPoints.trigger();
            cgl.popMvMatrix();
        }

        cgl.popMvMatrix();

        cgl.frameStore.SplinePoints.length=0;
    };

    function bufferData()
    {
        
        var subd=self.subDivs.val;

        if(self.centerpoint.val)
        {
            var points=[];

            for(var i=0;i<cgl.frameStore.SplinePoints.length;i+=3)
            {
                //center point...
                points.push( cgl.frameStore.SplinePoints[0] );
                points.push( cgl.frameStore.SplinePoints[1] );
                points.push( cgl.frameStore.SplinePoints[2] );

                //other point
                points.push( cgl.frameStore.SplinePoints[i+0] );
                points.push( cgl.frameStore.SplinePoints[i+1] );
                points.push( cgl.frameStore.SplinePoints[i+2] );

            }

            cgl.frameStore.SplinePoints=points;
        }

        // if(subd>0)
        // {
            // var points=[];
        //     for(var i=0;i<cgl.frameStore.SplinePoints.length-3;i+=3)
        //     {
        //         for(var j=0;j<subd;j++)
        //         {
        //             for(var k=0;k<3;k++)
        //             {
        //                 points.push(
        //                     cgl.frameStore.SplinePoints[i+k]+
        //                         ( cgl.frameStore.SplinePoints[i+k+3] - cgl.frameStore.SplinePoints[i+k] ) *
        //                         easeSmootherStep(j/subd)
        //                         );
        //             }

        //             // console.log('easeSmootherStep(j/subd)',easeSmootherStep(j/subd));
                            
        //         }
        //     }

        // // console.log('cgl.frameStore.SplinePoints',cgl.frameStore.SplinePoints.length);
        // // console.log('points',points.length);
        

        //     cgl.frameStore.SplinePoints=points;
        // }

        cgl.gl.lineWidth(self.thickness.val);
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(cgl.frameStore.SplinePoints), cgl.gl.STATIC_DRAW);
        buffer.itemSize = 3;
        buffer.numItems = cgl.frameStore.SplinePoints.length/buffer.itemSize;
    }

    bufferData();
};

Ops.Gl.Meshes.Spline.prototype = new Op();



// --------------------------------------------------------------------------

Ops.Gl.Meshes.SplinePoint = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='SplinePoint';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        if(!cgl.frameStore.SplinePoints)return;
        var pos=[0,0,0];
        vec3.transformMat4(pos, [0,0,0], cgl.mvMatrix);

        cgl.frameStore.SplinePoints.push(pos[0]);
        cgl.frameStore.SplinePoints.push(pos[1]);
        cgl.frameStore.SplinePoints.push(pos[2]);

        self.trigger.trigger();
    };

};

Ops.Gl.Meshes.SplinePoint.prototype = new Op();




// --------------------------------------------------------------------------

Ops.Gl.Meshes.TransformToGeometryVertices = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='TransformToGeometryVertices';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.geometry=this.addInPort(new Port(this,"geometry",OP_PORT_TYPE_OBJECT));
    
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.x=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.y=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));
    this.z=this.addOutPort(new Port(this,"z",OP_PORT_TYPE_VALUE));
    this.index=this.addOutPort(new Port(this,"index",OP_PORT_TYPE_VALUE));
    

    var vec=[0,0,0];
    this.render.onTriggered=function()
    {
        if(self.geometry.val)
        {

            for(var i=0;i<self.geometry.val.vertices.length;i+=3)
            {
                vec3.set(vec, self.geometry.val.vertices[i+0],self.geometry.val.vertices[i+1],self.geometry.val.vertices[i+2]);
                self.x.val=self.geometry.val.vertices[i+0];
                self.y.val=self.geometry.val.vertices[i+1];
                self.z.val=self.geometry.val.vertices[i+2];
                self.index.val=i;
                cgl.pushMvMatrix();
                mat4.translate(cgl.mvMatrix,cgl.mvMatrix, vec);
                self.trigger.trigger();
                cgl.popMvMatrix();
            }
        }
    };


};

Ops.Gl.Meshes.TransformToGeometryVertices.prototype = new Op();


// --------------------------------------------------------------------------


