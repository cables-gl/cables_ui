
Ops.Gl=Ops.Gl || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.ImageCompose = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='image compose';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.useVPSize=this.addInPort(new Port(this,"use viewport size",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.texOut=this.addOutPort(new Port(this,"texture_out",OP_PORT_TYPE_TEXTURE,{preview:true}));

    var effect=new CGL.TextureEffect(cgl);

    cgl.currentTextureEffect=effect;
    this.tex=new CGL.Texture(cgl);

    var w=8,h=8;

    function updateResolution()
    {
        if(self.useVPSize.val)
        {
            w=cgl.getViewPort()[2];
            h=cgl.getViewPort()[3];
        }

        if((w!= self.tex.width || h!= self.tex.height) && (w!==0 && h!==0))
        {
            self.height.val=h;
            self.width.val=w;
            self.tex.setSize(w,h);
            effect.setSourceTexture(self.tex);
            self.texOut.val=effect.getCurrentSourceTexture();
        }
    }

    this.onResize=updateResolution;

    this.useVPSize.onValueChanged=function()
    {
        if(self.useVPSize.val)
        {
            self.width.onValueChanged=null;
            self.height.onValueChanged=null;
        }
        else
        {
            self.width.onValueChanged=resize;
            self.height.onValueChanged=resize;
        }
    };
    this.useVPSize.val=true;


    function resize()
    {
        h=parseInt(self.height.val,10);
        w=parseInt(self.width.val,10);
        updateResolution();
    }

    render=function()
    {
        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

        updateResolution();
        
        cgl.currentTextureEffect=effect;

        effect.startEffect();

            // cgl.currentTextureEffect.bind();

            // cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
            // cgl.gl.clearColor(0,0,0,0.0);

            // cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

            // cgl.currentTextureEffect.finish();

        self.trigger.trigger();
        self.texOut.val=effect.getCurrentSourceTexture();

        cgl.gl.enable(cgl.gl.SCISSOR_TEST);

    };


    this.texOut.onPreviewChanged=function()
    {
        if(self.texOut.showPreview) self.render.onTriggered=self.texOut.val.preview;
        else self.render.onTriggered=render;
                console.log('jaja changed');
    };
    

    this.width.val=1920;
    this.height.val=1080;
    this.render.onTriggered=render;
};

Ops.Gl.TextureEffects.ImageCompose.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Invert = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Invert';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Invert.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Scroll = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Scroll';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.amountX=this.addInPort(new Port(this,"amountX",OP_PORT_TYPE_VALUE));
    this.amountY=this.addInPort(new Port(this,"amountY",OP_PORT_TYPE_VALUE));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
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
    var cgl=this.patch.cgl;

    this.name='Desaturate';

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Desaturate.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.PixelDisplacement = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='PixelDisplacement';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.amount=this.addInPort(new Port(this,"amountX",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.amountY=this.addInPort(new Port(this,"amountY",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.displaceTex=this.addInPort(new Port(this,"displaceTex",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
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
    var cgl=this.patch.cgl;

    this.name='MixImage';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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
        // .endl()+'   col.a=1.0;'
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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.MixImage.prototype = new Op();



// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.DrawImage = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='DrawImage';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE,{preview:true }));
    this.blendMode=this.addInPort(new Port(this,"blendMode",OP_PORT_TYPE_VALUE,{ display:'dropdown',values:[
        'normal','lighten','darken','multiply','average','add','substract','difference','negation','exclusion','overlay','screen',
        'color dodge',
        'color burn',
        'softlight',
        'hardlight'
        ] }));
    self.blendMode.val='normal';
    this.imageAlpha=this.addInPort(new Port(this,"imageAlpha",OP_PORT_TYPE_TEXTURE,{preview:true }));
    this.alphaSrc=this.addInPort(new Port(this,"alphaSrc",OP_PORT_TYPE_VALUE,{ display:'dropdown',values:[
        'alpha channel','luminance'
        ] }));
    this.removeAlphaSrc=this.addInPort(new Port(this,"removeAlphaSrc",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.removeAlphaSrc.val=true;
    this.invAlphaChannel=this.addInPort(new Port(this,"invert alpha channel",OP_PORT_TYPE_VALUE,{ display:'bool' }));


    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'

        .endl()+'#ifdef HAS_TEXTUREALPHA'
        .endl()+'  uniform sampler2D imageAlpha;'
        .endl()+'#endif'

        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       blendRGBA=texture2D(image,texCoord);'


        .endl()+'vec3 blend=blendRGBA.rgb;'
        .endl()+'vec4 baseRGBA=texture2D(tex,texCoord);'
        .endl()+'vec3 base=baseRGBA.rgb;'

        .endl()+'vec3 colNew=blend;'
        .endl()+'#define Blend(base, blend, funcf)       vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))'


        .endl()+'#ifdef BM_NORMAL'
        .endl()+'colNew=blend;'
        .endl()+'#endif'

        .endl()+'#ifdef BM_MULTIPLY'
        .endl()+'colNew=base*blend;'
        .endl()+'#endif'


        .endl()+'#ifdef BM_AVERAGE'
        .endl()+'colNew=((base + blend) / 2.0);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_ADD'
        .endl()+'colNew=min(base + blend, vec3(1.0));'
        .endl()+'#endif'

        .endl()+'#ifdef BM_SUBSTRACT'
        .endl()+'colNew=max(base + blend - vec3(1.0), vec3(0.0));'
        .endl()+'#endif'

        .endl()+'#ifdef BM_DIFFERENCE'
        .endl()+'colNew=abs(base - blend);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_NEGATION'
        .endl()+'colNew=(vec3(1.0) - abs(vec3(1.0) - base - blend));'
        .endl()+'#endif'

        .endl()+'#ifdef BM_EXCLUSION'
        .endl()+'colNew=(base + blend - 2.0 * base * blend);'
        .endl()+'#endif'
  
        .endl()+'#ifdef BM_LIGHTEN'
        .endl()+'colNew=max(blend, base);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_DARKEN'
        .endl()+'colNew=min(blend, base);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_OVERLAY'
        .endl()+'   #define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))'
        // .endl()+'   #define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)'
        .endl()+'   colNew=Blend(base, blend, BlendOverlayf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_SCREEN'
        .endl()+'   #define BlendScreenf(base, blend)       (1.0 - ((1.0 - base) * (1.0 - blend)))'
        // .endl()+'   #define BlendScreen(base, blend)        Blend(base, blend, BlendScreenf)'
        .endl()+'   colNew=Blend(base, blend, BlendScreenf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_SOFTLIGHT'
        .endl()+'   #define BlendSoftLightf(base, blend)    ((blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend)))'
        // .endl()+'   #define BlendSoftLight(base, blend)     Blend(base, blend, BlendSoftLightf)'
        .endl()+'   colNew=Blend(base, blend, BlendSoftLightf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_HARDLIGHT'
        .endl()+'   #define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))'
        // .endl()+'   #define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)'
        .endl()+'   colNew=Blend(blend, base, BlendOverlayf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_COLORDODGE'
        .endl()+'   #define BlendColorDodgef(base, blend)   ((blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0))'
        .endl()+'   colNew=Blend(base, blend, BlendColorDodgef);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_COLORBURN'
        .endl()+'   #define BlendColorBurnf(base, blend)    ((blend == 0.0) ? blend : max((1.0 - ((1.0 - base) / blend)), 0.0))'
        .endl()+'   colNew=Blend(base, blend, BlendColorBurnf);'
        .endl()+'#endif'




        .endl()+'#ifdef REMOVE_ALPHA_SRC'
        .endl()+'   blendRGBA.a=1.0;'
        .endl()+'#endif'

        .endl()+'#ifdef HAS_TEXTUREALPHA'

        .endl()+'   vec4 colImgAlpha=texture2D(imageAlpha,texCoord);'
        .endl()+'   float colImgAlphaAlpha=colImgAlpha.a;'

        .endl()+'   #ifdef INVERT_ALPHA'
        .endl()+'       colImgAlphaAlpha=1.0-colImgAlphaAlpha;'
        .endl()+'   #endif'


        .endl()+'   #ifdef ALPHA_FROM_LUMINANCE'
        .endl()+'       vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));'
        .endl()+'       colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;'
        .endl()+'   #endif'

        .endl()+'   blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;'


        .endl()+'#endif'
        

        // .endl()+'vec4 finalColor=vec4(colNew*amount*blendRGBA.a,blendRGBA.a);'
        // .endl()+'finalColor+=vec4(base*(1.0-amount)*baseRGBA.a,baseRGBA.a);'//, base ,1.0-blendRGBA.a*amount);'
        .endl()+'blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);'
        .endl()+'blendRGBA.a=baseRGBA.a+blendRGBA.a;'


        // .endl()+'blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);'
        // .endl()+'blendRGBA.a=alpha;'

        .endl()+'#endif'
   

        .endl()+'   gl_FragColor = blendRGBA;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);
    var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

    this.invAlphaChannel.onValueChanged=function()
    {
        if(self.invAlphaChannel.val) shader.define('INVERT_ALPHA');
            else shader.removeDefine('INVERT_ALPHA');
        shader.compile();
    };

    this.removeAlphaSrc.onValueChanged=function()
    {
        if(self.removeAlphaSrc.val) shader.define('REMOVE_ALPHA_SRC');
            else shader.removeDefine('REMOVE_ALPHA_SRC');
        shader.compile();
    };

    this.alphaSrc.onValueChanged=function()
    {
        if(self.alphaSrc.val=='luminance') shader.define('ALPHA_FROM_LUMINANCE');
            else shader.removeDefine('ALPHA_FROM_LUMINANCE');
        shader.compile();
    };

    this.alphaSrc.val="alpha channel";

    this.blendMode.onValueChanged=function()
    {
        if(self.blendMode.val=='normal') shader.define('BM_NORMAL');
            else shader.removeDefine('BM_NORMAL');

        if(self.blendMode.val=='multiply') shader.define('BM_MULTIPLY');
            else shader.removeDefine('BM_MULTIPLY');

        if(self.blendMode.val=='average') shader.define('BM_AVERAGE');
            else shader.removeDefine('BM_AVERAGE');

        if(self.blendMode.val=='add') shader.define('BM_ADD');
            else shader.removeDefine('BM_ADD');

        if(self.blendMode.val=='substract') shader.define('BM_SUBSTRACT');
            else shader.removeDefine('BM_SUBSTRACT');

        if(self.blendMode.val=='difference') shader.define('BM_DIFFERENCE');
            else shader.removeDefine('BM_DIFFERENCE');

        if(self.blendMode.val=='negation') shader.define('BM_NEGATION');
            else shader.removeDefine('BM_NEGATION');

        if(self.blendMode.val=='exclusion') shader.define('BM_EXCLUSION');
            else shader.removeDefine('BM_EXCLUSION');

        if(self.blendMode.val=='lighten') shader.define('BM_LIGHTEN');
            else shader.removeDefine('BM_LIGHTEN');

        if(self.blendMode.val=='darken') shader.define('BM_DARKEN');
            else shader.removeDefine('BM_DARKEN');

        if(self.blendMode.val=='overlay') shader.define('BM_OVERLAY');
            else shader.removeDefine('BM_OVERLAY');

        if(self.blendMode.val=='screen') shader.define('BM_SCREEN');
            else shader.removeDefine('BM_SCREEN');
        
        if(self.blendMode.val=='softlight') shader.define('BM_SOFTLIGHT');
            else shader.removeDefine('BM_SOFTLIGHT');

        if(self.blendMode.val=='hardlight') shader.define('BM_HARDLIGHT');
            else shader.removeDefine('BM_HARDLIGHT');

        if(self.blendMode.val=='color dodge') shader.define('BM_COLORDODGE');
            else shader.removeDefine('BM_COLORDODGE');

        if(self.blendMode.val=='color burn') shader.define('BM_COLORBURN');
            else shader.removeDefine('BM_COLORBURN');

        shader.compile();
    };

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };
    self.amount.val=1.0;

    this.imageAlpha.onValueChanged=function()
    {
        if(self.imageAlpha.val && self.imageAlpha.val.tex) shader.define('HAS_TEXTUREALPHA');
            else shader.removeDefine('HAS_TEXTUREALPHA');
        shader.compile();
    };

    function render()
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

            if(self.imageAlpha.val && self.imageAlpha.val.tex)
            {
                cgl.gl.activeTexture(cgl.gl.TEXTURE2);
                cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.imageAlpha.val.tex );
            }

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    }

    function preview()
    {
        render();
        self.image.val.preview();
    }

    function previewAlpha()
    {
        render();
        self.imageAlpha.val.preview();
    }

    this.image.onPreviewChanged=function()
    {
        if(self.image.showPreview) self.render.onTriggered=preview;
        else self.render.onTriggered=render;
    };

    this.imageAlpha.onPreviewChanged=function()
    {
        if(self.imageAlpha.showPreview) self.render.onTriggered=previewAlpha;
        else self.render.onTriggered=render;
    };
    
    this.render.onTriggered=render;


};

Ops.Gl.TextureEffects.DrawImage.prototype = new Op();



// ---------------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.DepthTexture = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='DepthTexture';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.farPlane=this.addInPort(new Port(this,"farplane",OP_PORT_TYPE_VALUE));
    this.nearPlane=this.addInPort(new Port(this,"nearplane",OP_PORT_TYPE_VALUE));
    
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'
        .endl()+'uniform float n;'
        .endl()+'uniform float f;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(image,texCoord);'
        .endl()+'       float z=col.r;'
        .endl()+'       float c=(2.0*n)/(f+n-z*(f-n));'
        .endl()+'       col=vec4(c,c,c,1.0);'

        .endl()+'       if(c>=0.99)col.a=0.0;'
        .endl()+'           else col.a=1.0;'
        .endl()+'   #endif'
        
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','image',0);

    var uniFarplane=new CGL.Uniform(shader,'f','f',1.0);
    var uniNearplane=new CGL.Uniform(shader,'f','n',1.0);

    this.farPlane.onValueChanged=function()
    {
        uniFarplane.setValue(self.farPlane.get());
    };
    self.farPlane.val=5.0;

    this.nearPlane.onValueChanged=function()
    {
        uniNearplane.setValue(self.nearPlane.val);
    };
    self.nearPlane.val=0.01;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {
            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.DepthTexture.prototype = new Op();



// ---------------------------------------------------------------------------------------------



Ops.Gl.TextureEffects.SSAO = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='SSAO';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.farPlane=this.addInPort(new Port(this,"farplane",OP_PORT_TYPE_VALUE));
    this.nearPlane=this.addInPort(new Port(this,"nearplane",OP_PORT_TYPE_VALUE));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.dist=this.addInPort(new Port(this,"dist",OP_PORT_TYPE_VALUE,{display:'range'}));

    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'  uniform sampler2D colTex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+'uniform float dist;'
        
        .endl()+'uniform float near;'
        .endl()+'uniform float far;'
        .endl()+''

.endl()+'#define samples 8.0'
.endl()+'#define rings 4.0'
.endl()+'#define PI    3.14159265'
.endl()+''

.endl()+'float readDepth(vec2 coord)'
.endl()+'{'
.endl()+'    return (2.0 * near) / (far + near - texture2D(image, coord ).x * (far-near));'
.endl()+'}'

.endl()+'float compareDepths( in float depth1, in float depth2 )'
.endl()+'{'
.endl()+'    float aoCap = 1.9;'
.endl()+'    float aoMultiplier =40.0;'
.endl()+'    float depthTolerance = 0.001;'
.endl()+'    float aorange = 100.0;'// units in space the AO effect extends to (this gets divided by the camera far range
.endl()+'    float diff = sqrt(clamp(1.0-(depth1-depth2) / (aorange/(far-near)),0.0,1.0));'
.endl()+'    float ao = min(aoCap,max(0.0,depth1-depth2-depthTolerance) * aoMultiplier) * diff;'
.endl()+'    return ao;'
.endl()+'}'

        .endl()+'void main()'
        .endl()+'{'

        .endl()+'float d;float ao=1.0;    float depth = readDepth(texCoord);'

        .endl()+'float w=1.0/640.0;'
        .endl()+'float h=1.0/360.0;'

        .endl()+'float pw;'
        .endl()+'float ph;'

        .endl()+'float s=0.0;'
        .endl()+'float fade = 1.0;'

        .endl()+'for (float i = 0.0 ; i < rings; i += 1.0)'
        .endl()+'{'
        .endl()+'   fade *= 0.5;'
        .endl()+'   for (float j = 0.0 ; j < samples; j += 1.0)'
        .endl()+'   {'
        .endl()+'       float step = PI*2.0 / (samples*i);'
        .endl()+'       float jj=j*2.0*i*2.0;'

        .endl()+'       pw = (cos(jj*step)*i);'
        .endl()+'       ph = (sin(jj*step)*i)*2.0;'

        .endl()+'       pw*=dist;'
        .endl()+'       ph*=dist;'

        .endl()+'       d = readDepth( vec2(texCoord.s+pw*w,texCoord.t+ph*h));'

        .endl()+'       ao += compareDepths(depth,d)*fade;'
        .endl()+'       s += 1.0*fade*1.0;'
        .endl()+'   }'
        .endl()+'}'

        .endl()+'ao /= s;'
        .endl()+'ao = 1.0-ao;'
        // .endl()+'ao *= amount;'
        .endl()+'ao = 1.0-ao;'
        
        .endl()+'vec4 col=vec4(ao,ao,ao,1.0);'
        // .endl()+'col.r=0.0;'
        .endl()+'col=texture2D(colTex,texCoord)-col*amount;'
        .endl()+'       col.a=1.0;'


        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','image',0);
    var textureColorUniform=new CGL.Uniform(shader,'t','colTex',1);

    var uniFarplane=new CGL.Uniform(shader,'f','far',1.0);
    var uniNearplane=new CGL.Uniform(shader,'f','near',1.0);
    var uniAmount=new CGL.Uniform(shader,'f','amount',1.0);
    var uniDist=new CGL.Uniform(shader,'f','dist',1.0);
    


    this.dist.onValueChanged=function()
    {
        uniDist.setValue(self.dist.val*5);
    };
    self.dist.val=0.2;

    this.amount.onValueChanged=function()
    {
        uniAmount.setValue(self.amount.val);
    };
    self.amount.val=1.0;

    this.farPlane.onValueChanged=function()
    {
        uniFarplane.setValue(self.farPlane.val);
    };
    self.farPlane.val=5.0;

    this.nearPlane.onValueChanged=function()
    {
        uniNearplane.setValue(self.nearPlane.val);
    };
    self.nearPlane.val=0.01;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {
            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.SSAO.prototype = new Op();



// ---------------------------------------------------------------------------------------------






Ops.Gl.TextureEffects.AlphaMask = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='AlphaMask';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    // this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.AlphaMask.prototype = new Op();



// ---------------------------------------------------------------------------------------------




Ops.Gl.TextureEffects.WipeTransition = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='WipeTransition';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.fade=this.addInPort(new Port(this,"fade",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.fadeWidth=this.addInPort(new Port(this,"fadeWidth",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };

};

Ops.Gl.TextureEffects.WipeTransition.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.ColorLookup = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ColorLookup';

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.posy=this.addInPort(new Port(this,"posy",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.ColorLookup.prototype = new Op();



// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.BrightnessContrast = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='BrightnessContrast';

    this.amount=this.addInPort(new Port(this,"contrast",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.amountBright=this.addInPort(new Port(this,"brightness",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.BrightnessContrast.prototype = new Op();


// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.RemoveAlpha = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='RemoveAlpha';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.RemoveAlpha.prototype = new Op();

// ---------------------------------------------------------------------------------------------





Ops.Gl.TextureEffects.ColorOverlay = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ColorOverlay';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true'}));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform float r;'
        .endl()+'  uniform float g;'
        .endl()+'  uniform float b;'
        .endl()+'  uniform float a;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        // .endl()+'       col.a=1.0;'
        .endl()+'   #endif'


        .endl()+'   vec4 overCol=vec4(r,g,b,col.a);'
        .endl()+'   col=mix(col,overCol, a);'

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

        self.trigger.trigger();
    };



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
        uniformA.setValue(self.a.val);
    };

    this.a.val=1.0;
    this.r.val=1.0;
    this.g.val=0.0;
    this.b.val=0.0;

};

Ops.Gl.TextureEffects.ColorOverlay.prototype = new Op();

// ---------------------------------------------------------------------------------------------



Ops.Gl.TextureEffects.ColorChannel = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ColorChannel';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };

    this.channelR=this.addInPort(new Port(this,"channelR",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelR.onValueChanged=function()
    {
        if(self.channelR.val) shader.define('CHANNEL_R');
            else shader.removeDefine('CHANNEL_R');
    };
    this.channelR.val=true;

    this.channelG=this.addInPort(new Port(this,"channelG",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelG.val=false;
    this.channelG.onValueChanged=function()
    {
        if(self.channelG.val)shader.define('CHANNEL_G');
            else shader.removeDefine('CHANNEL_G');
    };


    this.channelB=this.addInPort(new Port(this,"channelB",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelB.val=false;
    this.channelB.onValueChanged=function()
    {
        if(self.channelB.val) shader.define('CHANNEL_B');
            else shader.removeDefine('CHANNEL_B');
    };

    this.mono=this.addInPort(new Port(this,"mono",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.mono.val=false;
    this.mono.onValueChanged=function()
    {
        if(self.mono.val) shader.define('MONO');
            else shader.removeDefine('MONO');
    };


};

Ops.Gl.TextureEffects.ColorChannel.prototype = new Op();

// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.RgbMultiply = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='RgbMultiply';

    this.r=this.addInPort(new Port(this,"r"));
    this.g=this.addInPort(new Port(this,"g"));
    this.b=this.addInPort(new Port(this,"b"));
    this.r.val=1.0;
    this.g.val=1.0;
    this.b.val=1.0;

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.RgbMultiply.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Hue = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Hue';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.hue=this.addInPort(new Port(this,"hue",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.hue.val=1.0;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float hue;'
        .endl()+''

        .endl()+'vec3 rgb2hsv(vec3 c)'
        .endl()+'{'
        .endl()+'    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);'
        .endl()+'    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));'
        .endl()+'    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));'
        .endl()+''
        .endl()+'    float d = q.x - min(q.w, q.y);'
        .endl()+'    float e = 1.0e-10;'
        .endl()+'    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);'
        .endl()+'}'

        .endl()+'vec3 hsv2rgb(vec3 c)'
        .endl()+'{'
        .endl()+'    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);'
        .endl()+'    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);'
        .endl()+'    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);'
        .endl()+'}'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        
        .endl()+'       vec3 hsv = rgb2hsv(col.rgb);'
        .endl()+'       hsv.x=hsv.x+hue;'
        .endl()+'       col.rgb = hsv2rgb(hsv);'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniformHue=new CGL.Uniform(shader,'f','hue',1.0);

    this.hue.onValueChanged=function()
    {
        uniformHue.setValue(self.hue.val);
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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Hue.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Color = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Color';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true'}));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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
        uniformA.setValue(self.a.val);
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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Color.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Vignette = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Vignette';

    this.lensRadius1=this.addInPort(new Port(this,"lensRadius1"));
    this.lensRadius2=this.addInPort(new Port(this,"lensRadius2"));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

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
        .endl()+'       vec2 tcPos=vec2(texCoord.x,texCoord.y/1.777+0.25);'

        .endl()+'       float dist = distance(tcPos, vec2(0.5,0.5));'
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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Vignette.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Blur = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Blur';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.iterations=this.addInPort(new Port(this,"iterations",OP_PORT_TYPE_VALUE));
    this.iterations.val=10;

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform float dirX;'
        .endl()+'  uniform float dirY;'
        .endl()+'  uniform float width;'
        .endl()+'  uniform float height;'
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
        .endl()+'       col=blur9(tex,texCoord,vec2(width,height),vec2(dirX,dirY));'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniDirX=new CGL.Uniform(shader,'f','dirX',0);
    var uniDirY=new CGL.Uniform(shader,'f','dirY',0);

    var uniWidth=new CGL.Uniform(shader,'f','width',0);
    var uniHeight=new CGL.Uniform(shader,'f','height',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        cgl.setShader(shader);

        uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
        uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

        for(var i =0;i<self.iterations.val;i++)
        {
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
        }

        cgl.setPreviousShader();
        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Blur.prototype = new Op();




// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.DepthOfField = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='DepthOfField';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.depthTex=this.addInPort(new Port(this,"depth map",OP_PORT_TYPE_TEXTURE));

    this.farPlane=this.addInPort(new Port(this,"farplane",OP_PORT_TYPE_VALUE));
    this.nearPlane=this.addInPort(new Port(this,"nearplane",OP_PORT_TYPE_VALUE));

    this.showIntensity=this.addInPort(new Port(this,"showIntensity",OP_PORT_TYPE_VALUE,{display:'bool'}));





    this.iterations=this.addInPort(new Port(this,"iterations",OP_PORT_TYPE_VALUE));
    this.iterations.val=10;

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D depthTex;'
        .endl()+'  uniform float dirX;'
        .endl()+'  uniform float dirY;'
        .endl()+'  uniform float width;'
        .endl()+'  uniform float height;'

        .endl()+'  uniform float f;'
        .endl()+'  uniform float n;'

        .endl()+'#endif'
        .endl()+''
        .endl()+'vec4 blur9(sampler2D texture, vec2 uv, vec2 red, vec2 dir)'
        .endl()+'{'
        .endl()+'   vec4 color = vec4(0.0);'
        .endl()+'   vec2 offset1 = vec2(1.3846153846) * dir*1.5;'
        .endl()+'   vec2 offset2 = vec2(3.2307692308) * dir*1.5;'
        .endl()+'   color += texture2D(texture, uv) * 0.2270270270;'
        .endl()+'   color += texture2D(texture, uv + (offset1 / red)) * 0.3162162162;'
        .endl()+'   color += texture2D(texture, uv - (offset1 / red)) * 0.3162162162;'
        .endl()+'   color += texture2D(texture, uv + (offset2 / red)) * 0.0702702703;'
        .endl()+'   color += texture2D(texture, uv - (offset2 / red)) * 0.0702702703;'
        .endl()+'   return color;'
        .endl()+'}'
        .endl()+''

        .endl()+'float getDepth(vec2 tc)'
        .endl()+'{'
        .endl()+'       float z=texture2D(depthTex,tc).r;'
        .endl()+'       float c=(2.0*n)/(f+n-z*(f-n));'
        .endl()+'       if(c>=0.99)c=0.0;'

        .endl()+'       return c;'
        .endl()+'}'


        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        
        .endl()+'   vec4 baseCol=texture2D(tex, texCoord);'


        .endl()+'   float d=getDepth(texCoord);'
        .endl()+'   float ds=d+getDepth(texCoord*1.1)+getDepth(texCoord*0.9);'

        // .endl()+'           else d.a=1.0;'


        .endl()+'       if(ds>0.0)col=blur9(tex,texCoord,vec2(width,height),vec2(dirX,dirY));'

        .endl()+'       col=mix(baseCol,col,d );'


        

        .endl()+'       #ifdef SHOW_INTENSITY'
        .endl()+'       col=vec4(d,d,d,1.0);'
        .endl()+'       #endif'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var depthTexUniform=new CGL.Uniform(shader,'t','depthTex',1);

    var uniDirX=new CGL.Uniform(shader,'f','dirX',0);
    var uniDirY=new CGL.Uniform(shader,'f','dirY',0);

    var uniWidth=new CGL.Uniform(shader,'f','width',0);
    var uniHeight=new CGL.Uniform(shader,'f','height',0);

    var uniFarplane=new CGL.Uniform(shader,'f','f',self.farPlane.get());
    var uniNearplane=new CGL.Uniform(shader,'f','n',self.nearPlane.get());

    this.showIntensity.onValueChanged=function()
    {
        if(self.showIntensity.get()) shader.define('SHOW_INTENSITY');
        else shader.removeDefine('SHOW_INTENSITY');
    };

    this.farPlane.onValueChanged=function()
    {
        uniFarplane.setValue(self.farPlane.val);
    };
    self.farPlane.val=5.0;

    this.nearPlane.onValueChanged=function()
    {
        uniNearplane.setValue(self.nearPlane.val);
    };
    self.nearPlane.val=0.01;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        cgl.setShader(shader);

        uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
        uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

        for(var i =0;i<self.iterations.val;i++)
        {
            // first pass

            cgl.currentTextureEffect.bind();
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.depthTex.get().tex );


            uniDirX.setValue(0.0);
            uniDirY.setValue(1.0);

            cgl.currentTextureEffect.finish();

            // second pass

            cgl.currentTextureEffect.bind();
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.depthTex.get().tex );

            uniDirX.setValue(1.0);
            uniDirY.setValue(0.0);

            cgl.currentTextureEffect.finish();
        }

        cgl.setPreviousShader();
        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.DepthOfField.prototype = new Op();






// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.FXAA = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    // shader from: https://github.com/mattdesl/glsl-fxaa

    this.name='FXAA';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    
    this.fxaa_span=this.addInPort(new Port(this,"span",OP_PORT_TYPE_VALUE,{display:'dropdown',values:[0,2,4,8,16,32,64]}));
    this.fxaa_reduceMin=this.addInPort(new Port(this,"reduceMin",OP_PORT_TYPE_VALUE));
    this.fxaa_reduceMul=this.addInPort(new Port(this,"reduceMul",OP_PORT_TYPE_VALUE));

    this.texWidth=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.texHeight=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    var srcFrag=''
               
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'    uniform float FXAA_SPAN_MAX;'

        .endl()+'    uniform float FXAA_REDUCE_MUL;'
        .endl()+'    uniform float FXAA_REDUCE_MIN;'
        .endl()+'    uniform float width;'
        .endl()+'    uniform float height;'

        .endl()+'vec4 getColorFXAA(vec2 coord)'
        .endl()+'{'
        .endl()+'    vec2 invtexsize=vec2(1.0/width,1.0/height);'
        .endl()+''
        .endl()+'    float step=1.0;'
        .endl()+''
        .endl()+'    vec3 rgbNW = texture2D(tex, coord.xy + (vec2(-step, -step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbNE = texture2D(tex, coord.xy + (vec2(+step, -step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbSW = texture2D(tex, coord.xy + (vec2(-step, +step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbSE = texture2D(tex, coord.xy + (vec2(+step, +step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbM  = texture2D(tex, coord.xy).xyz;'
        .endl()+''
        .endl()+'    vec3 luma = vec3(0.299, 0.587, 0.114);'
        .endl()+'    float lumaNW = dot(rgbNW, luma);'
        .endl()+'    float lumaNE = dot(rgbNE, luma);'
        .endl()+'    float lumaSW = dot(rgbSW, luma);'
        .endl()+'    float lumaSE = dot(rgbSE, luma);'
        .endl()+'    float lumaM  = dot( rgbM, luma);'
        .endl()+''
        .endl()+'    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));'
        .endl()+'    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));'
        .endl()+''
        .endl()+'    vec2 dir;'
        .endl()+'    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));'
        .endl()+'    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));'
        .endl()+''
        .endl()+'    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);'
        .endl()+''
        .endl()+'    float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);'
        .endl()+''
        .endl()+'    dir = min(vec2(FXAA_SPAN_MAX,  FXAA_SPAN_MAX),'
        .endl()+'          max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin))*invtexsize ;'
        .endl()+''
        .endl()+'    vec3 rgbA = (1.0/2.0) * ('
        .endl()+'                texture2D(tex, coord.xy + dir * (1.0/3.0 - 0.5)).xyz +'
        .endl()+'                texture2D(tex, coord.xy + dir * (2.0/3.0 - 0.5)).xyz);'
        .endl()+'    vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * ('
        .endl()+'                texture2D(tex, coord.xy + dir * (0.0/3.0 - 0.5)).xyz +'
        .endl()+'                texture2D(tex, coord.xy + dir * (3.0/3.0 - 0.5)).xyz);'
        .endl()+'    float lumaB = dot(rgbB, luma);'
        .endl()+''
        .endl()+'    vec4 color=texture2D(tex,coord).rgba;'
        .endl()+''
        .endl()+'    if((lumaB < lumaMin) || (lumaB > lumaMax)){'
        .endl()+'      color.xyz=rgbA;'
        .endl()+'    } else {'
        .endl()+'      color.xyz=rgbB;'
        .endl()+'    }'
        .endl()+'    return color;'
        .endl()+'}'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   gl_FragColor = getColorFXAA(texCoord);'
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

        self.trigger.trigger();
    };


    var uniformSpan=new CGL.Uniform(shader,'f','FXAA_SPAN_MAX',0);

    var uniformMul=new CGL.Uniform(shader,'f','FXAA_REDUCE_MUL',0);
    var uniformMin=new CGL.Uniform(shader,'f','FXAA_REDUCE_MIN',0);

    this.fxaa_span.onValueChanged=function()
    {
        uniformSpan.setValue(parseInt(self.fxaa_span.val,10));
    };

    var uWidth=new CGL.Uniform(shader,'f','width',0);
    var uHeight=new CGL.Uniform(shader,'f','height',0);

    function changeRes()
    {
        uWidth.setValue(self.texWidth.val);
        uHeight.setValue(self.texHeight.val);
    }

    this.texWidth.onValueChanged=changeRes;
    this.texHeight.onValueChanged=changeRes;
    
    this.fxaa_span.val=8;
    this.texWidth.val=1920;
    this.texHeight.val=1080;

    this.fxaa_reduceMul.onValueChanged=function()
    {
        uniformMul.setValue(1.0/self.fxaa_reduceMul.val);
    };

    this.fxaa_reduceMin.onValueChanged=function()
    {
        uniformMin.setValue(1.0/self.fxaa_reduceMin.val);
    };

    this.fxaa_reduceMul.val=8;
    this.fxaa_reduceMin.val=128;


};

Ops.Gl.TextureEffects.FXAA.prototype = new Op();


// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Noise = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Noise';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{display:'range'}));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'

        .endl()+'uniform float amount;'
        .endl()+'uniform float time;'

        .endl()+'float random(vec2 co)'
        .endl()+'{'
        .endl()+'   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);'
        .endl()+'}'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   float c=random(time*texCoord.xy);'
        .endl()+'   vec4 col=texture2D(tex,texCoord);'
        .endl()+'   col.rgb=mix(col.rgb,vec3(c),amount);'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        timeUniform.setValue(self.patch.timer.getTime());

        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);
    var timeUniform=new CGL.Uniform(shader,'f','time',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };

    this.amount.val=0.3;

};

Ops.Gl.TextureEffects.Noise.prototype = new Op();



// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.ChromaticAberration = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ChromaticAberration';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       vec2 tcPos=vec2(texCoord.x,texCoord.y/1.777+0.25);'
        .endl()+'       float dist = distance(tcPos, vec2(0.5,0.5));'
        .endl()+'       col.r=texture2D(tex,texCoord+(dist)*-amount).r;'
        .endl()+'       col.b=texture2D(tex,texCoord+(dist)*amount).b;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniAmount=new CGL.Uniform(shader,'f','amount',0);

    this.amount.onValueChanged=function()
    {
        uniAmount.setValue(self.amount.val*0.1);
    };
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

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.ChromaticAberration.prototype = new Op();
