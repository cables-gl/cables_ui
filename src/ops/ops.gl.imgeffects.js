
Ops.Gl=Ops.Gl || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.TextureEffect = function()
{
    // DEPRECATED
    Op.apply(this, arguments);
    var self=this;

    this.name='texture effect';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.texOut=this.addOutPort(new Port(this,"texture_out",OP_PORT_TYPE_TEXTURE));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.tex=this.addInPort(new Port(this,"texture_in",OP_PORT_TYPE_TEXTURE));

    var ready=false;
    var effect=new CGL.TextureEffect();

    cgl.currentTextureEffect=effect;

    this.tex.onValueChanged=function()
    {
        effect.setSourceTexture(self.tex.val);
        self.texOut.val=cgl.currentTextureEffect.getCurrentSourceTexture();
        ready=true;
    };

    this.render.onTriggered=function()
    {
        if(!ready)return;
        if(!self.tex.val) return;
        
        if(!self.texOut.val || self.tex.val.width!=self.texOut.val.width || self.tex.val.height!=self.texOut.val.height)
        {
            console.log("tex size changed!?!?!?!?");
            effect.setSourceTexture(self.tex.val);
            self.texOut.val=cgl.currentTextureEffect.getCurrentSourceTexture();
        }
        cgl.currentTextureEffect=effect;

        effect.startEffect();
        self.trigger.call();
        self.texOut.val=cgl.currentTextureEffect.getCurrentSourceTexture();
    };
};

Ops.Gl.TextureEffects.TextureEffect.prototype = new Op();






// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.ImageCompose = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='image compose';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.clear=this.addInPort(new Port(this,"clear",OP_PORT_TYPE_VALUE,{ display:'bool' }));


    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.texOut=this.addOutPort(new Port(this,"texture_out",OP_PORT_TYPE_TEXTURE));

    var effect=new CGL.TextureEffect();

    cgl.currentTextureEffect=effect;
    this.tex=new CGL.Texture();


    this.updateResolution=function()
    {
        // if(!self.texOut.val || self.tex.width!=self.texOut.val.width || self.tex.height!=self.texOut.val.height)
        if(self.width.val!= self.tex.width || self.height.val!= self.tex.height)
        {
            self.tex.setSize(self.width.val, self.height.val);
            effect.setSourceTexture(self.tex);
            self.texOut.val=effect.getCurrentSourceTexture();
        }
    };

    this.width.onValueChanged=function()
    {
        self.width.val=parseInt(self.width.val,10);
        self.updateResolution();
    };

    this.height.onValueChanged=function()
    {
        self.height.val=parseInt(self.height.val,10);
        self.updateResolution();
    };


    this.render.onTriggered=function()
    {
        self.updateResolution();
        
        cgl.currentTextureEffect=effect;

        effect.startEffect();

        if(self.clear.val)
        {
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
            cgl.gl.clearColor(0,0,0,1.0);

            cgl.currentTextureEffect.finish();
        }

        self.trigger.call();
        self.texOut.val=effect.getCurrentSourceTexture();

    };

    this.width.val=1024;
    this.height.val=1024;
    self.clear.val=true;

};

Ops.Gl.TextureEffects.ImageCompose.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Invert = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Invert';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.rgb=1.0-col.rgb;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}\n';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);


    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.Invert.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Scroll = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Scroll';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.amountX=this.addInPort(new Port(this,"amountX",OP_PORT_TYPE_VALUE));
    this.amountY=this.addInPort(new Port(this,"amountY",OP_PORT_TYPE_VALUE));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+'  uniform float amountX;'
        .endl()+'  uniform float amountY;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,vec2(mod(texCoord.x+amountX*0.1,1.0),mod(texCoord.y+amountY*0.1,1.0) ));'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}\n';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);


    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };

    var amountXUniform=new CGL.Uniform(shader,'f','amountX',1.0);

    this.amountX.onValueChanged=function()
    {
        amountXUniform.setValue(self.amountX.val);
    };

    var amountYUniform=new CGL.Uniform(shader,'f','amountY',1.0);

    this.amountY.onValueChanged=function()
    {
        amountYUniform.setValue(self.amountY.val);
    };

    this.amountY.val=0.0;
    this.amountX.val=0.0;


};

Ops.Gl.TextureEffects.Scroll.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Desaturate = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Desaturate';

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'vec3 desaturate(vec3 color, float amount)'
        .endl()+'{'
        .endl()+'   vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));'
        .endl()+'   return vec3(mix(color, gray, amount));'
        .endl()+'}'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.rgb=desaturate(col.rgb,amount);'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.Desaturate.prototype = new Op();



// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.PixelDisplacement = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='PixelDisplacement';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.amount=this.addInPort(new Port(this,"amountX",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.amountY=this.addInPort(new Port(this,"amountY",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.displaceTex=this.addInPort(new Port(this,"displaceTex",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D displaceTex;'
        .endl()+'#endif'
        .endl()+'uniform float amountX;'
        .endl()+'uniform float amountY;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,vec2(mod(texCoord.x+texture2D(displaceTex,texCoord).g*1.0*amountX,1.0),mod(texCoord.y+texture2D(displaceTex,texCoord).g*1.0*amountY,1.0) ) );'
        // .endl()+'       col.rgb=desaturate(col.rgb,amount);'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','displaceTex',1);

    var amountXUniform=new CGL.Uniform(shader,'f','amountX',0.0);
    var amountYUniform=new CGL.Uniform(shader,'f','amountY',0.0);

    this.amount.onValueChanged=function()
    {
        amountXUniform.setValue(self.amount.val);
    };

    this.amountY.onValueChanged=function()
    {
        amountYUniform.setValue(self.amountY.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(self.displaceTex.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.displaceTex.val.tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };

    self.amount.val=0.0;
    self.amountY.val=0.0;
};

Ops.Gl.TextureEffects.PixelDisplacement.prototype = new Op();


// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.MixImage = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='MixImage';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord)*(1.0-amount);'
        .endl()+'       col+=texture2D(image,texCoord)*amount;'
        .endl()+'   #endif'
        .endl()+'   col.a=1.0;'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };
    self.amount.val=1.0;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {

            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.MixImage.prototype = new Op();



// ---------------------------------------------------------------------------------------------




Ops.Gl.TextureEffects.AlphaMask = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='AlphaMask';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    // this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'
        // .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        
        .endl()+'   #ifdef FROM_RED'
        .endl()+'       col.a=texture2D(image,texCoord).r;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_GREEN'
        .endl()+'       col.a=texture2D(image,texCoord).g;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_BLUE'
        .endl()+'       col.a=texture2D(image,texCoord).b;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_ALPHA'
        .endl()+'       col.a=texture2D(image,texCoord).a;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_LUMINANCE'
        .endl()+'       vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), texture2D(image,texCoord).rgb ));'
        .endl()+'       col.a=(gray.r+gray.g+gray.b)/3.0;'
        .endl()+'   #endif'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);

    this.method=this.addInPort(new Port(this,"method",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:["luminance","image alpha","red","green","blue"]} ));

    this.method.onValueChanged=function()
    {
        if(self.method.val=='luminance') shader.define('FROM_LUMINANCE');
            else shader.removeDefine('FROM_LUMINANCE');
        if(self.method.val=='image alpha') shader.define('FROM_ALPHA');
            else shader.removeDefine('FROM_ALPHA');
        if(self.method.val=='red') shader.define('FROM_RED');
            else shader.removeDefine('FROM_RED');
        if(self.method.val=='green') shader.define('FROM_GREEN');
            else shader.removeDefine('FROM_GREEN');
        if(self.method.val=='blue') shader.define('FROM_BLUE');
            else shader.removeDefine('FROM_BLUE');
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(self.image.val && self.image.val.tex)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.AlphaMask.prototype = new Op();



// ---------------------------------------------------------------------------------------------




Ops.Gl.TextureEffects.WipeTransition = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='WipeTransition';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.fade=this.addInPort(new Port(this,"fade",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.fadeWidth=this.addInPort(new Port(this,"fadeWidth",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'

        .endl()+'uniform float fade;'
        .endl()+'uniform float fadeWidth;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       vec4 colWipe=texture2D(image,texCoord);'
        
        .endl()+'       float w=fadeWidth;'
        .endl()+'       float v=colWipe.r;'
        .endl()+'       float f=fade+fade*w;'

        .endl()+'       if(f<v) col.a=1.0;'
        .endl()+'       else if(f>v+w) col.a=0.0;'
        .endl()+'       else if(f>v && f<=v+w) col.a = 1.0-(f-v)/w; ;'


        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);
    var fadeUniform=new CGL.Uniform(shader,'f','fade',0);
    var fadeWidthUniform=new CGL.Uniform(shader,'f','fadeWidth',0);


    this.fade.onValueChanged=function()
    {
        fadeUniform.setValue(self.fade.val);
    };

    this.fadeWidth.onValueChanged=function()
    {
        fadeWidthUniform.setValue(self.fadeWidth.val);
    };

    this.fade.val=0.5;
    this.fadeWidth.val=0.2;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {
            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.call();
    };

};

Ops.Gl.TextureEffects.WipeTransition.prototype = new Op();



// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.ColorLookup = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ColorLookup';

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.posy=this.addInPort(new Port(this,"posy",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));



    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'  uniform float posy;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.r=col.r*(1.0-amount)+texture2D(image,vec2(col.r,posy)).r*amount;'
        .endl()+'       col.g=col.g*(1.0-amount)+texture2D(image,vec2(col.g,posy)).g*amount;'
        .endl()+'       col.b=col.b*(1.0-amount)+texture2D(image,vec2(col.b,posy)).b*amount;'
        .endl()+'   #endif'
        .endl()+'   col.a=1.0;'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };

    var posyUniform=new CGL.Uniform(shader,'f','posy',0.0);

    this.posy.onValueChanged=function()
    {
        posyUniform.setValue(self.posy.val);
    };

    this.posy.val=0.0;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(self.image.val && self.image.val.tex)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.ColorLookup.prototype = new Op();



// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.BrightnessContrast = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='BrightnessContrast';

    this.amount=this.addInPort(new Port(this,"contrast",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.amountBright=this.addInPort(new Port(this,"brightness",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+'uniform float amountbright;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'

        .endl()+'       // apply contrast'
        .endl()+'       col.rgb = ((col.rgb - 0.5) * max(amount*2.0, 0.0))+0.5;'

        .endl()+'       // apply brightness'
        .endl()+'       col.rgb += amountbright;'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var amountUniform=new CGL.Uniform(shader,'f','amount',0.4);
    var amountBrightUniform=new CGL.Uniform(shader,'f','amountbright',0.0);

    this.amount.onValueChanged=function()
    {
        console.log('amount changed! '+self.amount.val);
        amountUniform.setValue(self.amount.val);
    };

    this.amountBright.onValueChanged=function()
    {
        amountBrightUniform.setValue(self.amountBright.val);
    };
    

    this.amountBright.val=0;
    this.amount.val=0.5;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.BrightnessContrast.prototype = new Op();


// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.RemoveAlpha = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='RemoveAlpha';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.a=1.0;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.RemoveAlpha.prototype = new Op();

// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.ColorChannel = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ColorChannel';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        
        .endl()+'   #ifdef CHANNEL_R'
        .endl()+'       col.r=texture2D(tex,texCoord).r;'
        .endl()+'       #ifdef MONO'
        .endl()+'           col.g=col.b=col.r;'
        .endl()+'       #endif'

        .endl()+'   #endif'

        .endl()+'   #ifdef CHANNEL_G'
        .endl()+'       col.g=texture2D(tex,texCoord).g;'
        .endl()+'       #ifdef MONO'
        .endl()+'           col.r=col.b=col.g;'
        .endl()+'       #endif'
        .endl()+'   #endif'

        .endl()+'   #ifdef CHANNEL_B'
        .endl()+'       col.b=texture2D(tex,texCoord).b;'
        .endl()+'       #ifdef MONO'
        .endl()+'           col.g=col.r=col.b;'
        .endl()+'       #endif'
        .endl()+'   #endif'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };

    this.channelR=this.addInPort(new Port(this,"channelR",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelR.onValueChanged=function()
    {
        console.log('change'+self.channelR.val);

        if(self.channelR.val=='true' || self.channelR.val==true) shader.define('CHANNEL_R');
            else shader.removeDefine('CHANNEL_R');
    };
    this.channelR.val=true;

    this.channelG=this.addInPort(new Port(this,"channelG",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelG.val=false;
    this.channelG.onValueChanged=function()
    {
        console.log('change'+self.channelG.val);

        if(self.channelG.val=='true')shader.define('CHANNEL_G');
            else shader.removeDefine('CHANNEL_G');
    };


    this.channelB=this.addInPort(new Port(this,"channelB",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelB.val=false;
    this.channelB.onValueChanged=function()
    {
        if(self.channelB.val=='true') shader.define('CHANNEL_B'); 
            else shader.removeDefine('CHANNEL_B');
    };

    this.mono=this.addInPort(new Port(this,"mono",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.mono.val=false;
    this.mono.onValueChanged=function()
    {
        if(self.mono.val=='true') shader.define('MONO');
            else shader.removeDefine('MONO');
    };


};

Ops.Gl.TextureEffects.ColorChannel.prototype = new Op();

// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.RgbMultiply = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='RgbMultiply';

    this.r=this.addInPort(new Port(this,"r"));
    this.g=this.addInPort(new Port(this,"g"));
    this.b=this.addInPort(new Port(this,"b"));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.r*=r;'
        .endl()+'       col.g*=g;'
        .endl()+'       col.b*=b;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniformR=new CGL.Uniform(shader,'f','r',1.0);
    var uniformG=new CGL.Uniform(shader,'f','g',1.0);
    var uniformB=new CGL.Uniform(shader,'f','b',1.0);


    this.r.onValueChanged=function()
    {
        uniformR.setValue(self.r.val);
    };

    this.g.onValueChanged=function()
    {
        uniformG.setValue(self.g.val);
    };

    this.b.onValueChanged=function()
    {
        uniformB.setValue(self.b.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.RgbMultiply.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Color = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Color';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+'uniform float a;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(r,g,b,a);'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniformR=new CGL.Uniform(shader,'f','r',1.0);
    var uniformG=new CGL.Uniform(shader,'f','g',1.0);
    var uniformB=new CGL.Uniform(shader,'f','b',1.0);
    var uniformA=new CGL.Uniform(shader,'f','a',1.0);


    this.r.onValueChanged=function()
    {
        uniformR.setValue(self.r.val);
    };

    this.g.onValueChanged=function()
    {
        uniformG.setValue(self.g.val);
    };

    this.b.onValueChanged=function()
    {
        uniformB.setValue(self.b.val);
    };

    this.a.onValueChanged=function()
    {
        uniformB.setValue(self.a.val);
    };

    this.r.val=1.0;
    this.g.val=1.0;
    this.b.val=1.0;
    this.a.val=1.0;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.Color.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Vignette = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Vignette';

    this.lensRadius1=this.addInPort(new Port(this,"lensRadius1"));
    this.lensRadius2=this.addInPort(new Port(this,"lensRadius2"));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float lensRadius1;'
        .endl()+'uniform float lensRadius2;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       float dist = distance(texCoord, vec2(0.5,0.5));'
        .endl()+'       col.rgb *= smoothstep(lensRadius1, lensRadius2, dist);'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniLensRadius1=new CGL.Uniform(shader,'f','lensRadius1',0.4);
    var uniLensRadius2=new CGL.Uniform(shader,'f','lensRadius2',0.3);

    this.lensRadius1.onValueChanged=function()
    {
        uniLensRadius1.setValue(self.lensRadius1.val);
    };

    this.lensRadius2.onValueChanged=function()
    {
        uniLensRadius2.setValue(self.lensRadius2.val);
    };

    this.lensRadius1.val=0.8;
    this.lensRadius2.val=0.4;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.Vignette.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Blur = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Blur';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader();

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform float dirX;'
        .endl()+'  uniform float dirY;'
        .endl()+'#endif'
        .endl()+''
        .endl()+'vec4 blur9(sampler2D texture, vec2 uv, vec2 red, vec2 dir)'
        .endl()+'{'
        .endl()+'   vec4 color = vec4(0.0);'
        .endl()+'   vec2 offset1 = vec2(1.3846153846) * dir;'
        .endl()+'   vec2 offset2 = vec2(3.2307692308) * dir;'
        .endl()+'   color += texture2D(texture, uv) * 0.2270270270;'
        .endl()+'   color += texture2D(texture, uv + (offset1 / red)) * 0.3162162162;'
        .endl()+'   color += texture2D(texture, uv - (offset1 / red)) * 0.3162162162;'
        .endl()+'   color += texture2D(texture, uv + (offset2 / red)) * 0.0702702703;'
        .endl()+'   color += texture2D(texture, uv - (offset2 / red)) * 0.0702702703;'
        .endl()+'   return color;'
        .endl()+'}'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=blur9(tex,texCoord,vec2(512.0,512.0),vec2(dirX,dirY));'
        // .endl()+ '       col=blur9(tex,texCoord,vec2(512.0,512.0),vec2(dirX*1.4,dirY*1.4));'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}\n';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniDirX=new CGL.Uniform(shader,'f','dirX',0);
    var uniDirY=new CGL.Uniform(shader,'f','dirY',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        cgl.setShader(shader);

        // first pass

        cgl.currentTextureEffect.bind();
        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        uniDirX.setValue(0.0);
        uniDirY.setValue(1.0);

        cgl.currentTextureEffect.finish();

        // second pass

        cgl.currentTextureEffect.bind();
        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        uniDirX.setValue(1.0);
        uniDirY.setValue(0.0);

        cgl.currentTextureEffect.finish();
        
        cgl.setPreviousShader();

        self.trigger.call();
    };
};

Ops.Gl.TextureEffects.Blur.prototype = new Op();


