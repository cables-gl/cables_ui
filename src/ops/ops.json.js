
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


Ops.Json3d.Mesh=function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='json3d Mesh';

    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION ));
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
        // geom.vertices = [
        // geom.texCoords = [
        // geom.vertexNormals = [
        // geom.verticesIndices = [
        
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

    this.exe.onTriggered=render;
    this.json.onValueChanged=reload;
    this.index.onValueChanged=reload;

};

Ops.Json3d.Mesh.prototype = new Op();





