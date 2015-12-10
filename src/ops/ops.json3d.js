
Ops.Json3d=Ops.Json3d || {};



Ops.Json3d.json3dFile = function()
{
    CABLES.Op.apply(this, arguments);
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
        var oldScene=cgl.frameStore.currentScene;
        cgl.frameStore.currentScene=scene;
        self.trigger.trigger();
        cgl.frameStore.currentScene=oldScene;
    }

    this.exe.onTriggered=render;

    var maxx=-3;
    var row=0;
    function addChild(x,y,parentOp,parentPort,ch)
    {
        if(ch.hasOwnProperty('transformation'))
        {
            maxx=Math.max(x,maxx)+1;

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
                    console.log('   meshes...'+i);
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
                    console.log('   child...');
                    var xx=maxx;
                    if(ch.children.length>1)xx++;
                    addChild(xx,y,transOp,'trigger',ch.children[i]);
                }
            }
        }
    }


    var reload=function()
    {
        if(!self.filename.get())return;

        // console.log('load ajax'+self.patch.getFilePath(self.filename.val));
        var loadingId=self.patch.loading.start('json3dFile',self.filename.get());

        CABLES.ajax(
            self.patch.getFilePath(self.filename.val),
            function(err,_data,xhr)
            {
                if(err)
                {
                    console.log('ajax error:',err);
                    self.patch.loading.finished(loadingId);
                    return;
                }
                var data=JSON.parse(_data);
                scene.setValue(data);


                if(!self.trigger.isLinked())
                {
                    var root=self.patch.addOp('Ops.Sequence',{translate:{x:self.uiAttribs.translate.x,y:self.uiAttribs.translate.y+50}});
                    self.patch.link(self,'trigger',root,'exe');

                    for(var i=0;i<data.rootnode.children.length;i++)
                    {
                        addChild(maxx-2,3,root,'trigger 0',data.rootnode.children[i]);
                    }
                }

                render();
                self.patch.loading.finished(loadingId);

            });

    };

    this.filename.onValueChanged=reload;
};

Ops.Json3d.json3dFile.prototype = new CABLES.Op();




// -------------------------------------------------------------

Ops.Json3d.Mesh=function()
{
    CABLES.Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='json3d Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION ));
    this.index=this.addInPort(new Port(this,"mesh index",OP_PORT_TYPE_VALUE,{type:'string'} ));
    // var meshname=this.addInPort(new Port(this,"mesh name",OP_PORT_TYPE_VALUE,{type:'string'} ));
    // meshname.set('');

    this.index.val=-1;
    this.centerPivot=this.addInPort(new Port(this,"center pivot",OP_PORT_TYPE_VALUE,{display:'bool'} ));
    this.centerPivot.val=false;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.geometryOut=this.addOutPort(new Port(this,"geometry",OP_PORT_TYPE_OBJECT ));
    this.geometryOut.ignoreValueSerialize=true;

    var mesh=null;
    var currentIndex=-1;

    function render()
    {
        if(!mesh && cgl.frameStore.currentScene && cgl.frameStore.currentScene.getValue() || currentIndex!=self.index.val) reload();
        if(mesh!==null) mesh.render(cgl.getShader());

        self.trigger.trigger();
    }

    function reload()
    {
        if(!cgl.frameStore.currentScene || !cgl.frameStore.currentScene.getValue())return;
        var meshes=cgl.frameStore.currentScene.getValue().meshes;
        // console.log('---',meshes.length);
        // for(var i in meshes)
        // {
        //     console.log(meshes[i].name);
        // }

        // ---------

        if(cgl.frameStore.currentScene && cgl.frameStore.currentScene.getValue() && self.index.get()>=0)
        {
            // console.log(' has '+cgl.frameStore.currentScene.getValue().meshes.length+' meshes ');
            // console.log('reload');

            self.uiAttr({warning:''});
            self.uiAttr({info:''});

            var jsonMesh=null;

            currentIndex=self.index.val;

            if(isNumeric(self.index.val))
            {
                if(self.index.val<0 || self.index.val>=cgl.frameStore.currentScene.getValue().meshes.length)
                {
                    self.uiAttr({warning:'mesh not found - index out of range '});
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
                self.uiAttr({warning:'mesh not found'});
                return;
            }
            self.uiAttribs.warning='';

            var i=0;

            var verts=JSON.parse(JSON.stringify(jsonMesh.vertices));

            if(self.centerPivot.val)
            {
                var max=[-998999999,-998999999,-998999999];
                var min=[998999999,998999999,998999999];

                for(i=0;i<verts.length;i+=3)
                {
                    max[0]=Math.max( max[0] , verts[i+0] );
                    max[1]=Math.max( max[1] , verts[i+1] );
                    max[2]=Math.max( max[2] , verts[i+2] );

                    min[0]=Math.min( min[0] , verts[i+0] );
                    min[1]=Math.min( min[1] , verts[i+1] );
                    min[2]=Math.min( min[2] , verts[i+2] );
                }

                console.log('max',max);
                console.log('min',min);

                var off=[
                    Math.abs(Math.abs(max[0])-Math.abs(min[0])),
                    Math.abs(Math.abs(max[1])-Math.abs(min[1])),
                    Math.abs(Math.abs(max[2])-Math.abs(min[2]))
                ];

                console.log('off',off);

                for(i=0;i<verts.length;i+=3)
                {
                    verts[i+0]+=(off[0] );
                    verts[i+1]+=(off[1] );
                    verts[i+2]+=(off[2] );
                }

                max=[-998999999,-998999999,-998999999];
                min=[998999999,998999999,998999999];

                for(i=0;i<verts.length;i+=3)
                {
                    max[0]=Math.max( max[0] , verts[i+0] );
                    max[1]=Math.max( max[1] , verts[i+1] );
                    max[2]=Math.max( max[2] , verts[i+2] );

                    min[0]=Math.min( min[0] , verts[i+0] );
                    min[1]=Math.min( min[1] , verts[i+1] );
                    min[2]=Math.min( min[2] , verts[i+2] );
                }

                console.log('after max',max);
                console.log('after min',min);
            }

            var geom=new CGL.Geometry();
            geom.calcNormals=true;
            geom.vertices=verts;
            geom.vertexNormals=jsonMesh.normals;
            geom.tangents=jsonMesh.tangents;
            geom.biTangents=jsonMesh.bitangents;

            if(jsonMesh.texturecoords) geom.texCoords = jsonMesh.texturecoords[0];
            geom.verticesIndices=[];

            // for(i=0;i<jsonMesh.faces.length;i++)
            // geom.verticesIndices=geom.verticesIndices.concat(jsonMesh.faces[i]);
            geom.verticesIndices=[].concat.apply([], jsonMesh.faces);

            var nfo='';
            nfo += geom.verticesIndices.length+' faces <br/>';
            nfo += geom.vertices.length+' vertices <br/>';
            nfo += geom.texCoords.length+' texturecoords <br/>';
            nfo += geom.vertexNormals.length+' normals <br/>';
            self.uiAttr({info:nfo});

            self.geometryOut.val=geom;
            mesh=new CGL.Mesh(cgl,geom);
            // mesh.render(cgl.getShader());
        }
        else
        {
            // console.log('no meshes found');
            // console.log(cgl.frameStore.currentScene);
        }
    }

    // meshname.onValueChanged=function()
    // {
    //
    // };

    this.render.onTriggered=render;
    this.centerPivot.onValueChanged=function()
    {
        mesh=null;
    };
    this.index.onValueChanged=reload;

};

Ops.Json3d.Mesh.prototype = new CABLES.Op();
