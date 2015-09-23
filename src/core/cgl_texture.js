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
    // var isDataTexture=true;

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

        if(isPowerOfTwo(self.width) && isPowerOfTwo(self.height) && self.filter==CGL.Texture.FILTER_MIPMAP)
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

CGL.Texture.load=function(url,finishedCallback,settings)
{
    CGL.incrementLoadingAssets();
    var texture=new CGL.Texture();
    texture.image = new Image();

    if(settings && settings.hasOwnProperty('filter')) texture.filter=settings.filter;

    texture.image.onload=function()
    {
        texture.initTexture(texture.image,settings);
        if(finishedCallback)finishedCallback();
        CGL.decrementLoadingAssets();
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

CGL.Texture.previewTexture=null;
CGL.Texture.texturePreviewer=null;
CGL.Texture.texturePreview=function()
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
    var mesh=new CGL.Mesh(geom);



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


    var shader=new CGL.Shader();
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

