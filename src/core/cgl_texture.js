var CGL=CGL || {};

CGL.Texture=function()
{
    var self=this;
    this.tex = cgl.gl.createTexture();
    this.width=0;
    this.height=0;
    this.flip=true;

    // gl.bindTexture(gl.TEXTURE_2D, this.tex);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([111, 111, 111, 255]));
    // gl.bindTexture(gl.TEXTURE_2D, null);

    // this.bind=function(slot)
    // {
    //     gl.activeTexture(gl.TEXTURE0+slot);
    //     gl.bindTexture(gl.TEXTURE_2D, self.tex);
    // };

    this.setSize=function(w,h)
    {
        self.width=w;
        self.height=h;

        // console.log('w h ',w,h);

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.tex);
        
        var arr=[];
        arr.length=w*h*4;
        // for(var x=0;x<w;x++)
        // {
        //     for(var y=0;y<h;y++)
        //     {
        //         // var index=x+y*w;
        //         arr.push( parseInt( (x/w)*255,10) );
        //         arr.push(0);
        //         arr.push( parseInt((y/w)*255,10));
        //         arr.push(255);
        //     }
        // }
        var uarr=new Uint8Array(arr);

        cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_WRAP_S, cgl.gl.CLAMP_TO_EDGE);
        cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_WRAP_T, cgl.gl.CLAMP_TO_EDGE);
        cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MIN_FILTER, cgl.gl.LINEAR);

        cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.RGBA, w, h, 0, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, uarr);

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
    };

    this.initTexture=function(img)
    {
        self.width=img.width;
        self.height=img.height;

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.tex);
        if(self.flip) cgl.gl.pixelStorei(cgl.gl.UNPACK_FLIP_Y_WEBGL, true);
        cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.RGBA, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, self.image);

        cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MAG_FILTER, cgl.gl.NEAREST);
        cgl.gl.texParameteri(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MIN_FILTER, cgl.gl.NEAREST);

        // non power of two:
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
    };

    this.setSize(8,8);
};

CGL.Texture.load=function(url,finishedCallback)
{
    var texture=new CGL.Texture();
    texture.image = new Image();
    texture.image.onload = function ()
    {
        // console.log(texture.image);
        texture.initTexture(texture.image);
        finishedCallback();
    };
    texture.image.src = url;
    return texture;
};


CGL.Texture.fromImage=function(img)
{
    var texture=new CGL.Texture();
    texture.flip=true;
    texture.image = img;
    texture.initTexture(img);
    return texture;
};


// ---------------------------------------------------------------------------
