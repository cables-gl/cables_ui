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

        gl.uniform1i(loc, value);
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
    var defines=[];
    var needsRecompile=true;



    this.define=function(name,value)
    {
        if(!value)value='';
        for(var i in defines)
        {
            if(defines[i][0]==name)
            {
                defines[i][1]=value;
                return;
            }
        }
        defines.push([name,value]);
    };

    this.removeDefine=function(name,value)
    {
        for(var i in defines)
        {
            if(defines[i][0]==name)
            {
                defines.splice(i,1);
                return;
            }
        }
    };


    this.removeUniform=function(name)
    {
        for(var i in uniforms)
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
        return ''+
        'attribute vec3 vPosition;\n'+
        'attribute vec2 attrTexCoord;\n'+
        'attribute vec3 attrVertNormal;\n'+
        'varying vec2 texCoord;\n'+
        'varying vec3 norm;\n'+
        'uniform mat4 projMatrix;\n'+
        'uniform mat4 mvMatrix;\n'+
        'void main()\n'+
        '{\n'+
        '   texCoord=attrTexCoord;\n'+
        '   norm=attrVertNormal;\n'+
        // '   gl_PointSize=3.0;\n'+
        '   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n'+
        '}\n';
    };

    this.getDefaultFragmentShader=function()
    {
        return ''+
        'precision mediump float;\n'+
        'varying vec3 norm;'+
        'void main()\n'+
        '{\n'+

        '   gl_FragColor = vec4(0.5,0.5,0.5,1.0);\n'+
        // '   gl_FragColor = vec4(norm.x,norm.y,1.0,1.0);\n'+
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
    var attrVertexNormals = -1;
    var attrVertexPos = -1;

    this.getAttrVertexNormals=function(){return attrVertexNormals;};
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
        var definesStr='';

        for(var i in defines)
        {
            definesStr+='#define '+defines[i][0]+' '+defines[i][1]+''.endl();
        }

        if(self.hasTextureUniforms()) definesStr+='#define HAS_TEXTURES'.endl();

        console.log('shader compile...');
        console.log('has textures: '+self.hasTextureUniforms() );

        var vs=definesStr+self.srcVert;
        var fs=definesStr+self.srcFrag;

        if(!program)
        {
            console.log('create shaderprogram');
                    
            program=createProgram(vs,fs, program);
        }
        else
        {
            console.log('recompile shaders...');

            // self.vshader=createShader(vs, gl.VERTEX_SHADER, self.vshader );
            // self.fshader=createShader(fs, gl.FRAGMENT_SHADER, self.fshader );
            // linkProgram(program);
            program=createProgram(vs,fs, program);
            
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
            attrVertexNormals = gl.getAttribLocation(program, 'attrVertNormal');
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

        gl.uniformMatrix4fv(projMatrixUniform, false, cgl.pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniform, false, cgl.mvMatrix);
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
            
            console.warn( gl.getShaderInfoLog(shader) );

            var lines = str.match(/^.*((\r\n|\n|\r)|$)/gm);
            for(var i in lines)
            {
                var j=parseInt(i,10)+1;
                console.log(j+': ',lines[i]);
            }

            console.warn( gl.getShaderInfoLog(shader) );
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

