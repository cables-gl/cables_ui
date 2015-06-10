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

        // console.log('value.tex',value.tex);
        

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
    var program=-1;
    var uniforms=[];

    this.addUniform=function(uni)
    {
        uniforms.push(uni);
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
        // console.log('compiled!');
    };

    var projMatrixUniform=-1;
    var mvMatrixUniform=-1;

    var attrTexCoords = -1;
    var attrVertexPos = -1;

    this.getAttrTexCoords=function(){return attrTexCoords;};
    this.getAttrVertexPos=function(){return attrVertexPos;};


    this.bind=function()
    {
        if(program==-1) program=createProgram(self.srcVert,self.srcFrag);

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


    createShader =function(str, type)
    {
        var shader = gl.createShader(type);
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

    createProgram=function(vstr, fstr)
    {
        var program = gl.createProgram();
        var vshader = createShader(vstr, gl.VERTEX_SHADER);
        var fshader = createShader(fstr, gl.FRAGMENT_SHADER);
        gl.attachShader(program, vshader);
        gl.attachShader(program, fshader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            throw gl.getProgramInfoLog(program);
        }
        return program;
    };



};

