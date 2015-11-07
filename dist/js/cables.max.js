function generateUUID()
{
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
    {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

// ----------------------------------------------------------------

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


// ----------------------------------------------------------------

function ajaxRequest(url, callback)
{
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function(e)
    {
        callback(e.target.response);
    };
    request.send();
}

// ----------------------------------------------------------------

CABLES=CABLES || {};

CABLES.ajax=function(url,cb,method,post,contenttype)
{
    var requestTimeout,xhr;
    try{ xhr = new XMLHttpRequest(); }catch(e){}

    // requestTimeout = setTimeout(function() {xhr.abort(); cb(new Error("tinyxhr: aborted by a timeout"), "",xhr); }, 30000);
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState != 4) return;
        clearTimeout(requestTimeout);


        cb(xhr.status != 200?new Error(url+"server response status is "+xhr.status):false, xhr.responseText,xhr);
    };
    xhr.open(method?method.toUpperCase():"GET", url, true);

    if(!post) xhr.send();
    else
    {
        xhr.setRequestHeader('Content-type', contenttype?contenttype:'application/x-www-form-urlencoded');
        xhr.send(post);
    }
};

// ----------------------------------------------------------------


String.prototype.endl = function(){return this+'\n';};

// ----------------------------------------------------------------

var arrayContains = function(arr,obj)
{
    var i = arr.length;
    while (i--)
    {
        if (arr[i] === obj)
        {
            return true;
        }
    }
    return false;
};

// ----------------------------------------------------------------

CGL=CGL || {};
CGL.DEG2RAD=3.14159/180.0;
CGL.numMaxLoadingAssets=0;
CGL.numLoadingAssets=0;

CGL.onLoadingAssetsFinished=null;

CGL.finishedLoading=function()
{
    return CGL.numLoadingAssets!==0;
};

CGL.incrementLoadingAssets=function()
{
    CGL.numLoadingAssets++;
    CGL.numMaxLoadingAssets=Math.max(CGL.numLoadingAssets,CGL.numMaxLoadingAssets);
};

CGL.decrementLoadingAssets=function()
{
    CGL.numLoadingAssets--;
    setTimeout(CGL.getLoadingStatus,100);
};

CGL.getLoadingStatus=function()
{
    if(CGL.numMaxLoadingAssets===0)return 0;

    var stat=(CGL.numMaxLoadingAssets-CGL.numLoadingAssets)/CGL.numMaxLoadingAssets;
    if(stat==1 && CGL.onLoadingAssetsFinished)
    {
        CGL.onLoadingAssetsFinished();
    }
    return stat;
};








var CGL=CGL || {};


CGL.Mesh=function(_cgl,geom)
{
    var cgl=_cgl;
    var bufVertices = cgl.gl.createBuffer();
    var bufVerticesIndizes = cgl.gl.createBuffer();
    var attributes=[];

    var _geom=null;

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



var CGL=CGL || {};

// ---------------------------------------------------------------------------

CGL.profileUniformCount=0;


CGL.Uniform=function(_shader,_type,_name,_value)
{
    var self=this;
    var loc=-1;
    var name=_name;
    var type=_type;
    var value=0.00001;
    var shader=_shader;
    this.needsUpdate=true;

    shader.addUniform(this);

    this.getType=function() {return type;};
    this.getName=function() {return name;};
    this.getValue=function() {return value;};
    this.resetLoc=function() { loc=-1;self.needsUpdate=true; };

    this.updateValueF=function()
    {
        if(loc==-1) loc=shader.getCgl().gl.getUniformLocation(shader.getProgram(), name);
        else self.needsUpdate=false;
        shader.getCgl().gl.uniform1f(loc, value);
        CGL.profileUniformCount++;
    };

    this.bindTextures=function()
    {

    };

    this.setValueF=function(v)
    {
        if(v!=value)
        {
            self.needsUpdate=true;
            value=v;
            // self.updateValueF();
        }
    };


    this.updateValue4F=function()
    {
        if(loc==-1) loc=shader.getCgl().gl.getUniformLocation(shader.getProgram(), name);
        shader.getCgl().gl.uniform4f(loc, value[0],value[1],value[2],value[3]);
        CGL.profileUniformCount++;
        // self.needsUpdate=false;
    };

    this.setValue4F=function(v)
    {
        self.needsUpdate=true;
        value=v;
    };


    this.updateValueT=function()
    {
        if(loc==-1)
        {
            loc=shader.getCgl().gl.getUniformLocation(shader.getProgram(), name);
            if(loc==-1) console.log('texture loc unknown!!');
        }
        CGL.profileUniformCount++;
        shader.getCgl().gl.uniform1i(loc, value);
        self.needsUpdate=false;
    };

    this.setValueT=function(v)
    {
        self.needsUpdate=true;
        value=v;
    };

    if(type=='f')
    {
        this.setValue=this.setValueF;
        this.updateValue=this.updateValueF;
    }

    if(type=='4f')
    {
        this.setValue=this.setValue4F;
        this.updateValue=this.updateValue4F;
    }

    if(type=='t')
    {
        this.setValue=this.setValueT;
        this.updateValue=this.updateValueT;
    }

    this.setValue(_value);
    self.needsUpdate=true;
};

// ---------------------------------------------------------------------------

CGL.Shader=function(_cgl)
{
    if(!_cgl) throw "shader constructed without cgl";
    var self=this;
    var program=null;
    var uniforms=[];
    var defines=[];
    var needsRecompile=true;
    var infoLog='';
    var cgl=_cgl;
    var projMatrixUniform=null;
    var mvMatrixUniform=null;
    var normalMatrixUniform=null;
    var attrVertexPos = -1;

    this.getCgl=function()
    {
        return cgl;
    };

    this.define=function(name,value)
    {
        if(!value)value='';
        // for(var i in defines)
        for(var i=0;i<defines.length;i++)
        {
            if(defines[i][0]==name)
            {
                defines[i][1]=value;
                needsRecompile=true;
                return;
            }
        }
        defines.push([name,value]);
        needsRecompile=true;
    };

    this.removeDefine=function(name,value)
    {
        for(var i=0;i<defines.length;i++)
        {
            if(defines[i][0]==name)
            {
                defines.splice(i,1);
                needsRecompile=true;
                return;
            }
        }
                
    };

    this.removeUniform=function(name)
    {
        for(var i=0;i<uniforms.length;i++)
        {
            if(uniforms[i].getName()==name)
            {
                uniforms.splice(i,1);
            }
        }
        needsRecompile=true;
    };

    this.addUniform=function(uni)
    {
        uniforms.push(uni);
        needsRecompile=true;
    };

    this.getDefaultVertexShader=function()
    {
        return ''
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'varying vec3 norm;'
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'
        // .endl()+'uniform mat4 normalMatrix;'
        
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   texCoord=attrTexCoord;'
        .endl()+'   norm=attrVertNormal;'
        .endl()+'   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);'
        .endl()+'}';
    };

    this.getDefaultFragmentShader=function()
    {
        return ''
        .endl()+'precision mediump float;'
        .endl()+'varying vec3 norm;'
        .endl()+'void main()'
        .endl()+'{'

        .endl()+'   gl_FragColor = vec4(0.5,0.5,0.5,1.0);'
        // '   gl_FragColor = vec4(norm.x,norm.y,1.0,1.0);\n'+
        .endl()+'}';
    };

    this.getErrorFragmentShader=function()
    {
        return ''
        .endl()+'precision mediump float;'
        .endl()+'varying vec3 norm;'
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   gl_FragColor = vec4(1.0,0.0,0.0,1.0);'
        .endl()+'}';
    };

    this.srcVert=this.getDefaultVertexShader();
    this.srcFrag=this.getDefaultFragmentShader();

    this.setSource=function(srcVert,srcFrag)
    {
        this.srcVert=srcVert;
        this.srcFrag=srcFrag;
    };


    this.getAttrVertexPos=function(){return attrVertexPos;};

    this.hasTextureUniforms=function()
    {
        for(var i=0;i<uniforms.length;i++)
        {
            if(uniforms[i].getType()=='t') return true;
        }
        return false;
    };

    this.compile=function()
    {
        var definesStr='';
        var i=0;
        for(i=0;i<defines.length;i++)
        {
            definesStr+='#define '+defines[i][0]+' '+defines[i][1]+''.endl();
        }

        if(self.hasTextureUniforms()) definesStr+='#define HAS_TEXTURES'.endl();



        // console.log('shader compile...');
        // console.log('has textures: '+self.hasTextureUniforms() );

        var vs=definesStr+self.srcVert;
        var fs=definesStr+self.srcFrag;


        var srcHeadVert='';
        var srcHeadFrag='';
        for(i=0;i<moduleNames.length;i++)
        {
            var srcVert='';
            var srcFrag='';

            for(var j=0;j<modules.length;j++)
            {
                if(modules[j].name==moduleNames[i])
                {
                    srcVert+=modules[j].srcBodyVert || '';
                    srcFrag+=modules[j].srcBodyFrag || '';
                    srcHeadVert+=modules[j].srcHeadVert || '';
                    srcHeadFrag+=modules[j].srcHeadFrag || '';

                    srcVert=srcVert.replace(/{{mod}}/g,modules[j].prefix);
                    srcFrag=srcFrag.replace(/{{mod}}/g,modules[j].prefix);
                    srcHeadVert=srcHeadVert.replace(/{{mod}}/g,modules[j].prefix);
                    srcHeadFrag=srcHeadFrag.replace(/{{mod}}/g,modules[j].prefix);
                }
            }

            vs=vs.replace('{{'+moduleNames[i]+'}}',srcVert);
            fs=fs.replace('{{'+moduleNames[i]+'}}',srcFrag);
        }
        vs=vs.replace('{{MODULES_HEAD}}',srcHeadVert);
        fs=fs.replace('{{MODULES_HEAD}}',srcHeadFrag);


        if(!program)
        {
            program=createProgram(vs,fs, program);
        }
        else
        {
            // self.vshader=createShader(vs, gl.VERTEX_SHADER, self.vshader );
            // self.fshader=createShader(fs, gl.FRAGMENT_SHADER, self.fshader );
            // linkProgram(program);
            program=createProgram(vs,fs, program);
            
            mvMatrixUniform=null;

            for(i=0;i<uniforms.length;i++)
                uniforms[i].resetLoc();
        }

        needsRecompile=false;
    };


    this.bind=function()
    {
        if(!program || needsRecompile) self.compile();
        
        if(!mvMatrixUniform)
        {
            attrVertexPos = cgl.gl.getAttribLocation(program, 'vPosition');
            projMatrixUniform = cgl.gl.getUniformLocation(program, "projMatrix");
            mvMatrixUniform = cgl.gl.getUniformLocation(program, "mvMatrix");
            normalMatrixUniform = cgl.gl.getUniformLocation(program, "normalMatrix");
            for(var i=0;i<uniforms.length;i++)uniforms[i].needsUpdate=true;

        }

        if(cgl.currentProgram!=program)
        {
            cgl.gl.useProgram(program);
            cgl.currentProgram=program;
        }

        for(var i=0;i<uniforms.length;i++)
        {
            if(uniforms[i].needsUpdate)uniforms[i].updateValue();
        }

        cgl.gl.uniformMatrix4fv(projMatrixUniform, false, cgl.pMatrix);

        cgl.gl.uniformMatrix4fv(mvMatrixUniform, false, cgl.mvMatrix);
        
        if(normalMatrixUniform)
        {
            var normalMatrix = mat4.create();
            mat4.invert(normalMatrix,cgl.mvMatrix);
            mat4.transpose(normalMatrix, normalMatrix);

            cgl.gl.uniformMatrix4fv(normalMatrixUniform, false, normalMatrix);
        }

    };

    this.getProgram=function()
    {
        return program;
    };

    var createShader =function(str, type,_shader)
    {

        function getBadLines(infoLog)
        {
            var basLines=[];
            var lines=infoLog.split('\n');
            for(var i in lines)
            {
                var divide=lines[i].split(':');

                if(parseInt(divide[2],10))
                    basLines.push(parseInt( divide[2],10) );
            }
            // console.log('lines ',lines.length);
            return basLines;
        }

        var shader = _shader || cgl.gl.createShader(type);
        cgl.gl.shaderSource(shader, str);
        cgl.gl.compileShader(shader);
        if (!cgl.gl.getShaderParameter(shader, cgl.gl.COMPILE_STATUS))
        {
            console.log('compile status: ');

            if(type==cgl.gl.VERTEX_SHADER)console.log('VERTEX_SHADER');
            if(type==cgl.gl.FRAGMENT_SHADER)console.log('FRAGMENT_SHADER');
            
            console.warn( cgl.gl.getShaderInfoLog(shader) );


            var infoLog=cgl.gl.getShaderInfoLog(shader);
            var badLines=getBadLines(infoLog);
            var htmlWarning='<div class="shaderErrorCode">';
            var lines = str.match(/^.*((\r\n|\n|\r)|$)/gm);

            for(var i in lines)
            {
                var j=parseInt(i,10)+1;
                var line=j+': '+lines[i];
                console.log(line);

                var isBadLine=false;
                for(var bj in badLines) if(badLines[bj]==j) isBadLine=true;

        
                if(isBadLine) htmlWarning+='<span class="error">';
                htmlWarning+=line;
                if(isBadLine) htmlWarning+='</span>';
            }
            
            console.warn( infoLog );

            infoLog=infoLog.replace(/\n/g,'<br/>');

            htmlWarning=infoLog+'<br/>'+htmlWarning+'<br/><br/>';

            CABLES.UI.MODAL.showError('shader error',htmlWarning);

            htmlWarning+='</div>';

            self.setSource(self.getDefaultVertexShader(),self.getErrorFragmentShader());

        }
        return shader;
    };

    linkProgram=function(program)
    {
        cgl.gl.linkProgram(program);
        if (!cgl.gl.getProgramParameter(program, cgl.gl.LINK_STATUS))
        {
            self.setSource(self.getDefaultVertexShader(),self.getErrorFragmentShader());
        }
    };

    createProgram=function(vstr, fstr)
    {
        var program = cgl.gl.createProgram();
        self.vshader = createShader(vstr, cgl.gl.VERTEX_SHADER);
        self.fshader = createShader(fstr, cgl.gl.FRAGMENT_SHADER);
        cgl.gl.attachShader(program, self.vshader);
        cgl.gl.attachShader(program, self.fshader);

        linkProgram(program);
        return program;
    };

    var moduleNames=[];
    var modules=[];
    var moduleNumId=0;
    
    this.removeModule=function(mod)
    {
        for(var i=0;i<modules.length;i++)
        {
            if(modules[i].id==mod.id)
            {
                modules.splice(i,1);
                break;
            }
        }
        needsRecompile=true;
    };

    this.addModule=function(mod)
    {
        mod.id=generateUUID();
        mod.numId=moduleNumId;
        mod.prefix='mod'+moduleNumId;

        modules.push(mod);
        needsRecompile=true;
        moduleNumId++;

        return mod;
    };

    this.setModules=function(names)
    {
        moduleNames=names;
    };


};




var CGL=CGL || {};

CGL.State=function()
{
    var self=this;
    var mvMatrixStack=[];
    var pMatrixStack=[];
    var shaderStack=[];
    var viewPort=[0,0,0,0];

    this.frameStore={};

    this.pMatrix=mat4.create();
    this.mvMatrix=mat4.create();
    this.canvas=null;
    mat4.identity(self.mvMatrix);

    var simpleShader=new CGL.Shader(this);
    var currentShader=simpleShader;

    this.setCanvas=function(id)
    {
        this.canvas=document.getElementById(id);
        this.gl=this.canvas.getContext("experimental-webgl",
        {
            preserveDrawingBuffer: true,
            antialias:true
        });

        this.canvasWidth=this.canvas.clientWidth;
        this.canvasHeight=this.canvas.clientHeight;
    };

    this.canvasWidth=-1;
    this.canvasHeight=-1;

    this.wireframe=false;
    this.points=false;

    this.doScreenshot=false;
    this.screenShotDataURL=null;


    this.getViewPort=function()
    {
        return viewPort;
    };

    this.resetViewPort=function()
    {
        this.gl.viewport(
            viewPort[0],
            viewPort[1],
            viewPort[2],
            viewPort[3]);
    };
    this.setViewPort=function(x,y,w,h)
    {
        viewPort[0]=parseInt(x,10);
        viewPort[1]=parseInt(y,10);
        viewPort[2]=parseInt(w,10);
        viewPort[3]=parseInt(h,10);
        this.gl.viewport(
            viewPort[0],
            viewPort[1],
            viewPort[2],
            viewPort[3]);
    };

    this.beginFrame=function()
    {
        self.setShader(simpleShader);
    };

    this.endFrame=function()
    {
        self.setPreviousShader();
        if(mvMatrixStack.length>0) console.warn('mvmatrix stack length !=0 at end of rendering...');
        if(pMatrixStack.length>0) console.warn('pmatrix stack length !=0 at end of rendering...');
        if(shaderStack.length>0) console.warn('shaderStack length !=0 at end of rendering...');
        mvMatrixStack.length=0;
        pMatrixStack.length=0;
        shaderStack.length=0;

        if(this.doScreenshot)
        {
            console.log('do screenshot');

            this.doScreenshot=false;
            this.screenShotDataURL = document.getElementById("glcanvas").toDataURL('image/png');
        }
    };

    // shader stack

    this.getShader=function()
    {
        return currentShader;
    };

    this.setShader=function(shader)
    {
        shaderStack.push(shader);
        currentShader=shader;
    };

    this.setPreviousShader=function()
    {
        if(shaderStack.length===0) throw "Invalid movelview popMatrix!";
        shaderStack.pop();
        currentShader = shaderStack[shaderStack.length-1];
    };

    // modelview matrix stack

    this.pushMvMatrix=function()
    {
        var copy = mat4.create();
        mat4.copy(copy,self.mvMatrix);
        mvMatrixStack.push(copy);
    };

    this.popMvMatrix=function()
    {
        if(mvMatrixStack.length===0) throw "Invalid movelview popMatrix!";
        self.mvMatrix = mvMatrixStack.pop();
    };

    // projection matrix stack

    this.pushPMatrix=function()
    {
        var copy = mat4.create();
        mat4.copy(copy,self.pMatrix);
        pMatrixStack.push(copy);
    };

    this.popPMatrix=function()
    {
        if(pMatrixStack.length===0) throw "Invalid projection popMatrix!";
        self.pMatrix = pMatrixStack.pop();
    };
};




var CGL=CGL || {};

CGL.Texture=function(cgl,options)
{
    if(!cgl) throw "no cgl";
    var self=this;
    this.tex = cgl.gl.createTexture();
    this.width=0;
    this.height=0;
    this.flip=true;
    this.filter=CGL.Texture.FILTER_NEAREST;
    var isDepthTexture=false;

    if(options)
    {
        if(options.isDepthTexture)
            isDepthTexture=options.isDepthTexture;
    }

    this.isPowerOfTwo=function()
    {
        return _isPowerOfTwo(this.width) && _isPowerOfTwo(this.width);
    };

    function _isPowerOfTwo (x)
    {
        return ( x == 1 || x == 2 || x == 4 || x == 8 || x == 16 || x == 32 || x == 64 || x == 128 || x == 256 || x == 512 || x == 1024 || x == 2048 || x == 4096 || x == 8192 || x == 16384);
    }

    function setFilter()
    {
        if(!_isPowerOfTwo(self.width) || !_isPowerOfTwo(self.height) )
        {
            cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_WRAP_S, cgl.gl.CLAMP_TO_EDGE);
            cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_WRAP_T, cgl.gl.CLAMP_TO_EDGE);
        }
        else
        {
            if(self.filter==CGL.Texture.FILTER_NEAREST)
            {
                cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MAG_FILTER, cgl.gl.NEAREST);
                cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MIN_FILTER, cgl.gl.NEAREST);
            }

            if(self.filter==CGL.Texture.FILTER_LINEAR)
            {
                cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MIN_FILTER, cgl.gl.LINEAR);
                cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MAG_FILTER, cgl.gl.LINEAR);
            }

            if(self.filter==CGL.Texture.FILTER_MIPMAP)
            {
                cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MAG_FILTER, cgl.gl.LINEAR);
                cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MIN_FILTER, cgl.gl.NEAREST_MIPMAP_LINEAR);
            }
        }
    }


    this.setSize=function(w,h)
    {
        self.width=w;
        self.height=h;

        // console.log('self.width',self.width,self.height);

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.tex);

        var uarr=null;
        // if(!isDataTexture)
        // {
        //     var arr=[];
        //     arr.length=w*h*4;
        //     // for(var x=0;x<w;x++)
        //     // {
        //     //     for(var y=0;y<h;y++)
        //     //     {
        //     //         // var index=x+y*w;
        //     //         arr.push( parseInt( (x/w)*255,10) );
        //     //         arr.push(0);
        //     //         arr.push( parseInt((y/w)*255,10));
        //     //         arr.push(255);
        //     //     }
        //     // }
        //     uarr=new Uint8Array(arr);

        // }


        setFilter();

        if(isDepthTexture)
        {
            cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.DEPTH_COMPONENT, w,h, 0, cgl.gl.DEPTH_COMPONENT, cgl.gl.UNSIGNED_SHORT, null);
        }
        else
        {
            cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.RGBA, w, h, 0, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, uarr);
        }


        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
    };

    this.initTexture=function(img)
    {
        self.width=img.width;
        self.height=img.height;

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.tex);
        if(self.flip) cgl.gl.pixelStorei(cgl.gl.UNPACK_FLIP_Y_WEBGL, true);
        cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.RGBA, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, self.image);

        setFilter();

        if(_isPowerOfTwo(self.width) && _isPowerOfTwo(self.height) && self.filter==CGL.Texture.FILTER_MIPMAP)
        {
            cgl.gl.generateMipmap(cgl.gl.TEXTURE_2D);
        }
    
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);

    };

    this.setSize(8,8);

    this.preview=function()
    {
        CGL.Texture.previewTexture=self;
    };

};

CGL.Texture.load=function(cgl,url,finishedCallback,settings)
{
    CGL.incrementLoadingAssets();
    var texture=new CGL.Texture(cgl);
    texture.image = new Image();

    if(settings && settings.hasOwnProperty('filter')) texture.filter=settings.filter;

    texture.image.onload=function()
    {
        texture.initTexture(texture.image);
        if(finishedCallback)finishedCallback();
        CGL.decrementLoadingAssets();
    };
    texture.image.src = url;
    return texture;
};



CGL.Texture.fromImage=function(cgl,img)
{
    var texture=new CGL.Texture(cgl);
    texture.flip=true;
    texture.image = img;
    texture.initTexture(img);
    return texture;
};

CGL.Texture.FILTER_NEAREST=0;
CGL.Texture.FILTER_LINEAR=1;
CGL.Texture.FILTER_MIPMAP=2;

// ---------------------------------------------------------------------------

CGL.Texture.previewTexture=null;
CGL.Texture.texturePreviewer=null;
CGL.Texture.texturePreview=function(cgl)
{
    var size=2;

    var geom=new CGL.Geometry();

    geom.vertices = [
         size/2,  size/2,  0.0,
        -size/2,  size/2,  0.0,
         size/2, -size/2,  0.0,
        -size/2, -size/2,  0.0
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
    var mesh=new CGL.Mesh(cgl,geom);



    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'uniform sampler2D tex;'
        .endl()+'uniform float time;'

        .endl()+''
        .endl()+'void main()'
        .endl()+'{'

        .endl()+'   vec4 col;'

        .endl()+'bool isEven = mod(time+texCoord.y+texCoord.x,0.2)>0.1;'
        .endl()+'vec4 col1 = vec4(0.2,0.2,0.2,1.0);'
        .endl()+'vec4 col2 = vec4(0.5,0.5,0.5,1.0);'
        .endl()+'col = (isEven)? col1:col2;'

        .endl()+'vec4 colTex = texture2D(tex,texCoord);;'
        .endl()+'col = mix(col,colTex,colTex.a);'

        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader(cgl);
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    var timeUni=new CGL.Uniform(shader,'f','time',0);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var startTime=Date.now()/1000.0;

    this.render=function(tex)
    {
        console.log('previewing ',tex.width,tex.height);
        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        timeUni.setValue( (Date.now()/1000.0-startTime)*0.1 );

        cgl.setShader(shader);

        if(tex)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, tex.tex);
        }

        mesh.render(cgl.getShader());
        cgl.setPreviousShader();
    };

};


var CGL=CGL || {};

CGL.TextureEffect=function(cgl)
{
    var self=this;
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

    var mesh=new CGL.Mesh(cgl,geom);

    var textureSource=null;
    var textureTarget=new CGL.Texture(cgl);

    var frameBuf = cgl.gl.createFramebuffer();
    var renderbuffer = cgl.gl.createRenderbuffer();

    var switched=false;

    this.startEffect=function()
    {
        switched=false;
    };

    this.setSourceTexture=function(tex)
    {
        if(tex===null)
        {
            textureSource=new CGL.Texture(cgl);
            textureSource.setSize(16,16);
        }
        else
        {
            textureSource=tex;
        }
        
        textureTarget.setSize(textureSource.width,textureSource.height);

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);

        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, renderbuffer);
        cgl.gl.renderbufferStorage(cgl.gl.RENDERBUFFER, cgl.gl.DEPTH_COMPONENT16, textureSource.width,textureSource.height);
        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, textureTarget.tex, 0);
        cgl.gl.framebufferRenderbuffer(cgl.gl.FRAMEBUFFER, cgl.gl.DEPTH_ATTACHMENT, cgl.gl.RENDERBUFFER, renderbuffer);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        // console.log(
        //     self.getCurrentTargetTexture().width,
        //     self.getCurrentSourceTexture().height
        //     );
    };


    this.getCurrentTargetTexture=function()
    {
        if(switched)return textureSource;
            else return textureTarget;
    };

    this.getCurrentSourceTexture=function()
    {
        if(switched)return textureTarget;
            else return textureSource;
    };

    this.bind=function()
    {
        if(textureSource===null)
        {
            console.log('no base texture set!');
            return;
        }

        cgl.pushMvMatrix();

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, self.getCurrentTargetTexture().tex, 0);

        cgl.pushPMatrix();
        cgl.gl.viewport(0, 0, self.getCurrentTargetTexture().width,self.getCurrentTargetTexture().height);
        mat4.perspective(cgl.pMatrix,45, self.getCurrentTargetTexture().width/self.getCurrentTargetTexture().height, 0.01, 1100.0);

        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    };

    this.finish=function()
    {
        if(textureSource===null)
        {
            console.log('no base texture set!');
            return;
        }

        mesh.render(cgl.getShader());

        cgl.popPMatrix();
        cgl.popMvMatrix();

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        cgl.popPMatrix();
        // cgl.gl.viewport(0, 0, cgl.canvasWidth,cgl.canvasHeight);
        cgl.resetViewPort();

        cgl.popMvMatrix();

        switched=!switched;
    };

};
var PORT_DIR_IN=0;
var PORT_DIR_OUT=1;

var OP_PORT_TYPE_VALUE =0;
var OP_PORT_TYPE_FUNCTION =1;
var OP_PORT_TYPE_OBJECT =2;
var OP_PORT_TYPE_TEXTURE =2;
var OP_PORT_TYPE_ARRAY =3;
var OP_PORT_TYPE_DYNAMIC=4;

var Ops = {};

var Op = function(_patch)
{
    this.objName='';
    this.portsOut=[];
    this.portsIn=[];
    this.posts=[];
    this.uiAttribs={};
    this.enabled=true;
    this.patch=_patch;
    this.name='unknown';
    this.id=generateUUID();
    this.onAddPort=null;
    this.onCreate=null;
    this.onResize=null;
    this.onLoaded=null;
    this.onDelete=null;
    this.onUiAttrChange=null;

    this.uiAttr=function(newAttribs)
    {
        if(!this.uiAttribs)this.uiAttribs={};
        for(var p in newAttribs)
        {
            this.uiAttribs[p]=newAttribs[p];
        }
        if(this.onUiAttrChange) this.onUiAttrChange();
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addOutPort=function(p)
    {
        p.direction=PORT_DIR_OUT;
        p.parent=this;
        this.portsOut.push(p);
        if(this.onAddPort)this.onAddPort(p);
        return p;
    };

    this.hasPort=function(name)
    {
        for(var i in this.portsIn)
        {
            if(this.portsIn[i].getName()==name)
            {
                return true;
            }
        }
        return false;
    };

    this.addInPort=function(p)
    {
        p.direction=PORT_DIR_IN;
        p.parent=this;
        this.portsIn.push(p);
        if(this.onAddPort)this.onAddPort(p);
        return p;
    };

    this.printInfo=function()
    {
        for(var i=0;i<this.portsIn.length;i++)
            console.log('in: '+this.portsIn[i].getName());

        for(var ipo in this.portsOut)
            console.log('out: '+this.portsOut[ipo].getName());
    };

    this.removeLinks=function()
    {
        for(var i=0;i<this.portsIn.length;i++)
            this.portsIn[i].removeLinks();

        for(var ipo in this.portsOut)
            this.portsOut[ipo].removeLinks();
    };


    this.findFittingPort=function(otherPort)
    {
        for(var ipo in this.portsOut)
            if(Link.canLink(otherPort,this.portsOut[ipo]))return this.portsOut[ipo];
    
        for(var ipi in this.portsIn)
            if(Link.canLink(otherPort,this.portsIn[ipi]))return this.portsIn[ipi];
    };

    this.getSerialized=function()
    {
        var op={};
        op.name=this.getName();
        op.objName=this.objName;
        op.id=this.id;
        op.uiAttribs=this.uiAttribs;
        op.portsIn=[];
        op.portsOut=[];

        for(var i=0;i<this.portsIn.length;i++)
        {
            if(this.portsIn[i].type!=OP_PORT_TYPE_DYNAMIC)
            op.portsIn.push( this.portsIn[i].getSerialized() );
        }

        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].type!=OP_PORT_TYPE_DYNAMIC)
                op.portsOut.push( this.portsOut[ipo].getSerialized() );

        return op;
    };

    this.getPortByName=function(name)
    {
        for(var ipi in this.portsIn)
            if(this.portsIn[ipi].getName()==name)return this.portsIn[ipi];

        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].getName()==name)return this.portsOut[ipo];
    };

    this.getPort=function(name)
    {
        return this.getPortByName(name);
    };

    this.updateAnims=function()
    {
        for(var i=0;i<this.portsIn.length;i++)
        {
            this.portsIn[i].updateAnim();
        }
    };


};

// ------------------------------------------------------------------------------------


var Port=function(parent,name,type,uiAttribs)
{
    var self=this;
    this.direction=PORT_DIR_IN;
    this.id=generateUUID();
    this.parent=parent;
    this.links=[];
    this.value=0.0;
    this.name=name;
    this.type=type || OP_PORT_TYPE_VALUE;
    this.uiAttribs=uiAttribs || {};
    var valueBeforeLink=null;
    this.anim=null;
    var animated=false;
    var oldAnimVal=-5711;
    this.onLink=null;
    this.showPreview=false;
    var uiActiveState=true;
    this.ignoreValueSerialize=false;
    this.onLinkChanged=null;

    this.doShowPreview=function(onOff)
    {
        if(onOff!=self.showPreview)
        {
            self.showPreview=onOff;
            self.onPreviewChanged();
        }
    };

    this.onPreviewChanged=function(){};
    this.shouldLink=function(){return true;};


    this.get=function()
    {
        return this.value;
    };

    this.set=function(v)
    {
        this.setValue(v);
    };

    this.__defineGetter__("val", function()
        {
            // throw "deprecated val";
                    
            // if(animated)
            // {

            //     this.value=self.anim.getValue(parent.patch.timer.getTime());

            //     if(oldAnimVal!=this.value)
            //     {
            //         oldAnimVal=this.value;
            //         console.log('changed!!');
            //         this.onValueChanged();
            //     }
            //     oldAnimVal=this.value;
            //     console.log('this.value ',this.value );
                        
            //     return this.value;
            // }

            return this.value;
        });
    this.__defineSetter__("val", function(v){ this.setValue(v); });

    this.getType=function(){ return this.type; };
    this.isLinked=function(){ return this.links.length>0; };
    this.onValueChanged=null;
    this.onTriggered=null;
    this._onTriggered=function()
    {
        parent.updateAnims();
        if(parent.enabled && self.onTriggered) self.onTriggered();
    };

    this.setValue=function(v)
    {
        if(parent.enabled)
        {
            if(v!=this.value || this.type==OP_PORT_TYPE_TEXTURE)
            {
                if(animated)
                {
                    self.anim.setValue(parent.patch.timer.getTime(),v);
                }
                else
                {
                    this.value=v;
                    if(this.onValueChanged)this.onValueChanged();
                }

                // if(this.links.length!==0)
                for (var i = 0; i < this.links.length; ++i)
                {
                    this.links[i].setValue();
                }
            }
        }
    };

    this.updateAnim=function()
    {
        if(animated)
        {
            this.value=self.anim.getValue(parent.patch.timer.getTime());

            if(oldAnimVal!=this.value)
            {
                oldAnimVal=this.value;
                if(this.onValueChanged)this.onValueChanged();
            }
            oldAnimVal=this.value;
        }
    };

    this.isAnimated=function()
    {
        return animated;
    };

    this.getUiActiveState=function()
    {
        return uiActiveState;
    };
    this.setUiActiveState=function(onoff)
    {
        uiActiveState=onoff;
        if(this.onUiActiveStateChange)this.onUiActiveStateChange();
    };

    this.onUiActiveStateChange=null;

    this.onAnimToggle=function(){};
    this._onAnimToggle=function(){this.onAnimToggle();};

    this.setAnimated=function(a)
    {
        if(animated!=a)
        {
            animated=a;
            if(animated && !self.anim)self.anim=new CABLES.TL.Anim();
            this._onAnimToggle();
        }
    };

    this.toggleAnim=function(val)
    {
        animated=!animated;
        if(animated && !self.anim)self.anim=new CABLES.TL.Anim();
        self.setAnimated(animated);
        this._onAnimToggle();
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addLink=function(l)
    {
        if(this.onLinkChanged)this.onLinkChanged();
        valueBeforeLink=self.value;
        this.links.push(l);
    };

    this.removeLinkTo=function(p2)
    {
        for(var i in this.links)
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)
                this.links[i].remove();
    };

    this.isLinkedTo=function(p2)
    {
        for(var i in this.links)
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)return true;

        return false;
    };

    this.trigger=function()
    {
        if(!parent.enabled)return;
        if(this.links.length===0)return;

        for (var i = 0; i < this.links.length; ++i)
        // for(var i in this.links)
        {
            // if(this.direction==PORT_DIR_OUT)this.links[i].portIn._onTriggered();
            // else
             this.links[i].portIn._onTriggered();
            // if(this.links[i].portIn !=this)
            // else if(this.links[i].portOut!=this)
        }
    };

    this.call=function()
    {
        console.log('call deprecated - use trigger() ');
        this.trigger();
    };

    this.execute=function()
    {
        console.log('### execute port: '+this.getName() , this.goals.length);
    };

    this.getTypeString=function()
    {
        if(this.type==OP_PORT_TYPE_VALUE)return 'value';
        if(this.type==OP_PORT_TYPE_FUNCTION)return 'function';
        if(this.type==OP_PORT_TYPE_TEXTURE)return 'texture';
    };

    this.getSerialized=function()
    {
        var obj={};
        obj.name=this.getName();

        if(!this.ignoreValueSerialize) obj.value=this.value;
            else console.log('ja hier nicht speichern....');

        if(animated) obj.animated=true;
        if(this.anim) obj.anim=this.anim.getSerialized();

        if(this.direction==PORT_DIR_IN && this.links.length>0)
        {
            obj.links=[];
            for(var i in this.links)
            {
                obj.links.push( this.links[i].getSerialized() );
            }
        }
        return obj;
    };

    this.removeLinks=function()
    {
        while(this.links.length>0)
            this.links[0].remove();
    };

    this.removeLink=function(link)
    {
        if(this.onLinkChanged)this.onLinkChanged();

        for(var i in this.links)
            if(this.links[i]==link)this.links.splice( i, 1 );

        self.setValue(valueBeforeLink);
    };
};

// ---------------------------------------------------------------------------

var Link = function(scene)
{
    this.portIn=null;
    this.portOut=null;
    this.scene=scene;

    this.setValue=function(v)
    {
        this.portIn.val=v;
    };

    this.setValue=function()
    {
        // try
        // if(this.portIn.val!=this.portOut.val)
        //     this.portIn.val=this.portOut.val;

        if(this.portIn.get()!=this.portOut.get())
            this.portIn.set(this.portOut.get());


        // catch(exc)
        // {
        //     console.log('',this);
                    
        //     // console.log('exc',exc);
                    
        // }
    };

    this.getOtherPort=function(p)
    {
        if(p==this.portIn)return this.portOut;
        return this.portIn;
    };

    this.remove=function()
    {
        this.portIn.removeLink(this);
        this.portOut.removeLink(this);
        this.scene.onUnLink(this.portIn,this.portOut);
        this.portIn=null;
        this.portOut=null;
        this.scene=null;
    };

    this.link=function(p1,p2)
    {
        if(!Link.canLink(p1,p2))
        {
            console.log('cannot link ports!');
            return false;
        }
        if(p1.direction==PORT_DIR_IN)
        {
            this.portIn=p1;
            this.portOut=p2;
        }
        else
        {
            this.portIn=p2;
            this.portOut=p1;
        }

        p1.addLink(this);
        p2.addLink(this);
        if(p1.onLink) p1.onLink(this);
        if(p2.onLink) p2.onLink(this);
        this.setValue();
    };

    this.getSerialized=function()
    {
        var obj={};

        obj.portIn=this.portIn.getName();
        obj.portOut=this.portOut.getName();
        obj.objIn=this.portIn.parent.id;
        obj.objOut=this.portOut.parent.id;

        return obj;
    };
};

Link.canLinkText=function(p1,p2)
{
    if(p1.direction==p2.direction)
    {
        var txt='(out)';
        if(p2.direction==PORT_DIR_IN)txt="(in)";
        return 'can not link: same direction'+txt;
    }
    if(p1.parent==p2.parent)return 'can not link: same op';
    if( p1.type!=OP_PORT_TYPE_DYNAMIC && p2.type!=OP_PORT_TYPE_DYNAMIC )
    {
        if(p1.type!=p2.type)return 'can not link: different type';
    }
 
    if(!p1)return 'can not link: port 1 invalid';
    if(!p2)return 'can not link: port 2 invalid';

    if(p1.direction==PORT_DIR_IN && p1.isAnimated())return 'can not link: is animated';
    if(p2.direction==PORT_DIR_IN && p2.isAnimated())return 'can not link: is animated';


    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return 'input port already busy';
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return 'input port already busy';
    if(p1.isLinkedTo(p2))return 'ports already linked';


    return 'can link';
};

Link.canLink=function(p1,p2)
{
    if( p1.type==OP_PORT_TYPE_DYNAMIC || p2.type==OP_PORT_TYPE_DYNAMIC )return true;
    if(!p1)return false;
    if(!p2)return false;
    if(p1.direction==PORT_DIR_IN && p1.isAnimated())return false;
    if(p2.direction==PORT_DIR_IN && p2.isAnimated())return false;

    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return false;
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return false;
    if(p1.isLinkedTo(p2))return false;
    if(p1.direction==p2.direction)return false;
    if(p1.type!=p2.type)return false;
    if(p1.parent==p2.parent)return false;

    return true;
};

// ------------------------------------------------------------------------------------

var Scene = function(cfg)
{
    var self=this;
    this.ops=[];
    this.settings={};
    this.timer=new Timer();
    this.animFrameOps=[];
    this.gui=false;

    this.onLoadStart=null;
    this.onLoadEnd=null;

    this.config = cfg ||
    {
        glCanvasId:'glcanvas',
        prefixAssetPath:''
    };

    this.cgl=new CGL.State();
    this.cgl.patch=this;
    this.cgl.setCanvas(this.config.glCanvasId);


    this.getFilePath=function(filename)
    {
        return this.config.prefixAssetPath+filename;
    };

    this.clear=function()
    {
        self.animFrameOps.length=0;
        this.timer=new Timer();
        while(this.ops.length>0)
        {
            this.deleteOp(this.ops[0].id);
        }
    };

    this.addOp=function(objName,uiAttribs)
    {

        // console.log('objName',objName);
        // var op=eval('new '+objName+'();');
        var parts=objName.split('.');
        var op=null;
        if(parts.length==2) op=new window[parts[0]][parts[1]](this);
        else if(parts.length==3) op=new window[parts[0]][parts[1]][parts[2]](this);
        else if(parts.length==4) op=new window[parts[0]][parts[1]][parts[2]][parts[3]](this);
        else if(parts.length==5) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]](this);
        else console.log('parts.length',parts.length);

        // var op=new window[objName]();
        op.objName=objName;
        op.patch=this;
        op.uiAttr(uiAttribs);
        if(op.onCreate)op.onCreate();

        if(op.hasOwnProperty('onAnimFrame')) this.animFrameOps.push(op);

        this.ops.push(op);

        if(this.onAdd)this.onAdd(op);
        return op;
    };

    this.removeOnAnimFrame=function(op)
    {
        for(var i=0;i<this.animFrameOps.length;i++)
        {
            this.animFrameOps.splice(i,1);
        }

    };

    this.deleteOp=function(opid,tryRelink)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)
            {
                var op=this.ops[i];
                var reLinkP1=null;
                var reLinkP2=null;

                if(op)
                {
                    if(tryRelink)
                    {
                        if(
                            (this.ops[i].portsIn.length>0 && this.ops[i].portsIn[0].isLinked()) &&
                            (this.ops[i].portsOut.length>0 && this.ops[i].portsOut[0].isLinked()))
                        {
                            if(this.ops[i].portsIn[0].getType()==this.ops[i].portsOut[0].getType())
                            {
                                reLinkP1=this.ops[i].portsIn[0].links[0].getOtherPort(this.ops[i].portsIn[0]);
                                reLinkP2=this.ops[i].portsOut[0].links[0].getOtherPort(this.ops[i].portsOut[0]);
                            }
                        }
                    }

                    this.ops[i].removeLinks();
                    this.onDelete(this.ops[i]);
                    this.ops[i].id=generateUUID();
                    if(this.ops[i].onDelete)this.ops[i].onDelete();
                    this.ops.splice( i, 1 );


                    if(reLinkP1!==null && reLinkP2!==null)
                    {
                        self.link(
                            reLinkP1.parent,
                            reLinkP1.getName(),
                            reLinkP2.parent,
                            reLinkP2.getName()
                            );
                    }
                }
            }
        }
    };

    this.exec=function(e)
    {

        if(CGL.getLoadingStatus()>0 && CGL.getLoadingStatus()<1.0)
        {
            // setTimeout(function()
            // {
                requestAnimationFrame(self.exec);
            // 120);
        }
        else
        {
            requestAnimationFrame(self.exec);
        }
        self.timer.update();

        var time=self.timer.getTime();

        // for(var i in self.animFrameOps)
        for (var i = 0; i < self.animFrameOps.length; ++i)
        {
            self.animFrameOps[i].onAnimFrame(time);
        }
    };

    this.link=function(op1,port1Name,op2,port2Name)
    {
        if(!op1 || !op2)return;
        var port1=op1.getPort(port1Name);
        var port2=op2.getPort(port2Name);

        if(!port1)
        {
            console.warn('port not found! '+port1Name);
            return;
        }
        if(!port2)
        {
            console.warn('port not found! '+port2Name);
            return;
        }

        if(!port1.shouldLink(port1,port2) || !port2.shouldLink(port1,port2))
        {
            return false;
        }

        if(Link.canLink(port1,port2))
        {
            var link=new Link(this);
            link.link(port1,port2);

            this.onLink(port1,port2);
            return link;
        }
        else
        {
            console.log(Link.canLinkText(port1,port2));
        }
    };

    this.onAdd=function(op){};
    this.onDelete=function(op){};
    this.onLink=function(p1,p2){};
    this.onUnLink=function(p1,p2){};
    this.serialize=function(asObj)
    {
        var obj={};

        obj.ops=[];
        obj.settings=this.settings;
        for(var i in this.ops)
        {
            obj.ops.push( this.ops[i].getSerialized() );
        }
        
        if(asObj)return obj;
        return JSON.stringify(obj);
    };

    this.getOpById=function(opid)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)return this.ops[i];
        }
    };

    this.getSubPatchOp=function(patchId,objName)
    {
        for(var i in self.ops)
        {
            if(self.ops[i].uiAttribs && self.ops[i].uiAttribs.subPatch==patchId && self.ops[i].objName==objName)
            {
                return self.ops[i];
            }
        }

        return false;
    };

    this.deSerialize=function(obj)
    {
        if(this.onLoadStart)this.onLoadStart();


        if (typeof obj === "string") obj=JSON.parse(obj);
        var self=this;

        this.settings=obj.settings;

        function addLink(opinid,opoutid,inName,outName)
        {
            var found=false;
            if(!found)
            {
                self.link(
                    self.getOpById(opinid),
                    inName,
                    self.getOpById(opoutid),
                    outName
                    );
            }
        }

        // console.log('add ops ',self.config.glCanvasId);
        // add ops...
        for(var iop in obj.ops)
        {
            var op=this.addOp(obj.ops[iop].objName,obj.ops[iop].uiAttribs);
            op.id=obj.ops[iop].id;

            for(var ipi in obj.ops[iop].portsIn)
            {
                var objPort=obj.ops[iop].portsIn[ipi];

                var port=op.getPort(objPort.name);

                if(port && port.type!=OP_PORT_TYPE_TEXTURE)port.val=objPort.value;
                if(objPort.animated)port.setAnimated(objPort.animated);
                if(objPort.anim)
                {
                    if(!port.anim) port.anim=new CABLES.TL.Anim();

                    if(objPort.anim.loop) port.anim.loop=objPort.anim.loop;

                    for(var ani in objPort.anim.keys)
                    {
                        // var o={t:objPort.anim.keys[ani].t,value:objPort.anim.keys[ani].v};
                        port.anim.keys.push(new CABLES.TL.Key(objPort.anim.keys[ani]) );
                    }
                }
            }

            for(var ipo in obj.ops[iop].portsOut)
            {
                var port2=op.getPort(obj.ops[iop].portsOut[ipo].name);
                if(port2&& port2.type!=OP_PORT_TYPE_TEXTURE)port2.val=obj.ops[iop].portsOut[ipo].value;
            }
        }
        // console.log('create links...');
                

        // create links...
        for(iop in obj.ops)
        {
            for(var ipi2 in obj.ops[iop].portsIn)
            {
                for(var ili in obj.ops[iop].portsIn[ipi2].links)
                {
                    addLink(
                        obj.ops[iop].portsIn[ipi2].links[ili].objIn,
                        obj.ops[iop].portsIn[ipi2].links[ili].objOut,
                        obj.ops[iop].portsIn[ipi2].links[ili].portIn,
                        obj.ops[iop].portsIn[ipi2].links[ili].portOut);
                }
            }
        }

        // console.log('create uuids ');

        for(var i in this.ops)
        {
            this.ops[i].id=generateUUID();
        }

        if(this.onLoadEnd)this.onLoadEnd();

    };

    this.exec();

};


var CABLES=CABLES || {};
CABLES.TL=CABLES.TL || {};

CABLES.TL.EASING_LINEAR=0;
CABLES.TL.EASING_ABSOLUTE=1;
CABLES.TL.EASING_SMOOTHSTEP=2;
CABLES.TL.EASING_SMOOTHERSTEP=3;
CABLES.TL.EASING_BEZIER=4;

CABLES.TL.EASING_CUBIC_IN=5;
CABLES.TL.EASING_CUBIC_OUT=6;
CABLES.TL.EASING_CUBIC_INOUT=7;

CABLES.TL.EASING_EXPO_IN=8;
CABLES.TL.EASING_EXPO_OUT=9;
CABLES.TL.EASING_EXPO_INOUT=10;

CABLES.TL.EASING_SIN_IN=11;
CABLES.TL.EASING_SIN_OUT=12;
CABLES.TL.EASING_SIN_INOUT=13;



CABLES.TL.Key=function(obj)
{
    this.time=0.0;
    this.value=0.0;
    this.ui={};
    this.onChange=null;
    var easing=0;
    this.bezTime=0.5;
    this.bezValue=0;
    this.bezTimeIn=-0.5;
    this.bezValueIn=0;
    var bezierAnim=null;
    var updateBezier=false;
    var self=this;

    this.setBezierControlOut=function(t,v)
    {
        this.bezTime=t;
        this.bezValue=v;
        updateBezier=true;
        if(this.onChange!==null)this.onChange();
    };

    this.setBezierControlIn=function(t,v)
    {
        this.bezTimeIn=t;
        this.bezValueIn=v;
        updateBezier=true;
        if(this.onChange!==null)this.onChange();
    };

    this.setValue=function(v)
    {
        this.value=v;
        updateBezier=true;
        if(this.onChange!==null)this.onChange();
    };

    this.set=function(obj)
    {
        if(obj)
        {
            if(obj.e) this.setEasing(obj.e);

            if(obj.b)
            {
                this.bezTime=obj.b[0];
                this.bezValue=obj.b[1];
                this.bezTimeIn=obj.b[2];
                this.bezValueIn=obj.b[3];
                updateBezier=true;
            }

            if(obj.hasOwnProperty('t'))this.time=obj.t;
            if(obj.hasOwnProperty('time')) this.time=obj.time;

            if(obj.hasOwnProperty('v')) this.value=obj.v;
                else if(obj.hasOwnProperty('value')) this.value=obj.value;
        }
        if(this.onChange!==null)this.onChange();

    };

    this.getSerialized=function()
    {
        var obj={};
        obj.t=this.time;
        obj.v=this.value;
        obj.e=easing;
        if(easing==CABLES.TL.EASING_BEZIER)
            obj.b=[this.bezTime,this.bezValue,this.bezTimeIn,this.bezValueIn];
                
        return obj;
    };
    

    if("isUI" in this)
    {
        // this.initUI();
    }

    function linear(perc,key1,key2)
    {
        return parseFloat(key1.value)+ parseFloat((key2.value - key1.value)) * perc;
    }

    this.easeLinear=function(perc,key2)
    {
        return linear(perc,this,key2);
    };

    this.easeAbsolute=function(perc,key2)
    {
        return this.value;
    };




    this.easeExpoIn=function( t,  key2)
    {
        t= Math.pow( 2, 10 * (t - 1) );
        return linear(t,this,key2);
    };

    this.easeExpoOut=function( t,  key2)
    {
        t= ( -Math.pow( 2, -10 * t ) + 1 );
        return linear(t,this,key2);
    };

    this.easeExpoInOut=function( t,  key2)
    {
        t*=2;
        if (t < 1)
        {
          t= 0.5 * Math.pow( 2, 10 * (t - 1) );
        }
        else
        {
            t--;
            t= 0.5 * ( -Math.pow( 2, -10 * t) + 2 );
        }
        return linear(t,this,key2);
    };




    this.easeSinIn=function( t,key2)
    {
        t= -1 * Math.cos(t * Math.PI/2) + 1;
        return linear(t,this,key2);
    };

    this.easeSinOut=function( t,key2)
    {
        t= Math.sin(t * Math.PI/2);
        return linear(t,this,key2);
    };

    this.easeSinInOut=function( t,key2)
    {
        t= -0.5 * (Math.cos(Math.PI*t) - 1.0);
        return linear(t,this,key2);
    };


    this.easeCubicIn=function(t,key2)
    {
        t=t*t*t;
        return linear(t,this,key2);
    };

    this.easeCubicOut=function(t,key2)
    {
        t--;
        t=(t*t*t + 1) ;
        return linear(t,this,key2);
    };

    this.easeCubicInOut=function(t,key2)
    {
        t*=2;
        if (t < 1) t= 0.5*t*t*t;
        else
        {
            t -= 2;
            t= 0.5*(t*t*t + 2);
        }
        return linear(t,this,key2);
    };



    this.easeSmoothStep=function(perc,key2)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*(3 - 2*x); // smoothstep
        return linear(perc,this,key2);
    };

    this.easeSmootherStep=function(perc,key2)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*x*(x*(x*6 - 15) + 10); // smootherstep
        return linear(perc,this,key2);
    };

    BezierB1=function(t) { return t*t*t; };
    BezierB2=function(t) { return 3*t*t*(1-t); };
    BezierB3=function(t) { return 3*t*(1-t)*(1-t); };
    BezierB4=function(t) { return (1-t)*(1-t)*(1-t); };
    Bezier =function(percent,nextKey)
    {
        var val1x=nextKey.time;
        var val1y=nextKey.value;

        var c1x=nextKey.time+nextKey.bezTimeIn;
        var c1y=nextKey.value-nextKey.bezValueIn;

        var val2x=self.time;
        var val2y=self.value;

        var c2x=self.time+self.bezTime;
        var c2y=self.value-self.bezValue;

        var x = val1x*BezierB1(percent) + c1x*BezierB2(percent) + val2x*BezierB3(percent) + c2x*BezierB4(percent);
        var y = val1y*BezierB1(percent) + c1y*BezierB2(percent) + val2y*BezierB3(percent) + c2y*BezierB4(percent);

        return {x:x,y:y};
    };



    this.easeBezier=function(percent,nextKey)
    {
        if(!bezierAnim)
        {
            bezierAnim=new CABLES.TL.Anim();
            updateBezier=true;
        }

        var timeSpan=nextKey.time-self.time;
        if(updateBezier)
        {
            bezierAnim.clear();

            var steps=20;
            var is=1/steps;
            
            for(var i=0;i<steps;i++)
            {
                var v=Bezier(i*is,nextKey);

                var time=self.time+timeSpan/steps*i;

                bezierAnim.setValue(v.x,v.y);

                // console.log('key ',time,v.y);
            }
            updateBezier=false;
        }

        return bezierAnim.getValue(self.time+percent*timeSpan);
    };

    this.getEasing=function()
    {
        return easing;
    };

    this.setEasing=function(e)
    {
        easing=e;

        if(easing==CABLES.TL.EASING_ABSOLUTE) this.ease=this.easeAbsolute;
        else if(easing==CABLES.TL.EASING_SMOOTHSTEP) this.ease=this.easeSmoothStep;
        else if(easing==CABLES.TL.EASING_SMOOTHERSTEP) this.ease=this.easeSmootherStep;

        else if(easing==CABLES.TL.EASING_CUBIC_IN) this.ease=this.easeCubicIn;
        else if(easing==CABLES.TL.EASING_CUBIC_OUT) this.ease=this.easeCubicOut;
        else if(easing==CABLES.TL.EASING_CUBIC_INOUT) this.ease=this.easeCubicInOut;

        else if(easing==CABLES.TL.EASING_EXPO_IN) this.ease=this.easeExpoIn;
        else if(easing==CABLES.TL.EASING_EXPO_OUT) this.ease=this.easeExpoOut;
        else if(easing==CABLES.TL.EASING_EXPO_INOUT) this.ease=this.easeExpoInOut;

        else if(easing==CABLES.TL.EASING_SIN_IN) this.ease=this.easeSinIn;
        else if(easing==CABLES.TL.EASING_SIN_OUT) this.ease=this.easeSinOut;
        else if(easing==CABLES.TL.EASING_SIN_INOUT) this.ease=this.easeSinInOut;

        else if(easing==CABLES.TL.EASING_BEZIER)
        {
            updateBezier=true;
            this.ease=this.easeBezier;
        }
        else
        {
            easing=CABLES.TL.EASING_LINEAR;
            this.ease=this.easeLinear;
        }
    };

    this.setEasing(CABLES.TL.EASING_LINEAR);
    this.set(obj);

};

CABLES.TL.Anim=function(cfg)
{
    this.keys=[];
    this.onChange=null;
    this.stayInTimeline=false;
    this.loop=false;
    this.defaultEasing=CABLES.TL.EASING_LINEAR;

    this.clear=function()
    {
        this.keys.length=0;
    };

    this.sortKeys=function()
    {
        this.keys.sort(function(a, b)
        {
            return parseFloat(a.time) - parseFloat(b.time);
        });
    };

    this.getKeyIndex=function(time)
    {
        var theKey=0;
        for(var i in this.keys)
        {
            if(time >= this.keys[i].time) theKey=i;
            if( this.keys[i].time > time ) return theKey;
        }
        return theKey;
    };
    this.setValue=function(time,value)
    {
        var found=false;
        for(var i in this.keys)
        {
            if(this.keys[i].time==time)
            {
                found=this.keys[i];
                this.keys[i].setValue(value);
                break;
            }
        }

        if(!found)
        {
            console.log('not found');
                    
            this.keys.push(new CABLES.TL.Key({time:time,value:value,e:this.defaultEasing})) ;
        }

        if(this.onChange)this.onChange();
        this.sortKeys();
    };


    this.getSerialized=function()
    {
        var obj={};
        obj.keys=[];
        obj.loop=this.loop;

        for(var i in this.keys)
        {
            obj.keys.push( this.keys[i].getSerialized() );
        }

        return obj;
    };


    this.getKey=function(time)
    {
        var index=this.getKeyIndex(time);
        return this.keys[index];
    };

    this.getValue=function(time)
    {
        if(this.keys.length===0)return 0;

        if(time<this.keys[0].time)return this.keys[0].value;

        
        if(this.loop && time>this.keys[this.keys.length-1].time)
        {
            time=(time-this.keys[0].time)%(this.keys[this.keys.length-1].time-this.keys[0].time);
            time+=this.keys[0].time;
        }

        var index=this.getKeyIndex(time);
        if(index>=this.keys.length-1)return this.keys[this.keys.length-1].value;
        var index2=parseInt(index,10)+1;
        var key1=this.keys[index];
        var key2=this.keys[index2];

        if(!key2)return -1;

        var perc=(time-key1.time)/(key2.time-key1.time);
        return key1.ease(perc,key2);
    };

    this.addKey=function(k)
    {
        if(k.time===undefined)
        {
            console.log('key time undefined, ignoreing!');
        }
        else
        {
            this.keys.push(k);
        }
    };
};




var CABLES=CABLES || {};

CABLES.Variable=function()
{
    var value=null;
    var changedCallbacks=[];


    this.onChanged=function(f)
    {
        changedCallbacks.push(f);
    };

    this.getValue=function()
    {
        return value;
    };

    this.setValue=function(v)
    {
        value=v;
        emitChanged();
    };

    var emitChanged=function()
    {
        for(var i=0;i<changedCallbacks.length;i++)
        {
            changedCallbacks[i]();
        }
    };



};



function Timer()
{
    var self=this;
    var timeStart=Date.now();
    var timeOffset=0;

    var currentTime=0;
    var lastTime=0;
    var paused=true;
    var delay=0;
    var eventsPaused=false;
    this.overwriteTime=-1;

    function getTime()
    {
        lastTime=(Date.now()-timeStart)/1000;
        return lastTime+timeOffset;
    }

    this.setDelay=function(d)
    {
        delay=d;
        eventTimeChange();
    };

    this.isPlaying=function()
    {
        return !paused;
    };

    this.update=function()
    {
        if(paused) return;
        currentTime=getTime();

        return currentTime;
    };

    this.getTime=function()
    {
        if(this.overwriteTime>=0)return this.overwriteTime-delay;
        return currentTime-delay;
    };

    this.togglePlay=function()
    {
        if(paused) self.play();
            else self.pause();
    };

    this.setTime=function(t)
    {
        if(t<0)t=0;
        timeStart=Date.now();
        timeOffset=t;
        currentTime=t;
        eventTimeChange();
    };

    this.setOffset=function(val)
    {
        if(currentTime+val<0)
        {
            timeStart=Date.now();
            timeOffset=0;
            currentTime=0;
        }
        else
        {
            timeOffset+=val;
            currentTime=lastTime+timeOffset;
        }
        eventTimeChange();
    };

    this.play=function()
    {
        timeStart=Date.now();
        paused=false;
        eventPlayPause();
    };

    this.pause=function()
    {
        timeOffset=currentTime;
        paused=true;
        eventPlayPause();
    };

    // ----------------

    var cbPlayPause=[];
    var cbTimeChange=[];
    function eventPlayPause()
    {
        if(eventsPaused)return;
        for(var i in cbPlayPause) cbPlayPause[i]();
    }

    function eventTimeChange()
    {
        if(eventsPaused)return;
        for(var i in cbTimeChange) cbTimeChange[i]();
    }

    this.pauseEvents=function(onoff)
    {
        eventsPaused=onoff;
    };

    this.onPlayPause=function(cb)
    {
        if(cb && typeof cb == "function")
            cbPlayPause.push(cb);
    };

    this.onTimeChange=function(cb)
    {
        if(cb && typeof cb == "function")
            cbTimeChange.push(cb);
    };

}