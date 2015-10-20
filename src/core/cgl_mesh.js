var CGL=CGL || {};


CGL.Mesh=function(_cgl,geom)
{
    var cgl=_cgl;
    var bufVertices = cgl.gl.createBuffer();
    var bufVerticesIndizes = cgl.gl.createBuffer();
    var attributes=[];

    function addAttribute(name,array,itemSize)
    {
        var buffer= cgl.gl.createBuffer();

        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(array), cgl.gl.STATIC_DRAW);

        var attr=
            {
                loc:-1,
                buffer:buffer,
                name:name,
                itemSize:itemSize,
                numItems: array.length/itemSize
            };

        attributes.push(attr);

        for(i=0;i<attributes.length;i++)
        {
            attributes[i].loc=-1;
        }


    }

    this.getAttributes=function()
    {
        return attributes;
    };

    this.setGeom=function(geom)
    {
        if(!this.meshChanged() )this.unBind();
        cgl.lastMesh=null;
        cgl.lastMeshShader=null;


        attributes.length=0;
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, bufVertices);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(geom.vertices), cgl.gl.STATIC_DRAW);
        bufVertices.itemSize = 3;
        bufVertices.numItems = geom.vertices.length/3;

        cgl.gl.bindBuffer(cgl.gl.ELEMENT_ARRAY_BUFFER, bufVerticesIndizes);
        cgl.gl.bufferData(cgl.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geom.verticesIndices), cgl.gl.STATIC_DRAW);
        bufVerticesIndizes.itemSize = 1;
        bufVerticesIndizes.numItems = geom.verticesIndices.length;

        if(geom.vertexNormals.length>0) addAttribute('attrVertNormal',geom.vertexNormals,3);
        if(geom.texCoords.length>0) addAttribute('attrTexCoord',geom.texCoords,2);

        for(var i=0;i<geom.morphTargets.length;i++) addAttribute('attrMorphTargetA',geom.morphTargets[i],3);
    };


    function bind(shader)
    {
        cgl.gl.enableVertexAttribArray(shader.getAttrVertexPos());
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, bufVertices);
        cgl.gl.vertexAttribPointer(shader.getAttrVertexPos(),bufVertices.itemSize, cgl.gl.FLOAT, false, 0, 0);

        for(i=0;i<attributes.length;i++)
        {
            if(attributes[i].loc==-1)
                attributes[i].loc = cgl.gl.getAttribLocation(shader.getProgram(), attributes[i].name);
        
            if(attributes[i].loc!=-1)
            {
                cgl.gl.enableVertexAttribArray(attributes[i].loc);
                cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, attributes[i].buffer);
                cgl.gl.vertexAttribPointer(attributes[i].loc,attributes[i].itemSize, cgl.gl.FLOAT, false, 0, 0);
            }
        }

        cgl.gl.bindBuffer(cgl.gl.ELEMENT_ARRAY_BUFFER, bufVerticesIndizes);

    }

    this.unBind=function()
    {
        cgl.lastMesh=null;
        cgl.lastMeshShader=null;

        for(i=0;i<attributes.length;i++)
            if(attributes[i].loc!=-1)
                cgl.gl.disableVertexAttribArray(attributes[i].loc);

    };

    this.meshChanged=function()
    {
        return (cgl.lastMesh && ( cgl.lastMesh!=this ));
    };


    this.render=function(shader)
    {
        // todo: enable/disablevertex only if the mesh has changed... think drawing 10000x the same mesh

        if(!shader) return;
        var i=0;

        // var meshChanged=this.meshChanged();
        
        // if(meshChanged)
            // cgl.lastMesh.unBind();

        shader.bind();

        // if(meshChanged)
            bind(shader);

        // if(geom.morphTargets.length>0) shader.define('HAS_MORPH_TARGETS');


        var what=cgl.gl.TRIANGLES;
        if(cgl.wireframe)what=cgl.gl.LINES;
        else if(cgl.points)what=cgl.gl.POINTS;

        cgl.gl.drawElements(what, bufVerticesIndizes.numItems, cgl.gl.UNSIGNED_SHORT, 0);
        
        this.unBind();

        // cgl.lastMesh=this;
        // cgl.lastMeshShader=shader;

    };


    this.setGeom(geom);
};

CGL.Geometry=function()
{
    this.faceVertCount=3;
    this.vertices=[];
    this.verticesIndices=[];
    this.texCoords=[];
    this.texCoordsIndices=[];
    this.vertexNormals=[];

    this.morphTargets=[];

    function calcNormal(triangle)
    {
        // Begin Function CalculateSurfaceNormal (Input Triangle) Returns Vector
 
        var u=[0,0,0],v=[0,0,0],normal=[0,0,0];
            // console.log('triangle',triangle);

        // Set Vector U to (Triangle.p2 minus Triangle.p1)
        // Set Vector V to (Triangle.p3 minus Triangle.p1)

        vec3.subtract(u,triangle[0],triangle[1]);
        vec3.subtract(v,triangle[0],triangle[2]);

        normal[0] = u[1]*v[2] - u[2]*v[1];
        normal[1] = u[2]*v[0] - u[0]*v[2];
        normal[2] = u[0]*v[1] - u[1]*v[0];

        vec3.normalize(normal,normal);

        return normal;
     
        // Set Normal.x to (multiply U.y by V.z) minus (multiply U.z by V.y)
        // Set Normal.y to (multiply U.z by V.x) minus (multiply U.x by V.z)
        // Set Normal.z to (multiply U.x by V.y) minus (multiply U.y by V.x)
     
        // Returning Normal
    }

    this.getVertexVec=function(which)
    {
        var vec=[0,0,0];
        vec[0]=this.vertices[which*3+0];
        vec[1]=this.vertices[which*3+1];
        vec[2]=this.vertices[which*3+2];
        return vec;
    };

    this.calcNormals=function(calcVertexNormals)
    {
        var i=0;

        console.log('calcNormals');
                
        this.vertexNormals.length=this.vertices.length;
        for(i=0;i<this.vertices.length;i++)
        {
            this.vertexNormals[i]=0;
        }
        var faceNormals=[];

        faceNormals.length=this.verticesIndices.length/3;

        for(i=0;i<this.verticesIndices.length;i+=3)
        {
            var triangle=[
                this.getVertexVec(this.verticesIndices[i+0]),
                this.getVertexVec(this.verticesIndices[i+1]),
                this.getVertexVec(this.verticesIndices[i+2])
                ];

            faceNormals[i/3]=calcNormal(triangle);

            if(!calcVertexNormals)
            {
                this.vertexNormals[this.verticesIndices[i+0]*3+0]=faceNormals[i/3][0];
                this.vertexNormals[this.verticesIndices[i+0]*3+1]=faceNormals[i/3][1];
                this.vertexNormals[this.verticesIndices[i+0]*3+2]=faceNormals[i/3][2];

                this.vertexNormals[this.verticesIndices[i+1]*3+0]=faceNormals[i/3][0];
                this.vertexNormals[this.verticesIndices[i+1]*3+1]=faceNormals[i/3][1];
                this.vertexNormals[this.verticesIndices[i+1]*3+2]=faceNormals[i/3][2];

                this.vertexNormals[this.verticesIndices[i+2]*3+0]=faceNormals[i/3][0];
                this.vertexNormals[this.verticesIndices[i+2]*3+1]=faceNormals[i/3][1];
                this.vertexNormals[this.verticesIndices[i+2]*3+2]=faceNormals[i/3][2];
            }
        }

        console.log('this.vertices',this.vertices.length);
        console.log('this.vertexNormals',this.vertexNormals.length);
        
        if(calcVertexNormals)
        {
            console.log('calc vertexnormals');
                    
            for(i=0;i<this.verticesIndices.length;i+=3) //faces
            {
                for(var k=0;k<3;k++) //triangles
                {
                    var v=[
                        this.vertexNormals[this.verticesIndices[i+k]*3+0]+faceNormals[i/3][0],
                        this.vertexNormals[this.verticesIndices[i+k]*3+1]+faceNormals[i/3][1],
                        this.vertexNormals[this.verticesIndices[i+k]*3+2]+faceNormals[i/3][2]
                        ];
                    vec3.normalize(v,v);
                    this.vertexNormals[this.verticesIndices[i+k]*3+0]=v[0];
                    this.vertexNormals[this.verticesIndices[i+k]*3+1]=v[1];
                    this.vertexNormals[this.verticesIndices[i+k]*3+2]=v[2];

                }



                // this.vertexNormals[this.verticesIndices[i+1]*3+0]+faceNormals[i][0];
                // this.vertexNormals[this.verticesIndices[i+1]*3+1]+faceNormals[i][1];
                // this.vertexNormals[this.verticesIndices[i+1]*3+2]+faceNormals[i][2];

                // this.vertexNormals[this.verticesIndices[i+2]*3+0]+faceNormals[i][0];
                // this.vertexNormals[this.verticesIndices[i+2]*3+1]+faceNormals[i][1];
                // this.vertexNormals[this.verticesIndices[i+2]*3+2]+faceNormals[i][2];
            }

            // for(i=0;i<this.verticesIndices.length;i+=3)
            // {
            //     for(var k=0;k<3;k++)
            //     {
            //         var v=[
            //             this.vertexNormals[this.verticesIndices[i+k]*3+0],
            //             this.vertexNormals[this.verticesIndices[i+k]*3+1],
            //             this.vertexNormals[this.verticesIndices[i+k]*3+2]
            //             ];
            //         vec3.normalize(v,v);
            //         this.vertexNormals[this.verticesIndices[i+k]*3+0]=v[0];
            //         this.vertexNormals[this.verticesIndices[i+k]*3+1]=v[1];
            //         this.vertexNormals[this.verticesIndices[i+k]*3+2]=v[2];
            //     }
            // }

        }
  

    };

//https://www.opengl.org/wiki/Calculating_a_Surface_Normal

    this.clear=function()
    {
        this.vertices.length=0;
        this.verticesIndices.length=0;
        this.texCoords.length=0;
        this.texCoordsIndices.length=0;
        this.vertexNormals.length=0;
    };

    this.addFace=function(a,b,c)
    {
        var face=[-1,-1,-1];

        for(var iv=0;iv<this.vertices;iv+=3)
        {
            if( this.vertices[iv+0]==a[0] &&
                this.vertices[iv+1]==a[1] &&
                this.vertices[iv+2]==a[2]) face[0]=iv/3;

            if( this.vertices[iv+0]==b[0] &&
                this.vertices[iv+1]==b[1] &&
                this.vertices[iv+2]==b[2]) face[1]=iv/3;

            if( this.vertices[iv+0]==c[0] &&
                this.vertices[iv+1]==c[1] &&
                this.vertices[iv+2]==c[2]) face[2]=iv/3;
        }

        if(face[0]==-1)
        {
            this.vertices.push(a[0],a[1],a[2]);
            face[0]=(this.vertices.length-1)/3;
        }

        if(face[1]==-1)
        {
            this.vertices.push(b[0],b[1],b[2]);
            face[1]=(this.vertices.length-1)/3;
        }

        if(face[2]==-1)
        {
            this.vertices.push(c[0],c[1],c[2]);
            face[2]=(this.vertices.length-1)/3;
        }

        this.verticesIndices.push( parseInt( face[0],10 ) );
        this.verticesIndices.push( parseInt( face[1],10 ) );
        this.verticesIndices.push( parseInt( face[2],10 ) );

        this.faceVertCount=this.verticesIndices.length;

    };



};

parseOBJ = function(buff)
{

    _readline = function(a, off)  // Uint8Array, offset
    {
        var s = "";
        while(a[off] != 10) s += String.fromCharCode(a[off++]);
        return s;
    };

    var geom = new CGL.Geometry();
    geom.groups = {};

    geom.vertexNormals = [];
    geom.vertexNormalIndices = [];

    var cg = {from: 0, to:0};   // current group
    var off = 0;
    var a = new Uint8Array(buff);
    var x=0,y=0,z=0;
    while(off < a.length)
    {
        var line = _readline(a, off);
        off += line.length + 1;
        line = line.replace(/ +(?= )/g,'');
        line = line.replace(/(^\s+|\s+$)/g, '');
        var cds = line.split(" ");
        if(cds[0] == "g")
        {
            cg.to = geom.verticesIndices.length;
            if(!geom.groups[cds[1]]) geom.groups[cds[1]] = {from:geom.verticesIndices.length, to:0};
            cg = geom.groups[cds[1]];
        }
        if(cds[0] == "v")
        {
            x = parseFloat(cds[1]);
            y = parseFloat(cds[2]);
            z = parseFloat(cds[3]);
            geom.vertices.push(x,y,z);
        }
        if(cds[0] == "vt")
        {
            x = parseFloat(cds[1]);
            y = 1-parseFloat(cds[2]);
            geom.texCoords.push(x,y);
        }
        if(cds[0] == "vn")
        {
            x = parseFloat(cds[1]);
            y = parseFloat(cds[2]);
            z = parseFloat(cds[3]);
            geom.vertexNormals.push(x,y,z);
        }
        if(cds[0] == "f")
        {
            var v0a = cds[1].split("/"), v1a = cds[2].split("/"), v2a = cds[3].split("/");
            var vi0 = parseInt(v0a[0])-1, vi1 = parseInt(v1a[0])-1, vi2 = parseInt(v2a[0])-1;
            var ui0 = parseInt(v0a[1])-1, ui1 = parseInt(v1a[1])-1, ui2 = parseInt(v2a[1])-1;
            var ni0 = parseInt(v0a[2])-1, ni1 = parseInt(v1a[2])-1, ni2 = parseInt(v2a[2])-1;
            
            var vlen = geom.vertices.length/3, ulen = geom.texCoords.length/2, nlen = geom.vertexNormals.length/3;
            if(vi0<0) vi0 = vlen + vi0+1; if(vi1<0) vi1 = vlen + vi1+1; if(vi2<0) vi2 = vlen + vi2+1;
            if(ui0<0) ui0 = ulen + ui0+1; if(ui1<0) ui1 = ulen + ui1+1; if(ui2<0) ui2 = ulen + ui2+1;
            if(ni0<0) ni0 = nlen + ni0+1; if(ni1<0) ni1 = nlen + ni1+1; if(ni2<0) ni2 = nlen + ni2+1;
            
            geom.verticesIndices.push(vi0, vi1, vi2);  //cg.verticesIndices.push(vi0, vi1, vi2)
            geom.texCoordsIndices  .push(ui0, ui1, ui2);  //cg.texCoordsIndices  .push(ui0, ui1, ui2);
            geom.vertexNormalIndices.push(ni0, ni1, ni2);  //cg.vertexNormalIndices.push(ni0, ni1, ni2);
            if(cds.length == 5)
            {
                var v3a = cds[4].split("/");
                var vi3 = parseInt(v3a[0])-1, ui3 = parseInt(v3a[1])-1, ni3 = parseInt(v3a[2])-1;
                if(vi3<0) vi3 = vlen + vi3+1;
                if(ui3<0) ui3 = ulen + ui3+1;
                if(ni3<0) ni3 = nlen + ni3+1;
                geom.verticesIndices.push(vi0, vi2, vi3);  //cg.verticesIndices.push(vi0, vi2, vi3);
                geom.texCoordsIndices  .push(ui0, ui2, ui3);  //cg.texCoordsIndices  .push(ui0, ui2, ui3);
                geom.vertexNormalIndices.push(ni0, ni2, ni3);  //cg.vertexNormalIndices.push(ni0, ni2, ni3);
            }
        }
    }
    cg.to = geom.verticesIndices.length;
    
    return geom;
};


