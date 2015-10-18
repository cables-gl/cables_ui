
Ops.Json3d=Ops.Json3d || {};



Ops.Json3d.json3dFile = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='json3dFile';
    var scene=new CABLES.Variable();

    cgl.frameStore.currentScene=null;

    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'json' } ));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    function render()
    {
        cgl.frameStore.currentScene=scene;
        self.trigger.trigger();
        cgl.frameStore.currentScene=null;
    }

    this.exe.onTriggered=render;

    var maxx=-3;
    var row=0;
    function addChild(x,y,parentOp,parentPort,ch)
    {

        if(ch.hasOwnProperty('transformation'))
        {
            maxx=Math.max(x,maxx);

            var posx=self.uiAttribs.translate.x+x*130;
            if(ch.children && ch.children.length>1) posx=posx+(ch.children.length+1)*130/2;// center
            var posy=self.uiAttribs.translate.y+y*50;

            var transOp=self.patch.addOp('Ops.Gl.Matrix.MatrixMul',{translate:{x:posx,y:posy}});
            var mat=ch.transformation;
            mat4.transpose(mat,mat);
            transOp.matrix.val=ch.transformation;

            if(ch.name)
            {
                transOp.uiAttribs.title=transOp.name=ch.name;
            }

            if(ch.children)console.log('ch ',ch.name,ch.children.length);
                    

            self.patch.link(parentOp,parentPort,transOp,'render');

            var i=0;
            if(ch.hasOwnProperty('meshes'))
            {
                for(i=0;i<ch.meshes.length;i++)
                {
                    var index=ch.meshes[i];

                    var meshOp=self.patch.addOp('Ops.Json3d.Mesh',{translate:{x:posx,y:posy+50}});
                    meshOp.index.val=index;

                    meshOp.uiAttribs.title=meshOp.name=transOp.name+' Mesh';
                    // scene.meshes[index].name=meshOp.name;

                    self.patch.link(transOp,'trigger',meshOp,'render');
                }
            }

            if(ch.hasOwnProperty('children'))
            {
                y++;
                for(i=0;i<ch.children.length;i++)
                {
                    var xx=maxx;
                    if(ch.children.length>1)xx++;
                    addChild(xx,y,transOp,'trigger',ch.children[i]);
                }
            }
        }
    }



    var reload=function()
    {
        CGL.incrementLoadingAssets();

        CABLES.ajax(self.patch.getFilePath(self.filename.val),
            function(err,_data,xhr)
            {

                if(err)
                {
                    console.log('ajax error:',err);
                    CGL.decrementLoadingAssets();
                    return;
                }
                var data=JSON.parse(_data);
                scene.setValue(data);

                if(!self.trigger.isLinked())
                {
                    console.log('data.meshes '+data.meshes.length);
                    var root=self.patch.addOp('Ops.Sequence',{translate:{x:self.uiAttribs.translate.x,y:self.uiAttribs.translate.y+50}});
                    self.patch.link(self,'trigger',root,'exe');

                    for(var i=0;i<data.rootnode.children.length;i++)
                    {
                        addChild(maxx-2,3,root,'trigger 0',data.rootnode.children[i]);
                    }
                }

                render();
                CGL.decrementLoadingAssets();
            });

    };

    this.filename.onValueChanged=reload;
};

Ops.Json3d.json3dFile.prototype = new Op();




// -------------------------------------------------------------

Ops.Json3d.Mesh=function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='json3d Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION ));
    this.index=this.addInPort(new Port(this,"mesh index",OP_PORT_TYPE_VALUE,{type:'string'} ));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.geometryOut=this.addOutPort(new Port(this,"geometry",OP_PORT_TYPE_OBJECT ));
    this.geometryOut.ignoreValueSerialize=true;

    var mesh=null;
    var currentIndex=-1;

    function render()
    {
        if(!mesh && cgl.frameStore.currentScene && cgl.frameStore.currentScene.getValue() || currentIndex!=self.index.val)
        {
            reload();
        }
        if(mesh!==null)
            mesh.render(cgl.getShader());

        self.trigger.trigger();
    }

    function reload()
    {
        if(cgl.frameStore.currentScene && cgl.frameStore.currentScene.getValue())
        {
            // console.log(' has '+cgl.frameStore.currentScene.getValue().meshes.length+' meshes ');

            var jsonMesh=null;

            currentIndex=self.index.val;

            if(isNumeric(self.index.val))
            {
                if(self.index.val<0 || self.index.val>=cgl.frameStore.currentScene.getValue().meshes.length)
                {
                    console.log('index out of range');
                    return;
                }
                jsonMesh=cgl.frameStore.currentScene.getValue().meshes[parseInt(self.index.val,10) ];
            }
            else
            {
                var scene=cgl.frameStore.currentScene.getValue();
            }

            if(!jsonMesh)
            {
                mesh=null;
                self.uiAttribs.warning='mesh not found...';
                return;
            }

            var geom=new CGL.Geometry();
            geom.calcNormals=true;
            geom.vertices=jsonMesh.vertices;
            geom.vertexNormals=jsonMesh.normals;
            if(jsonMesh.texturecoords) geom.texCoords = jsonMesh.texturecoords[0];
            geom.verticesIndices=[];

            for(var i=0;i<jsonMesh.faces.length;i++)
                geom.verticesIndices=geom.verticesIndices.concat(jsonMesh.faces[i]);

            self.uiAttribs.info ='';
            self.uiAttribs.info += geom.verticesIndices.length+' faces <br/>';
            self.uiAttribs.info += geom.vertices.length+' vertices <br/>';
            self.uiAttribs.info += geom.texCoords.length+' texturecoords <br/>';
            self.uiAttribs.info += geom.vertexNormals.length+' normals <br/>';

            self.geometryOut.val=geom;
            mesh=new CGL.Mesh(cgl,geom);
        }
        else
        {
            // console.log('no meshes found');
            // console.log(cgl.frameStore.currentScene);
        }
    }

    this.render.onTriggered=render;
    // this.index.onValueChanged=reload;

};

Ops.Json3d.Mesh.prototype = new Op();





