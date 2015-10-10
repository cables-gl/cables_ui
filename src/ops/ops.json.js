
Ops.Json=Ops.Json || {};


Ops.Json.jsonValue = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='jsonValue';

    this.data=this.addInPort(new Port(this,"data",OP_PORT_TYPE_OBJECT ));
    this.key=this.addInPort(new Port(this,"key"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.data.onValueChanged=function()
    {
        if(self.data.val && self.data.val.hasOwnProperty(self.key.val))
        {
            self.result.val=self.data.val[self.key.val];
        }
    };

};

Ops.Json.jsonValue.prototype = new Op();

// -------------------------------------------------------------


Ops.Json.jsonFile = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='jsonFile';

    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'json' } ));
    this.result=this.addOutPort(new Port(this,"result",OP_PORT_TYPE_OBJECT));

    var reload=function()
    {
        $.ajax(
        {
            url: self.filename.val,
            context: document.body
        })
        .fail(function(data)
        {
            console.log('ajax fail!');
        })
        .done(function(data)
        {
            self.result.val=data;
            console.log('data',data);
        });

    };

    this.filename.onValueChanged=reload;
};

Ops.Json.jsonFile.prototype = new Op();


// -------------------------------------------------------------

Ops.Json3d=Ops.Json3d || {};

Ops.Json3d.currentScene=null;


Ops.Json3d.json3dFile = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='json3dFile';

    var scene=new CABLES.Variable();

    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'json' } ));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        Ops.Json3d.currentScene=scene;
        self.trigger.trigger();
        Ops.Json3d.currentScene=null;
    };


    var row=0;
    function addChild(x,y,parentOp,parentPort,ch)
    {
        if(ch.hasOwnProperty('transformation'))
        {
            var posx=self.uiAttribs.translate.x+x*130;
            var posy=self.uiAttribs.translate.y+y*50;

            var transOp=self.patch.addOp('Ops.Gl.Matrix.MatrixMul',{translate:{x:posx,y:posy}});
            var mat=ch.transformation;
            mat4.transpose(mat,mat);
            transOp.matrix.val=ch.transformation;

            if(ch.name)
            {
                transOp.name=ch.name;
            }

            self.patch.link(parentOp,parentPort,transOp,'render');

            if(ch.hasOwnProperty('meshes'))
            {
                for(var i=0;i<ch.meshes.length;i++)
                {
                    var index=ch.meshes[i];
                    var meshOp=self.patch.addOp('Ops.Json3d.Mesh',{translate:{x:posx,y:posy+50}});
                    meshOp.index.val=index;

                    self.patch.link(transOp,'trigger',meshOp,'render');
                }
            }

            if(ch.hasOwnProperty('children'))
            {
                for(var i=0;i<ch.children.length;i++)
                {
                    addChild(x+i,y+i,transOp,'trigger',ch.children[i]);
                }
            }
        }
    }



    var reload=function()
    {
        $.ajax(
        {
            url: self.filename.val,
            context: document.body
        })
        .fail(function(data)
        {
            console.log('ajax fail!');
        })
        .done(function(data)
        {
            scene.setValue(data);
            // Ops.Json3d.currentScene=data;

            console.log('scenes '+data.meshes.length);

            var root=self.patch.addOp('Ops.Sequence',{translate:{x:self.uiAttribs.translate.x,y:self.uiAttribs.translate.y+50}});

            self.patch.link(self,'trigger',root,'exe');

            for(var i=0;i<data.rootnode.children.length;i++)
            {
                addChild(i,3,root,'trigger 0',data.rootnode.children[i]);
            }

        });

    };

    this.filename.onValueChanged=reload;
};

Ops.Json3d.json3dFile.prototype = new Op();




// -------------------------------------------------------------

Ops.Json3d.Mesh=function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='json3d Mesh';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION ));
    // this.json=this.addInPort(new Port(this,"json",OP_PORT_TYPE_OBJECT ));
    this.index=this.addInPort(new Port(this,"mesh index",OP_PORT_TYPE_VALUE ));

    var mesh=null;

    function render()
    {
        if(!mesh && Ops.Json3d.currentScene.getValue()) reload();
        if(mesh!==null)
        {
            mesh.render(cgl.getShader());
        }
    }

    function reload()
    {
        if(Ops.Json3d.currentScene && Ops.Json3d.currentScene.getValue())
        {
            console.log(' has '+Ops.Json3d.currentScene.getValue().meshes.length+' meshes ');

            if(self.index.val<0 || self.index.val>=Ops.Json3d.currentScene.getValue().meshes.length)
            {
                console.log('index out of range');
                return;
            }

            var jsonMesh=Ops.Json3d.currentScene.getValue().meshes[parseInt(self.index.val,10) ];

            var geom=new CGL.Geometry();
            geom.calcNormals=true;
            geom.vertices=jsonMesh.vertices;
            geom.vertexNormals=jsonMesh.normals;

        // console.log('jsonMesh.texturecoords',jsonMesh.texturecoords[]);
        
            geom.texCoords = jsonMesh.texturecoords[0];
            
                    
            geom.verticesIndices=[];

            for(var i=0;i<jsonMesh.faces.length;i++)
            {
                geom.verticesIndices=geom.verticesIndices.concat(jsonMesh.faces[i]);
            }

            console.log('verticesIndices ',geom.verticesIndices.length);
            console.log('texturecoords',geom.texCoords.length);
            console.log('vertices',geom.vertices.length);

            mesh=new CGL.Mesh(geom);
        }
        else
        {
            console.log('no meshes found');
        }

    }

    this.render.onTriggered=render;
    // this.json.onValueChanged=reload;
    this.index.onValueChanged=reload;

};

Ops.Json3d.Mesh.prototype = new Op();





