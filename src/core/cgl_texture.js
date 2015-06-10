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
