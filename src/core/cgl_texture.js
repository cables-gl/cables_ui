var CGL=CGL || {};

CGL.Texture=function()
{
    var self=this;
    this.tex = gl.createTexture();
    this.loaded=false;

    this.initTexture=function(img)
    {
        gl.bindTexture(gl.TEXTURE_2D, self.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        self.loaded=true;
    };
};

CGL.Texture.load=function(url)
{
    var texture=new CGL.Texture();
    var image = new Image();
    image.onload = function ()
    {
        texture.initTexture(image);
    };
    image.src = url;
    return texture;
};

// ---------------------------------------------------------------------------
