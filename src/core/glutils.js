



var glShader=function()
{
    var program=-1;

    this.getDefaultVertexShader=function()
    {
        return ''+
        'attribute vec3 vPosition;\n'+
        'uniform mat4 projMatrix;\n'+
        'uniform mat4 mvMatrix;\n'+
        'void main()\n'+
        '{\n'+
        '   gl_PointSize=3.0;\n'+
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

    this.compile=function(srcVert,srcFrag)
    {
        program=glUtils.createProgram(srcVert,srcFrag);
        console.log('compiled!');
    };

    var projMatrixUniform=-1;
    var mvMatrixUniform=-1;
    var vertexAttributeSize=-1;

    this.setAttributeVertex=function(size)
    {
        vertexAttributeSize=size;
    };

    this.bind=function()
    {
        if(program==-1) this.compile(this.getDefaultVertexShader(),this.getDefaultFragmentShader());
        if(mvMatrixUniform==-1)
        {
            program.vertexPosAttrib = GL.getAttribLocation(program, 'vPosition');
            projMatrixUniform = gl.getUniformLocation(program, "projMatrix");
            mvMatrixUniform = gl.getUniformLocation(program, "mvMatrix");
        }

        GL.useProgram(program);
        GL.enableVertexAttribArray(program.vertexPosAttrib);

        gl.uniformMatrix4fv(projMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

        gl.vertexAttribPointer(program.vertexPosAttrib,vertexAttributeSize, gl.FLOAT, false, 0, 0);
    };

    this.getProgram=function()
    {
        return program;
    };

};



var glUtils={};





glUtils.createShader =function(str, type)
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

glUtils.createProgram=function(vstr, fstr)
{
    var program = gl.createProgram();
    var vshader = glUtils.createShader(vstr, gl.VERTEX_SHADER);
    var fshader = glUtils.createShader(fstr, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(program);
    }
    return program;
};








