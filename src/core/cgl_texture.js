var CGL=CGL || {};


CGL.Texture=function(options)
{
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
        {
            isDepthTexture=options.isDepthTexture;
        }
    }

    function isPowerOfTwo (x)
    {
        return ( x == 1 || x == 2 || x == 4 || x == 8 || x == 16 || x == 32 || x == 64 || x == 128 || x == 256 || x == 512 || x == 1024 || x == 2048 || x == 4096 || x == 8192 || x == 16384);
    }

    function setFilter()
    {
        if(!isPowerOfTwo(self.width) || !isPowerOfTwo(self.height) )
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

        if(isPowerOfTwo(self.width) && isPowerOfTwo(self.height) && self.filter==CGL.Texture.FILTER_MIPMAP)
        {
            cgl.gl.generateMipmap(cgl.gl.TEXTURE_2D);
        }
    
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);

    };

    this.setSize(8,8);
};

CGL.Texture.load=function(url,finishedCallback,settings)
{
    var texture=new CGL.Texture();
    texture.image = new Image();

    if(settings && settings.hasOwnProperty('filter')) texture.filter=settings.filter;

    texture.image.onload = function ()
    {
        texture.initTexture(texture.image,settings);
        if(finishedCallback)finishedCallback();
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

CGL.Texture.FILTER_NEAREST=0;
CGL.Texture.FILTER_LINEAR=1;
CGL.Texture.FILTER_MIPMAP=2;


// ---------------------------------------------------------------------------
