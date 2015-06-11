var CGL=CGL || {};

CGL.Mesh=function(geom)
{
    var bufTexCoords=-1;
    // var bufTexCoordsIndizes=-1;

    var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geom.vertices), gl.STATIC_DRAW);
    bufVertices.itemSize = 3;
    bufVertices.numItems = geom.vertices.length/3;


    var bufVerticesIndizes = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufVerticesIndizes);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geom.verticesIndices), gl.STATIC_DRAW);
    bufVerticesIndizes.itemSize = 1;
    bufVerticesIndizes.numItems = geom.verticesIndices.length;

    if(geom.texCoords.length>0)
    {
        bufTexCoords = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTexCoords);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geom.texCoords), gl.STATIC_DRAW);
        bufTexCoords.itemSize = 2;
        bufTexCoords.numItems = geom.texCoords.length/bufTexCoords.itemSize;
    }



    this.render=function(shader)
    {
        shader.bind();

        GL.enableVertexAttribArray(shader.getAttrVertexPos());
        if(bufTexCoords!=-1) GL.enableVertexAttribArray(shader.getAttrTexCoords());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.vertexAttribPointer(shader.getAttrVertexPos(),bufVertices.itemSize, gl.FLOAT, false, 0, 0);

        if(bufTexCoords!=-1)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTexCoords);
            gl.vertexAttribPointer(shader.getAttrTexCoords(),bufTexCoords.itemSize, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufVerticesIndizes);
        gl.drawElements(gl.TRIANGLES, bufVerticesIndizes.numItems, gl.UNSIGNED_SHORT, 0);
    };

};

CGL.Geometry=function()
{
    this.faceVertCount=3;
    this.vertices=[];
    this.verticesIndices=[];
    this.texCoords=[];
    this.texCoordsIndices=[];
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
    
    // geom.texCoords   = [];
    geom.c_norms = [];
    
    // geom.texCoordsIndices   = [];
    geom.i_norms = [];
    
    var cg = {from: 0, to:0};   // current group
    var off = 0;
    var a = new Uint8Array(buff);
    
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
            if(geom.groups[cds[1]] == null) geom.groups[cds[1]] = {from:geom.verticesIndices.length, to:0};
            cg = geom.groups[cds[1]];
        }
        if(cds[0] == "v")
        {
            var x = parseFloat(cds[1]);
            var y = parseFloat(cds[2]);
            var z = parseFloat(cds[3]);
            geom.vertices.push(x,y,z);
        }
        if(cds[0] == "vt")
        {
            var x = parseFloat(cds[1]);
            var y = 1-parseFloat(cds[2]);
            geom.texCoords.push(x,y);
        }
        if(cds[0] == "vn")
        {
            var x = parseFloat(cds[1]);
            var y = parseFloat(cds[2]);
            var z = parseFloat(cds[3]);
            geom.c_norms.push(x,y,z);
        }
        if(cds[0] == "f")
        {
            var v0a = cds[1].split("/"), v1a = cds[2].split("/"), v2a = cds[3].split("/");
            var vi0 = parseInt(v0a[0])-1, vi1 = parseInt(v1a[0])-1, vi2 = parseInt(v2a[0])-1;
            var ui0 = parseInt(v0a[1])-1, ui1 = parseInt(v1a[1])-1, ui2 = parseInt(v2a[1])-1;
            var ni0 = parseInt(v0a[2])-1, ni1 = parseInt(v1a[2])-1, ni2 = parseInt(v2a[2])-1;
            
            var vlen = geom.vertices.length/3, ulen = geom.texCoords.length/2, nlen = geom.c_norms.length/3;
            if(vi0<0) vi0 = vlen + vi0+1; if(vi1<0) vi1 = vlen + vi1+1; if(vi2<0) vi2 = vlen + vi2+1;
            if(ui0<0) ui0 = ulen + ui0+1; if(ui1<0) ui1 = ulen + ui1+1; if(ui2<0) ui2 = ulen + ui2+1;
            if(ni0<0) ni0 = nlen + ni0+1; if(ni1<0) ni1 = nlen + ni1+1; if(ni2<0) ni2 = nlen + ni2+1;
            
            geom.verticesIndices.push(vi0, vi1, vi2);  //cg.verticesIndices.push(vi0, vi1, vi2)
            geom.texCoordsIndices  .push(ui0, ui1, ui2);  //cg.texCoordsIndices  .push(ui0, ui1, ui2);
            geom.i_norms.push(ni0, ni1, ni2);  //cg.i_norms.push(ni0, ni1, ni2);
            if(cds.length == 5)
            {
                var v3a = cds[4].split("/");
                var vi3 = parseInt(v3a[0])-1, ui3 = parseInt(v3a[1])-1, ni3 = parseInt(v3a[2])-1;
                if(vi3<0) vi3 = vlen + vi3+1;
                if(ui3<0) ui3 = ulen + ui3+1;
                if(ni3<0) ni3 = nlen + ni3+1;
                geom.verticesIndices.push(vi0, vi2, vi3);  //cg.verticesIndices.push(vi0, vi2, vi3);
                geom.texCoordsIndices  .push(ui0, ui2, ui3);  //cg.texCoordsIndices  .push(ui0, ui2, ui3);
                geom.i_norms.push(ni0, ni2, ni3);  //cg.i_norms.push(ni0, ni2, ni3);
            }
        }
    }
    cg.to = geom.verticesIndices.length;
    
    return geom;
};



var CGL=CGL || {};

// ---------------------------------------------------------------------------

CGL.Uniform=function(_shader,_type,_name,_value)
{
    var self=this;
    var loc=-1;
    var name=_name;
    var type=_type;
    var value=0;
    var shader=_shader;
    this.needsUpdate=true;

    shader.addUniform(this);

    this.getType=function() {return type;};
    this.getName=function() {return name;};

    this.resetLoc=function() { loc=-1;};

    this.updateValueF=function()
    {
        if(loc==-1) loc=gl.getUniformLocation(shader.getProgram(), name);
        gl.uniform1f(loc, value);
    };

    this.setValueF=function(v)
    {
        self.needsUpdate=true;
        value=v;
    };

    this.updateValueT=function()
    {
        if(loc==-1)
        {
            loc=gl.getUniformLocation(shader.getProgram(), name);
            if(loc==-1) console.log('texture loc unknown!!');
        }

        gl.uniform1i(loc, 0);
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

    if(type=='t')
    {
        this.setValue=this.setValueT;
        this.updateValue=this.updateValueT;
    }

    this.setValue(_value);
};

// ---------------------------------------------------------------------------

CGL.Shader=function()
{
    var self=this;
    var program=false;
    var uniforms=[];
    var needsRecompile=true;

    this.removeUniform=function(name)
    {
        console.log('before: '+uniforms.length);
        for(var i in uniforms)
        {
            if(uniforms[i].getName()==name)
            {
                uniforms.splice(i,1);
                break;
            }
        }
        needsRecompile=true;
        console.log(uniforms.length);
                
    };

    this.addUniform=function(uni)
    {
        uniforms.push(uni);
        needsRecompile=true;
    };

    this.getDefaultVertexShader=function()
    {
        return ''+
        'attribute vec3 vPosition;\n'+
        'attribute vec2 attrTexCoord;\n'+
        'varying vec2 texCoord;\n'+
        'uniform mat4 projMatrix;\n'+
        'uniform mat4 mvMatrix;\n'+
        'void main()\n'+
        '{\n'+
        '   texCoord=attrTexCoord;\n'+
        // '   gl_PointSize=3.0;\n'+
        '   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n'+
        '}\n';
    };

    this.getDefaultFragmentShader=function()
    {
        return ''+
        'precision mediump float;\n'+
        'void main()\n'+
        '{\n'+

        '   gl_FragColor = vec4(0.5,0.5,0.5,1.0);\n'+
        '}\n';
    };

    this.srcVert=this.getDefaultVertexShader();
    this.srcFrag=this.getDefaultFragmentShader();

    this.setSource=function(srcVert,srcFrag)
    {
        this.srcVert=srcVert;
        this.srcFrag=srcFrag;
    };

    var projMatrixUniform=-1;
    var mvMatrixUniform=-1;

    var attrTexCoords = -1;
    var attrVertexPos = -1;

    this.getAttrTexCoords=function(){return attrTexCoords;};
    this.getAttrVertexPos=function(){return attrVertexPos;};

    this.hasTextureUniforms=function()
    {
        for(var i in uniforms)
        {
            if(uniforms[i].getType()=='t') return true;
        }
        return false;
    };

    this.compile=function()
    {
        var defines='';
        if(self.hasTextureUniforms()) defines+='#define HAS_TEXTURES'.endl();

        console.log('shader compile...');
        console.log('has textures: '+self.hasTextureUniforms() );
        

        var vs=defines+self.srcVert;
        var fs=defines+self.srcFrag;

        if(!program)
        {
            console.log('create shaderprogram');
                    
            program=createProgram(vs,fs, program);
        }
        else
        {
            console.log('recompile shaders...');

            self.vshader=createShader(vs, gl.VERTEX_SHADER, self.vshader );
            self.fshader=createShader(fs, gl.VERTEX_SHADER, self.fshader );
            linkProgram(program);
            mvMatrixUniform=-1;

            for(var i in uniforms)uniforms[i].resetLoc();
            

        }

        needsRecompile=false;
    };

    this.bind=function()
    {
        if(!program || needsRecompile) self.compile();

        if(mvMatrixUniform==-1)
        {
            attrTexCoords = gl.getAttribLocation(program, 'attrTexCoord');
            attrVertexPos = gl.getAttribLocation(program, 'vPosition');

            projMatrixUniform = gl.getUniformLocation(program, "projMatrix");
            mvMatrixUniform = gl.getUniformLocation(program, "mvMatrix");
        }

        GL.useProgram(program);

        for(var i in uniforms)
        {
            if(uniforms[i].needsUpdate)uniforms[i].updateValue();
        }

        gl.uniformMatrix4fv(projMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);
    };

    this.getProgram=function()
    {
        return program;
    };


    createShader =function(str, type,_shader)
    {
        var shader = _shader || gl.createShader(type);
        gl.shaderSource(shader, str);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            console.log('compile status: ');

            if(type==gl.VERTEX_SHADER)console.log('VERTEX_SHADER');
            if(type==gl.FRAGMENT_SHADER)console.log('FRAGMENT_SHADER');
            
            throw gl.getShaderInfoLog(shader);
        }
        return shader;
    };

    linkProgram=function(program)
    {
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            throw gl.getProgramInfoLog(program);
        }

    };

    createProgram=function(vstr, fstr)
    {
        var program = gl.createProgram();
        self.vshader = createShader(vstr, gl.VERTEX_SHADER);
        self.fshader = createShader(fstr, gl.FRAGMENT_SHADER);
        gl.attachShader(program, self.vshader);
        gl.attachShader(program, self.fshader);

        linkProgram(program);
        return program;
    };



};


var CGL=CGL || {};

CGL.Texture=function()
{
    var self=this;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([111, 111, 111, 255]));
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.bind=function(slot)
    {
        gl.activeTexture(gl.TEXTURE0+slot);
        gl.bindTexture(gl.TEXTURE_2D, self.tex);
    };

    this.initTexture=function(img)
    {
        gl.bindTexture(gl.TEXTURE_2D, self.tex);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        // non power of two:
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.bindTexture(gl.TEXTURE_2D, null);
    };
};

CGL.Texture.load=function(url)
{
    var texture=new CGL.Texture();
    texture.image = new Image();
    texture.image.onload = function ()
    {
        console.log(texture.image);
                
        texture.initTexture(texture.image);
    };
    texture.image.src = url;
    return texture;
};

// ---------------------------------------------------------------------------


var PORT_DIR_IN=0;
var PORT_DIR_OUT=1;

var OP_PORT_TYPE_VALUE =0;
var OP_PORT_TYPE_FUNCTION =1;
var OP_PORT_TYPE_TEXTURE =2;

var Ops = {};


var Op = function()
{
    this.objName='';
    this.portsOut=[];
    this.portsIn=[];
    this.posts=[];
    this.uiAttribs={};
    this.name='unknown';
    this.id=generateUUID();

    this.getName= function()
    {
        return this.name;
    };
    this.addOutPort=function(p)
    {
        p.direction=PORT_DIR_OUT;
        p.parent=this;
        this.portsOut.push(p);
        return p;
    };
    this.addInPort=function(p)
    {
        p.direction=PORT_DIR_IN;
        p.parent=this;
        this.portsIn.push(p);
        return p;
    };
    this.execute=function()
    {
        this.exec();
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

    this.getPort=function(name)
    {
        for(var ipi in this.portsIn)
            if(this.portsIn[ipi].getName()==name)return this.portsIn[ipi];

        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].getName()==name)return this.portsOut[ipo];
    };

    this.findFittingPort=function(otherPort)
    {
        for(var ipo in this.portsOut)
        {
            console.log('.');
            if(Link.canLink(otherPort,this.portsOut[ipo]))return this.portsOut[ipo];
        }
    
        for(var ipi in this.portsIn)
        {
            console.log('.');
            if(Link.canLink(otherPort,this.portsIn[ipi]))return this.portsIn[ipi];
        }

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
            op.portsIn.push( this.portsIn[i].getSerialized() );

        for(var ipo in this.portsOut)
            op.portsOut.push( this.portsOut[ipo].getSerialized() );

        return op;
    };

    this.getPortByName=function(name)
    {
        for(var i=0;i<this.portsIn.length;i++)
            if(this.portsIn[i].name==name)return this.portsIn[i];
        
        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].name==name)return this.portsOut[ipo];
    };

};

// ------------------------------------------------------------------------------------

var Port=function(parent,name,type)
{
    var self=this;
    this.direction=PORT_DIR_IN;
    this.id=generateUUID();
    this.parent=parent;
    this.links=[];
    this.value=null;
    this.name=name;
    this.type=type || OP_PORT_TYPE_VALUE;
    var valueBeforeLink=null;

    this.__defineGetter__("val", function()
    {
        return this.value;
    });

    this.__defineSetter__("val", function(v)
    {
        this.setValue(v);
    });

    this.onValueChanged=function(){};
    this.onTriggered=function(){};

    this.setValue=function(v)
    {
        if(v!=this.value)
        {
            this.value=v;
            this.onValueChanged();

            for(var i in this.links)
            {
                this.links[i].setValue();
            }
        }
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addLink=function(l)
    {
        valueBeforeLink=self.value;
        this.links.push(l);
    };

    this.isLinkedTo=function(p2)
    {
        for(var i in this.links)
        {
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)return true;
        }
        return false;
    };

    this.call=function()
    {
        for(var i in this.links)
        {
            if(this.links[i].portIn !=this)this.links[i].portIn.onTriggered();
            if(this.links[i].portOut!=this)this.links[i].portOut.onTriggered();
        }
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
        obj.value=this.value;

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
        {
            this.links[0].remove();
        }
    };

    this.removeLink=function(link)
    {
        for(var i in this.links)
        {
            if(this.links[i]==link)this.links.splice( i, 1 );
        }
        self.setValue(valueBeforeLink);
    };
};



// ---------------------------------------------------------------------------

var Link = function(scene)
{
    this.portIn=null;
    this.portOut=null;
    this.scene=scene;

    this.setValue=function()
    {
        if(this.portIn.val!=this.portOut.val)
            this.portIn.val=this.portOut.val;
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
    if(!p1)return 'can not link: port 1 invalid';
    if(!p2)return 'can not link: port 2 invalid';
    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return 'input port already busy';
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return 'input port already busy';
    if(p1.isLinkedTo(p2))return 'ports already linked';
    if(p1.direction==p2.direction)return 'can not link: same direction';
    if(p1.type!=p2.type)return 'can not link: different type';
    if(p1.parent==p2.parent)return 'can not link: same op';
    return 'can link';
};

Link.canLink=function(p1,p2)
{
    if(!p1)return false;
    if(!p2)return false;
    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return false;
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return false;
    if(p1.isLinkedTo(p2))return false;
    if(p1.direction==p2.direction)return false;
    if(p1.type!=p2.type)return false;
    if(p1.parent==p2.parent)return false;

    return true;
};


// ------------------------------------------------------------------------------------


var Scene = function()
{
    var self=this;
    this.ops=[];
    this.timer=new Timer();
    this.animFrameOps=[];
    

    this.clear=function()
    {
        this.timer=new Timer();
        while(this.ops.length>0)
        {
            this.deleteOp(this.ops[0].id);
        }
    };

    this.addOp=function(objName,uiAttribs)
    {
        var op=eval('new '+objName+'();');
        op.objName=objName;
        op.uiAttribs=uiAttribs;

        if(op.hasOwnProperty('onAnimFrame')) this.animFrameOps.push(op);

        this.ops.push(op);
        if(this.onAdd)this.onAdd(op);
        return op;
    };

    this.deleteOp=function(opid)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)
            {
                this.ops[i].removeLinks();
                this.onDelete(this.ops[i]);
                this.ops.splice( i, 1 );
            }
        }
    };

    this.exec=function()
    {
        requestAnimationFrame(self.exec);
        self.timer.update();

        var time=self.timer.getTime();

        for(var i in self.animFrameOps)
        {
            self.animFrameOps[i].onAnimFrame(time);
        }

    };

    this.link=function(op1,port1Name,op2,port2Name)
    {
        var port1=op1.getPort(port1Name);
        var port2=op2.getPort(port2Name);

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
    this.serialize=function()
    {
        var obj={};

        obj.ops=[];
        for(var i in this.ops)
        {
            obj.ops.push( this.ops[i].getSerialized() );
        }
        
        return JSON.stringify(obj);
    };
    this.getOpById=function(opid)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)return this.ops[i];
        }

    };
    this.deSerialize=function(obj)
    {
        if (typeof obj === "string") obj=JSON.parse(obj);
        var self=this;

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

        // add ops...
        for(var iop in obj.ops)
        {
            var op=this.addOp(obj.ops[iop].objName,obj.ops[iop].uiAttribs);
            op.id=obj.ops[iop].id;

            for(var ipi in obj.ops[iop].portsIn)
            {
                var port=op.getPortByName(obj.ops[iop].portsIn[ipi].name);
                if(port && port.type!=OP_PORT_TYPE_TEXTURE)port.val=obj.ops[iop].portsIn[ipi].value;
            }

            for(var ipo in obj.ops[iop].portsOut)
            {
                var port2=op.getPortByName(obj.ops[iop].portsOut[ipo].name);
                if(port2&& port2.type!=OP_PORT_TYPE_TEXTURE)port2.val=obj.ops[iop].portsOut[ipo].value;
            }


            // op.uiAttribs=obj.ops[iop].uiAttribs;
        }

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


            // for(var ipo in obj.ops[iop].portsOut)
            // {
            //     for(var ili in obj.ops[iop].portsOut[ipo].links)
            //     {
            //         addLink(
            //             obj.ops[iop].portsOut[ipo].links[ili].objIn,
            //             obj.ops[iop].portsOut[ipo].links[ili].objOut,
            //             obj.ops[iop].portsOut[ipo].links[ili].portIn,
            //             obj.ops[iop].portsOut[ipo].links[ili].portOut);

            //     }
            // }
        }


        for(var i in this.ops)
        {
            this.ops[i].id=generateUUID();
        }



    };

    this.exec();

};







function Timer()
{
    var self=this;
    var timeStart=Date.now();
    var timeOffset=0;

    var currentTime=0;
    var lastTime=0;
    var paused=true;

    function getTime()
    {
        lastTime=(Date.now()-timeStart)/1000;
        return lastTime+timeOffset;

    }

    this.update=function()
    {
        if(paused) return;
        currentTime=getTime();

        return currentTime;
    };

    this.getTime=function()
    {
        return currentTime;
    };

    this.togglePlay=function()
    {
        if(paused)self.play();
            else self.pause();
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
        

    };

    this.play=function()
    {
        timeStart=Date.now();
        paused=false;
    };

    this.pause=function()
    {
        timeOffset=currentTime;
        paused=true;
    };

}
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

String.prototype.endl = function(){return this+'\n';};



//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl={};
var GL=null;
var GL=null;

var currentShader=null;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
    var self=this;

    var simpleShader=new CGL.Shader();
 

    this.name='WebGL Renderer';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var initTranslate=vec3.create();
    vec3.set(initTranslate, 0,0,-2);

    this.onAnimFrame=function(time)
    {
        currentShader=simpleShader;
        gl.enable(gl.DEPTH_TEST);
        GL.clearColor(0,0,0,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        gl.viewport(0,0,self.canvas.clientWidth,self.canvas.clientHeight);
        mat4.perspective(pMatrix,45, self.canvas.clientWidth/self.canvas.clientHeight, 0.01, 1100.0);
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix,mvMatrix, initTranslate);

        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA,GL.ONE_MINUS_SRC_ALPHA);

        self.trigger.call();
    };

    this.canvas = document.getElementById("glcanvas");
    GL = this.canvas.getContext("experimental-webgl");
    gl = this.canvas.getContext("experimental-webgl");

};

Ops.Gl.Renderer.prototype = new Op();




// --------------------------------------------------------------------------


Ops.Gl.ClearColor = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearColor';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r"));
    this.g=this.addInPort(new Port(this,"g"));
    this.b=this.addInPort(new Port(this,"b"));

    this.render.onTriggered=function()
    {
        GL.clearColor(self.r.val,self.g.val,self.b.val,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        self.trigger.call();
    };

};

Ops.Gl.ClearColor.prototype = new Op();




// --------------------------------------------------------------------------


Ops.Gl.ClearDepth = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearDepth';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        GL.clear(GL.DEPTH_BUFFER_BIT);
        self.trigger.call();
    };
};

Ops.Gl.ClearDepth.prototype = new Op();

// --------------------------------------------------------------------------


    
Ops.Gl.Texture = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='texture';
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE));
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    
    this.filename.onValueChanged=function()
    {
        console.log('load texture...');
        self.tex=CGL.Texture.load(self.filename.val);
        self.textureOut.val=self.tex.tex;
    };

    this.filename.val='assets/skull.png';
    // this.filename.onValueChanged();
    // this.textureOut.val=this.tex.tex;
};

Ops.Gl.Texture.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Gl.Meshes={};



Ops.Gl.Meshes.Rectangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    // this.render.onTriggered=function()
    // {
    //     // currentShader.setAttributeVertex( self.squareVertexPositionBuffer.itemSize);
    //     gl.vertexAttribPointer(currentShader.getAttrVertexPos(),self.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //     currentShader.bind();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);
    //     gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.squareVertexPositionBuffer.numItems);

    //     self.trigger.call();
    // };

    // this.squareVertexPositionBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    // this.vertices = [

    // ];
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    // this.squareVertexPositionBuffer.itemSize = 3;
    // this.squareVertexPositionBuffer.numItems = 4;


    this.render.onTriggered=function()
    {
        self.mesh.render(currentShader);
        self.trigger.call();
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

Ops.Gl.Meshes.Rectangle.prototype = new Op();






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
        if(self.mesh)
        {
            self.mesh.render(currentShader);
        }

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
        if(self.mesh!==null)
        {
            self.mesh.render(currentShader);
        }

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


Ops.Gl.Meshes.Plotter = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Plotter';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.v=this.addInPort(new Port(this,"value"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        // currentShader.setAttributeVertex( self.buffer.itemSize);
        gl.vertexAttribPointer(currentShader.getAttrVertexPos(),self.buffer.itemSize, gl.FLOAT, false, 0, 0);
        currentShader.bind();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
        gl.drawArrays(gl.LINE_STRIP, 0, self.buffer.numItems);

        self.trigger.call();
    };

    this.buffer = gl.createBuffer();
    
    var num=50;
    this.vertices = [];
    for(var i=0;i<num;i++)
    {
        this.vertices.push(1/num*i);
        this.vertices.push(Math.random()-0.5);
        this.vertices.push(0);
    }

    function bufferData()
    {
        gl.lineWidth(4);

        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.vertices), gl.STATIC_DRAW);
        self.buffer.itemSize = 3;
        self.buffer.numItems = num;
    }
    bufferData();

    this.v.onValueChanged=function()
    {
        self.vertices.splice(0,3);
        self.vertices.push(1);
        self.vertices.push(self.v.val);
        self.vertices.push(0);

        for(var i=0;i<num*3;i+=3)
        {
            self.vertices[i]=1/num*i;
        }

        bufferData();
    };


};

Ops.Gl.Meshes.Plotter.prototype = new Op();


// ----------------------------------------------------------------

Ops.Gl.Meshes.Triangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Triangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        self.mesh.render(currentShader);
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


Ops.Gl.Shader={};

Ops.Gl.Shader.BasicMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='BasicMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    this.doRender=function()
    {
        var oldShader=currentShader;
        currentShader=shader;

        if(self.texture.val)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, self.texture.val);
        }

        self.trigger.call();

        currentShader=oldShader;
    };

    var srcFrag=''+
        'precision highp float;\n'+
        '#ifdef HAS_TEXTURES\n'+
        '  varying vec2 texCoord;\n'+
        '  uniform sampler2D tex;\n'+
        '#endif\n'+
        'uniform float r;\n'+
        'uniform float g;\n'+
        'uniform float b;\n'+
        'uniform float a;\n'+
        '\n'+
        'void main()\n'+
        '{\n'+
        'vec4 col=vec4(r,g,b,a);\n'+
        '#ifdef HAS_TEXTURES\n'+
        '   col=texture2D(tex,texCoord);\n'+
        '#endif\n'+
        'gl_FragColor = col;\n'+
        
        '}\n';


    var shader=new CGL.Shader();
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);




    this.r=this.addInPort(new Port(this,"r"));
    this.r.onValueChanged=function()
    {
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'f','r',self.r.val);
        else self.r.uniform.setValue(self.r.val);
    };

    this.g=this.addInPort(new Port(this,"g"));
    this.g.onValueChanged=function()
    {
        if(!self.g.uniform) self.g.uniform=new CGL.Uniform(shader,'f','g',self.g.val);
        else self.g.uniform.setValue(self.g.val);
    };

    this.b=this.addInPort(new Port(this,"b"));
    this.b.onValueChanged=function()
    {
        if(!self.b.uniform) self.b.uniform=new CGL.Uniform(shader,'f','b',self.b.val);
        else self.b.uniform.setValue(self.b.val);
    };

    this.a=this.addInPort(new Port(this,"a"));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.val);
        else self.a.uniform.setValue(self.a.val);
    };

    this.r.val=Math.random();
    this.g.val=Math.random();
    this.b.val=Math.random();
    this.a.val=1.0;

    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.texture.onValueChanged=function()
    {
        if(self.texture.val)
        {
            console.log('TEXTURE ADDED');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            shader.removeUniform('tex');
        }
    };

    this.doRender();
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Shader.Schwurbel = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Schwurbel';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.timer=this.addInPort(new Port(this,"time"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        currentShader=shader;
        if(!self.timer.uniLoc)
        {
            shader.bind();
            self.timer.uniLoc=gl.getUniformLocation(shader.getProgram(), "time");
        }
        gl.uniform1f(self.timer.uniLoc, self.timer.val);

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float time;\n'+
        '\n'+
        'void main()\n'+
        '{\n'+
        'float c=sqrt(sin(time*0.02)*cos((time+gl_FragCoord.y)*0.02)+sin(time+gl_FragCoord.x*0.02)*sin(time+gl_FragCoord.y*0.02));\n'+
        'gl_FragColor = vec4( c,c,c,1.0);\n'+
        '}\n';

    var shader=new CGL.Shader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Schwurbel.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Shader.Noise = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Noise';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var timeUniform=-1;
    var timeStart=-1;

    this.doRender=function()
    {
        if(timeUniform==-1)
        {
            timeStart=Date.now();
            shader.bind();
            timeUniform=gl.getUniformLocation(shader.getProgram(), "time");
        }

        gl.uniform1f(timeUniform, (Date.now()-timeStart)/1000);
        currentShader=shader;

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float time;\n'+
        '\n'+
        'float random(vec2 co)\n'+
        '{\n'+
        '   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n'+
        '}\n'+
        'void main()\n'+
        '{\n'+
        '   float c=random(time*gl_FragCoord.xy);'+
        '   gl_FragColor = vec4( c,c,c,1.0);\n'+
        '}\n';


    var shader=new CGL.Shader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Noise.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Matrix={};


Ops.Gl.Matrix.Translate = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='translate';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.x=this.addInPort(new Port(this,"x"));
    this.y=this.addInPort(new Port(this,"y"));
    this.z=this.addInPort(new Port(this,"z"));
    this.x.val=0.0;
    this.y.val=0.0;
    this.z.val=0.0;
    
    var vec=vec3.create();

    this.render.onTriggered=function()
    {
        vec3.set(vec, self.x.val,self.y.val,self.z.val);

        mat4.translate(mvMatrix,mvMatrix, vec);
        self.trigger.call();
    };

};

Ops.Gl.Matrix.Translate.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Matrix.Scale = function()
{
    Op.apply(this, arguments);
    var self=this;
    var DEG2RAD = 3.14159/180.0;
    this.name='scale';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.scale=this.addInPort(new Port(this,"scale"));
    
    var vScale=vec3.create();
    var oldMatrix = mat4.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;

    this.render.onTriggered=function()
    {
        mat4.copy(oldMatrix, mvMatrix);

        mat4.multiply(mvMatrix,mvMatrix,transMatrix);

        self.trigger.call();

        mat4.copy(mvMatrix,oldMatrix);
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.scaleChanged=function()
    {
        doScale=false;
        //if(self.scaleX.val!==0.0 || self.scaleY.val!==0.0 || self.scaleZ.val!==0.0)doScale=true;
        vec3.set(vScale, self.scale.val,self.scale.val,self.scale.val);
        updateMatrix();
    };

    this.scale.onValueChanged=this.scaleChanged;

    this.scale.val=1.0;

    updateMatrix();
};

Ops.Gl.Matrix.Scale.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Matrix.Transform = function()
{
    Op.apply(this, arguments);
    var self=this;
    var DEG2RAD = 3.14159/180.0;
    this.name='transform';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.posX=this.addInPort(new Port(this,"posX"));
    this.posY=this.addInPort(new Port(this,"posY"));
    this.posZ=this.addInPort(new Port(this,"posZ"));

    this.scaleX=this.addInPort(new Port(this,"scaleX"));
    this.scaleY=this.addInPort(new Port(this,"scaleY"));
    this.scaleZ=this.addInPort(new Port(this,"scaleZ"));

    this.rotX=this.addInPort(new Port(this,"rotX"));
    this.rotY=this.addInPort(new Port(this,"rotY"));
    this.rotZ=this.addInPort(new Port(this,"rotZ"));
    
    var vPos=vec3.create();
    var vScale=vec3.create();
    var oldMatrix = mat4.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;
    var doTranslate=false;

    this.render.onTriggered=function()
    {
        mat4.copy(oldMatrix, mvMatrix);

        mat4.multiply(mvMatrix,mvMatrix,transMatrix);

        self.trigger.call();

        mat4.copy(mvMatrix,oldMatrix);
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

        if(self.rotX.val!==0)mat4.rotateX(transMatrix,transMatrix, self.rotX.val*DEG2RAD);
        if(self.rotY.val!==0)mat4.rotateY(transMatrix,transMatrix, self.rotY.val*DEG2RAD);
        if(self.rotZ.val!==0)mat4.rotateZ(transMatrix,transMatrix, self.rotZ.val*DEG2RAD);

        if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.translateChanged=function()
    {
        doTranslate=false;
        if(self.posX.val!==0.0 || self.posY.val!==0.0 || self.posZ.val!==0.0)doTranslate=true;
        vec3.set(vPos, self.posX.val,self.posY.val,self.posZ.val);
        updateMatrix();
    };

    this.scaleChanged=function()
    {
        doScale=false;
        if(self.scaleX.val!==0.0 || self.scaleY.val!==0.0 || self.scaleZ.val!==0.0)doScale=true;
        vec3.set(vScale, self.scaleX.val,self.scaleY.val,self.scaleZ.val);
        updateMatrix();
    };

    this.rotChanged=function()
    {
        updateMatrix();
    };

    this.rotX.onValueChanged=this.rotChanged;
    this.rotY.onValueChanged=this.rotChanged;
    this.rotZ.onValueChanged=this.rotChanged;

    this.scaleX.onValueChanged=this.scaleChanged;
    this.scaleY.onValueChanged=this.scaleChanged;
    this.scaleZ.onValueChanged=this.scaleChanged;

    this.posX.onValueChanged=this.translateChanged;
    this.posY.onValueChanged=this.translateChanged;
    this.posZ.onValueChanged=this.translateChanged;

    this.rotX.val=0.0;
    this.rotY.val=0.0;
    this.rotZ.val=0.0;

    this.scaleX.val=1.0;
    this.scaleY.val=1.0;
    this.scaleZ.val=1.0;

    this.posX.val=0.0;
    this.posY.val=0.0;
    this.posZ.val=0.0;

    updateMatrix();
};

Ops.Gl.Matrix.Transform.prototype = new Op();






// https://github.com/automat/foam-gl
// http://howlerjs.com/
//http://learningwebgl.com/lessons/lesson01/index.html


Ops.Log = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='logger';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.input=this.addInPort(new Port(this,"input"));
    this.input.val='';

    this.exec=function()
    {
        console.log("[log] " + self.input.val);
    };

    this.exe.onTriggered=this.exec;
    this.input.onValueChanged=this.exec;
};
Ops.Log.prototype = new Op();


// ---------------------------------------------------------------------------


Ops.CallsPerSecond = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='CallsPerSecond';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.timeStart=0;
    this.cps=0;

    this.exe.onTriggered=function()
    {
        if(self.timeStart===0)self.timeStart=Date.now();
        var now = Date.now();

        if(now-self.timeStart>1000)
        {
            self.timeStart=Date.now();
            console.log('cps: '+self.cps);
            self.cps=0;
        }

        self.cps++;
    };
};
Ops.CallsPerSecond.prototype = new Op();


// ---------------------------------------------------------------------------

Ops.Value = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Value';
    this.v=this.addInPort(new Port(this,"value"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.exec= function()
    {
        self.result.val=self.v.val;
    };

    this.v.onValueChanged=this.exec;
};

Ops.Value.prototype = new Op();

// ---------------------------------------------------------------------------



Ops.TimeLineTime = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimeLineTime';
    this.theTime=this.addOutPort(new Port(this,"time"));

    this.onAnimFrame=function(time)
    {
        this.theTime.val=time;
    };

};
Ops.TimeLineTime.prototype = new Op();


// ---------------------------------------------------------------------------




Ops.Repeat = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Repeat';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.num=this.addInPort(new Port(this,"num"));
    this.num.val=5;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.idx=this.addOutPort(new Port(this,"index"));

    this.exe.onTriggered=function()
    {

        for(var i=0;i<self.num.value;i++)
        {
            self.idx.val=i;
            self.trigger.call();
        }

    };
};
Ops.Repeat.prototype = new Op();




// ---------------------------------------------------------------------------


Ops.IfTrueThen = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='if true then';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.bool=this.addInPort(new Port(this,"boolean"));
    this.bool.val=false;

    this.triggerThen=this.addOutPort(new Port(this,"then",OP_PORT_TYPE_FUNCTION));
    this.triggerElse=this.addOutPort(new Port(this,"else",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        if(self.bool.val===true)
        {
            self.triggerThen.call();
        }
        else
        {
            self.triggerElse.call();
        }
    };

    this.bool.onValueChanged=function()
    {
        self.exe.onTriggered();
    };

};
Ops.IfTrueThen.prototype = new Op();



// ---------------------------------------------------------------------------


Ops.Group = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='group';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.triggers=[];

    for(var i=0;i<10;i++)
    {
        this.triggers.push( this.addOutPort(new Port(this,"trigger "+i,OP_PORT_TYPE_FUNCTION)) );
    }

    this.exe.onTriggered=function()
    {
        for(var i in self.triggers)
        {
            self.triggers[i].call();
        }

    };


};
Ops.Group.prototype = new Op();





// ---------------------------------------------------------------------------

Ops.Interval = function()
{
    Op.apply(this, arguments);

    this.name='Interval';
    this.timeOutId=-1;
    this.interval=this.addInPort(new Port(this,"interval"));
    this.interval.val=1000;
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exec=function()
    {
        if(this.timeOutId!=-1)return;
        var self=this;

        this.timeOutId=setTimeout(function()
        {
            self.timeOutId=-1;
            self.trigger.call();
            self.exec();
        },
        this.interval.val );
    };

    this.exec();

};

Ops.Interval.prototype = new Op();

// ---------------------------------------------------------------------------


// --------------------------------------------------------------------------

Ops.Anim={};

Ops.Anim.SinusAnim = function()
{
    Op.apply(this, arguments);

    this.name='SinusAnim';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    var self=this;

    this.exe.onTriggered=function()
    {
        self.result.val=Math.sin(Date.now()/1000.0);
    };

    this.exe.onTriggered();

};

Ops.Anim.SinusAnim.prototype = new Op();




// --------------------------------------------------------------------------


Ops.Anim.RelativeTime = function()
{
    Op.apply(this, arguments);

    this.name='RelativeTime';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    var self=this;
    var startTime=Date.now()/1000.0;

    this.exe.onTriggered=function()
    {
        self.result.val=Date.now()/1000.0-startTime;
    };

    this.exe.onTriggered();

};

Ops.Anim.RelativeTime.prototype = new Op();


// ---------------------------------------------------------------------------

Ops.Input={};

Ops.Input.GamePad = function()
{
    Op.apply(this, arguments);

    this.name='GamePad';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.numPads=this.addOutPort(new Port(this,"numPads"));
    this.axis1=this.addOutPort(new Port(this,"axis1"));
    this.axis2=this.addOutPort(new Port(this,"axis2"));
    this.axis3=this.addOutPort(new Port(this,"axis3"));
    this.axis4=this.addOutPort(new Port(this,"axis4"));
    this.button0=this.addOutPort(new Port(this,"button0"));
    this.button1=this.addOutPort(new Port(this,"button1"));
    this.button2=this.addOutPort(new Port(this,"button2"));
    this.button3=this.addOutPort(new Port(this,"button3"));
    this.button4=this.addOutPort(new Port(this,"button4"));

    var self=this;
    var startTime=Date.now()/1000.0;

    this.exe.onTriggered=function()
    {
        var gamePads=navigator.getGamepads();
        var count=0;

        for(var gp in gamePads)
        {
            if(gamePads[gp].axes)
            {
                self.axis1.val=gamePads[gp].axes[0];
                self.axis2.val=gamePads[gp].axes[1];
                self.axis3.val=gamePads[gp].axes[2];
                self.axis4.val=gamePads[gp].axes[3];

                self.button0.val=gamePads[gp].buttons[0].pressed;
                self.button0.val=gamePads[gp].buttons[1].pressed;
                self.button2.val=gamePads[gp].buttons[2].pressed;
                self.button3.val=gamePads[gp].buttons[3].pressed;
                self.button4.val=gamePads[gp].buttons[4].pressed;

                count++;
            }
        }

        self.numPads.val=count;
    };

    this.exe.onTriggered();

};

Ops.Input.GamePad.prototype = new Op();


Ops.Math={};


Ops.Math.Random = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='random';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    this.exe.onTriggered=function()
    {
        self.result.val=Math.random();
    };

    this.exe.onTriggered();
};

Ops.Math.Random.prototype = new Op();

// ---------------------------------------------------------------------------




Ops.Math.MapRange = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='map value range';
    this.result=this.addOutPort(new Port(this,"result"));
    this.v=this.addInPort(new Port(this,"value"));
    this.old_min=this.addInPort(new Port(this,"old min"));
    this.old_max=this.addInPort(new Port(this,"old max"));
    this.new_min=this.addInPort(new Port(this,"new min"));
    this.new_max=this.addInPort(new Port(this,"new max"));

    this.exec= function()
    {
        if(self.v.val>self.old_max.val)
        {
            self.result.val=self.new_max.val;
            return;
        }
        else
        if(self.v.val<self.old_min.val)
        {
            self.result.val=self.new_min.val;
            return;
        }

        var nMin=parseFloat(self.new_min.val);
        var nMax=parseFloat(self.new_max.val);
        var oMin=parseFloat(self.old_min.val);
        var oMax=parseFloat(self.old_max.val);
        var x=parseFloat(self.v.val);

        var reverseInput = false;
        var oldMin = Math.min( oMin, oMax );
        var oldMax = Math.max( oMin, oMax );
        if(oldMin!= oMin) reverseInput = true;

        var reverseOutput = false;
        var newMin = Math.min( nMin, nMax );
        var newMax = Math.max( nMin, nMax );
        if(newMin != nMin) reverseOutput = true;

        var portion=0;

        if(reverseInput) portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
            else portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);
        
        if(reverseOutput) self.result.val = newMax - portion;
            else self.result.val = portion + newMin;

    };

    this.v.val=0;
    this.old_min.val=-1;
    this.old_max.val=1;
    this.new_min.val=0;
    this.new_max.val=1;


    this.v.onValueChanged=this.exec;
    this.old_min.onValueChanged=this.exec;
    this.old_max.onValueChanged=this.exec;
    this.new_min.onValueChanged=this.exec;
    this.new_max.onValueChanged=this.exec;

    this.exec();

};

Ops.Math.MapRange.prototype = new Op();



// ---------------------------------------------------------------------------

Ops.Math.Abs = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='abs';
    this.number=this.addInPort(new Port(this,"number"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.number.onValueChanged=function()
    {
        self.result.val=Math.abs(self.number.val);
    };
};

Ops.Math.Abs.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Math.Sin = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='Sinus';
    this.number=this.addInPort(new Port(this,"number"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.number.onValueChanged=function()
    {
        self.result.val=Math.sin(self.number.val);
    };
};

Ops.Math.Sin.prototype = new Op();


// ---------------------------------------------------------------------------

Ops.Math.Sum = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='sum';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.result.val=parseFloat(self.number1.val)+parseFloat(self.number2.val);
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Sum.prototype = new Op();



// ---------------------------------------------------------------------------

Ops.Math.Multiply = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='multiply';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.result.val=self.number1.val*self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

};

Ops.Math.Multiply.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Math.Divide = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Divide';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.result.val=self.number1.val/self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Divide.prototype = new Op();

// ---------------------------------------------------------------------------


Ops.Math.Compare={};




Ops.Math.Compare.IsEven = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='isEven';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));

    this.exec= function()
    {
        self.result.val=!( self.number1.val & 1 );
    };

    this.number1.onValueChanged=this.exec;
};

Ops.Math.Compare.IsEven.prototype = new Op();



Ops.Math.Compare.Greater = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Greater';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.result.val=self.number1.val>self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Compare.Greater.prototype = new Op();






Ops.Math.Compare.Between = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Between';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number=this.addInPort(new Port(this,"value"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));
    this.number.val=2.0;
    this.number1.val=1.0;
    this.number2.val=3.0;

    this.exec= function()
    {
        self.result.val=
            (
                self.number.val>Math.min(self.number1.val,self.number2.val) &&
                self.number.val<Math.max(self.number1.val,self.number2.val)
            );
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
    this.number.onValueChanged=this.exec;
};
Ops.Math.Compare.Between.prototype = new Op();




Ops.Math.Compare.Lesser = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Lesser';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.result.val=self.number1.val<self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

};

Ops.Math.Compare.Lesser.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Math.Compare.Equals = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Equals';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.result.val=self.number1.val==self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Compare.Equals.prototype = new Op();

