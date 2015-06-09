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
        console.log('found texcoords!'+geom.texCoords.length);
        console.log('geom.texCoords',geom.texCoords);

        bufTexCoords = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTexCoords);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geom.texCoords), gl.STATIC_DRAW);
        bufTexCoords.itemSize = 2;
        bufTexCoords.numItems = geom.texCoords.length/bufTexCoords.itemSize;

        // bufTexCoordsIndizes = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufTexCoordsIndizes);

        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bufTexCoordsIndizes), gl.STATIC_DRAW);
        // bufTexCoordsIndizes.itemSize = 1;
        // bufTexCoordsIndizes.numItems = geom.texCoordsIndices.length;
    }

    console.log('geom.vertices.length '+geom.vertices.length);
    // console.log('bufTexCoordsIndizes.numItems '+bufTexCoordsIndizes.numItems);
    // console.log('bufTexCoords.numItems '+bufTexCoords.numItems);

    console.log('bufVertices.numItems '+bufVertices.numItems);
    console.log('bufVerticesIndizes.numItems '+bufVerticesIndizes.numItems);



    this.render=function(shader)
    {

        // shader.setAttributeVertex( bufVertices.itemSize);
        // shader.setAttributeTexCoord( bufTexCoordsIndizes.itemSize);
        shader.bind();


        GL.enableVertexAttribArray(shader.getAttrVertexPos());
        GL.enableVertexAttribArray(shader.getAttrTexCoords());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
        gl.vertexAttribPointer(shader.getAttrVertexPos(),bufVertices.itemSize, gl.FLOAT, false, 0, 0);


        // gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        if(bufTexCoords!=-1)
        {
            // console.log('texcoords'+shader.getAttrTexCoords());
            // console.log('texcoords'+shader.getAttrVertexPos());
                    
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTexCoords);
            gl.vertexAttribPointer(shader.getAttrTexCoords(),bufTexCoords.itemSize, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufVerticesIndizes);
        gl.drawElements(gl.TRIANGLES, bufVerticesIndizes.numItems, gl.UNSIGNED_SHORT, 0);

        // gl.drawArrays(gl.POINTS, 0, bufVertices.numItems);

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


