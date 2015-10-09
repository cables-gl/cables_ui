
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




Ops.Json3d.json3dFile = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='json3dFile';

    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'json' } ));
    this.json=this.addOutPort(new Port(this,"json",OP_PORT_TYPE_OBJECT));


    function addChild(x,parentOp,parentPort,ch)
    {
        if(ch.hasOwnProperty('transformation'))
        {
            var posx=parentOp.uiAttribs.translate.x+x*130;
            var posy=parentOp.uiAttribs.translate.y+50;

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
                    self.patch.link(self,'json',meshOp,'json');
                }
            }

            if(ch.hasOwnProperty('children'))
            {
                for(var i=0;i<ch.children.length;i++)
                {
                    addChild(x,transOp,'trigger',ch.children[i]);
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
            self.json.val=data;

            console.log('scenes '+data.meshes.length);

            var root=self.patch.addOp('Ops.Sequence',{translate:{x:self.uiAttribs.translate.x,y:self.uiAttribs.translate.y+50}});

            for(var i=0;i<data.rootnode.children.length;i++)
            {
                addChild(i,root,'trigger 0',data.rootnode.children[i]);
            }
            // console.log('childs '+);




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
    this.json=this.addInPort(new Port(this,"json",OP_PORT_TYPE_OBJECT ));
    this.index=this.addInPort(new Port(this,"mesh index",OP_PORT_TYPE_VALUE ));

    var mesh=null;

    function render()
    {
        if(mesh!==null)
        {
            mesh.render(cgl.getShader());
        }
    }

    function reload()
    {
        if(self.json.val.meshes)
        {
            console.log(' has '+self.json.val.meshes.length+' meshes ');

            if(self.index.val<0 || self.index.val>=self.json.val.meshes.length)
            {
                console.log('index out of range');
                return;
            }

            var jsonMesh=self.json.val.meshes[parseInt(self.index.val,10) ];

            var geom=new CGL.Geometry();
            geom.vertices=jsonMesh.vertices;
            geom.normals=jsonMesh.normals;
            geom.verticesIndices=[];

            for(var i=0;i<jsonMesh.faces.length;i++)
            {
                geom.verticesIndices=geom.verticesIndices.concat(jsonMesh.faces[i]);
            }

            console.log('geom.vertices ',geom.vertices);
            console.log('geom.normals ',geom.normals);
            console.log('geom.faces ',geom.faces);

            mesh=new CGL.Mesh(geom);
        }
        else
        {
            console.log('no meshes found');

        }

    }

    this.render.onTriggered=render;
    this.json.onValueChanged=reload;
    this.index.onValueChanged=reload;

};

Ops.Json3d.Mesh.prototype = new Op();





