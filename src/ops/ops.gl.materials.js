
Ops.Gl.Shader= Ops.Gl.Shader || {};



Ops.Gl.Shader.MatCapMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='MatCapMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.shaderOut=this.addOutPort(new Port(this,"shader",OP_PORT_TYPE_OBJECT));
    this.shaderOut.ignoreValueSerialize=true;

    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureUniform=null;

    this.textureDiffuse=this.addInPort(new Port(this,"diffuse",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureDiffuseUniform=null;

    this.textureNormal=this.addInPort(new Port(this,"normal",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureNormalUniform=null;

    this.normalScale=this.addInPort(new Port(this,"normalScale",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.normalScale.val=0.4;
    this.normalScaleUniform=null;

    this.textureSpec=this.addInPort(new Port(this,"specular",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureSpecUniform=null;

    this.textureSpecMatCap=this.addInPort(new Port(this,"specular matcap",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureSpecMatCapUniform=null;



    this.diffuseRepeatX=this.addInPort(new Port(this,"diffuseRepeatX",OP_PORT_TYPE_VALUE));
    this.diffuseRepeatY=this.addInPort(new Port(this,"diffuseRepeatY",OP_PORT_TYPE_VALUE));
    this.diffuseRepeatX.val=1.0;
    this.diffuseRepeatY.val=1.0;

    this.diffuseRepeatX.onValueChanged=function()
    {
        self.diffuseRepeatXUniform.setValue(self.diffuseRepeatX.val);
    };

    this.diffuseRepeatY.onValueChanged=function()
    {
        self.diffuseRepeatYUniform.setValue(self.diffuseRepeatY.val);
    };


    this.projectCoords=this.addInPort(new Port(this,"projectCoords",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['no','xy','yz']}));
    this.projectCoords.val='no';
    this.projectCoords.onValueChanged=function()
    {
        shader.removeDefine('DO_PROJECT_COORDS_XY');
        shader.removeDefine('DO_PROJECT_COORDS_YZ');

        if(self.projectCoords.val=='xy') shader.define('DO_PROJECT_COORDS_XY');
        if(self.projectCoords.val=='yz') shader.define('DO_PROJECT_COORDS_YZ');
    };

    this.normalRepeatX=this.addInPort(new Port(this,"normalRepeatX",OP_PORT_TYPE_VALUE));
    this.normalRepeatY=this.addInPort(new Port(this,"normalRepeatY",OP_PORT_TYPE_VALUE));
    this.normalRepeatX.val=1.0;
    this.normalRepeatY.val=1.0;

    this.normalRepeatX.onValueChanged=function()
    {
        self.normalRepeatXUniform.setValue(self.normalRepeatX.val);
    };

    this.normalRepeatY.onValueChanged=function()
    {
        self.normalRepeatYUniform.setValue(self.normalRepeatY.val);
    };

    this.normalScale.onValueChanged=function()
    {
        self.normalScaleUniform.setValue(self.normalScale.val*2.0);
    };

    this.texture.onPreviewChanged=function()
    {
        if(self.texture.showPreview) self.render.onTriggered=self.texture.val.preview;
            else self.render.onTriggered=self.doRender;
    };

    this.textureDiffuse.onPreviewChanged=function()
    {
        if(self.textureDiffuse.showPreview) self.render.onTriggered=self.textureDiffuse.val.preview;
            else self.render.onTriggered=self.doRender;
    };

    this.textureNormal.onPreviewChanged=function()
    {
        if(self.textureNormal.showPreview) self.render.onTriggered=self.textureNormal.val.preview;
            else self.render.onTriggered=self.doRender;
    };

    this.texture.onValueChanged=function()
    {
        if(self.texture.get())
        {
            if(self.textureUniform!==null)return;
            shader.removeUniform('tex');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            self.textureUniform=null;
        }
    };

    this.textureDiffuse.onValueChanged=function()
    {
        if(self.textureDiffuse.val)
        {
            if(self.textureDiffuseUniform!==null)return;
            shader.define('HAS_DIFFUSE_TEXTURE');
            shader.removeUniform('texDiffuse');
            self.textureDiffuseUniform=new CGL.Uniform(shader,'t','texDiffuse',1);
        }
        else
        {
            shader.removeDefine('HAS_DIFFUSE_TEXTURE');
            shader.removeUniform('texDiffuse');
            self.textureDiffuseUniform=null;
        }
    };



    this.textureNormal.onValueChanged=function()
    {
        if(self.textureNormal.val)
        {
            if(self.textureNormalUniform!==null)return;
            shader.define('HAS_NORMAL_TEXTURE');
            shader.removeUniform('texNormal');
            self.textureNormalUniform=new CGL.Uniform(shader,'t','texNormal',2);
        }
        else
        {
            shader.removeDefine('HAS_NORMAL_TEXTURE');
            shader.removeUniform('texNormal');
            self.textureNormalUniform=null;
        }
    };


    function changeSpec()
    {
        if(self.textureSpec.val && self.textureSpecMatCap.val)
        {
            if(self.textureSpecUniform!==null)return;
            shader.define('USE_SPECULAR_TEXTURE');
            shader.removeUniform('texSpec');
            shader.removeUniform('texSpecMatCap');
            self.textureSpecUniform=new CGL.Uniform(shader,'t','texSpec',3);
            self.textureSpecMatCapUniform=new CGL.Uniform(shader,'t','texSpecMatCap',4);
        }
        else
        {
            shader.removeDefine('USE_SPECULAR_TEXTURE');
            shader.removeUniform('texSpec');
            shader.removeUniform('texSpecMatCap');
            self.textureSpecUniform=null;
            self.textureSpecMatCapUniform=null;
        }

    }

    this.textureSpec.onValueChanged=changeSpec;
    this.textureSpecMatCap.onValueChanged=changeSpec;


    this.bindTextures=function()
    {
        if(self.texture.get())
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.texture.val.tex);
        }

        if(self.textureDiffuse.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureDiffuse.val.tex);
        }

        if(self.textureNormal.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE2);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureNormal.val.tex);
        }

        if(self.textureSpec.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE3);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureSpec.val.tex);
        }
        if(self.textureSpecMatCap.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE4);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureSpecMatCap.val.tex);
        }

    };


    this.doRender=function()
    {
        cgl.setShader(shader);
        self.bindTextures();

        self.trigger.trigger();
        cgl.setPreviousShader();
    };

    var srcVert=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'precision highp float;'
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'


        .endl()+'varying vec2 texCoord;'
        .endl()+'varying vec3 norm;'
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'
        .endl()+'uniform mat4 normalMatrix;'
        .endl()+'varying vec2 vNorm;'

        .endl()+'varying vec3 e;'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'    texCoord=attrTexCoord;'
        .endl()+'    norm=attrVertNormal;'

        .endl()+'   vec4 pos = vec4( vPosition, 1. );'

        .endl()+'    {{MODULE_VERTEX_POSITION}}'


        .endl()+'    e = normalize( vec3( mvMatrix * pos ) );'
        .endl()+'    vec3 n = normalize( mat3(normalMatrix) * norm );'

        .endl()+'    vec3 r = reflect( e, n );'
        .endl()+'    float m = 2. * sqrt( '
        .endl()+'        pow(r.x, 2.0)+'
        .endl()+'        pow(r.y, 2.0)+'
        .endl()+'        pow(r.z + 1.0, 2.0)'
        .endl()+'    );'
        .endl()+'    vNorm = r.xy / m + 0.5;'

        .endl()+'   #ifdef DO_PROJECT_COORDS_XY'
        .endl()+'       texCoord=(projMatrix * mvMatrix*pos).xy*0.1;'
        .endl()+'   #endif'
        .endl()+'   #ifdef DO_PROJECT_COORDS_YZ'
        .endl()+'       texCoord=(projMatrix * mvMatrix*pos).yz*0.1;'
        .endl()+'   #endif'

        .endl()+'    gl_Position = projMatrix * mvMatrix * pos;'

        .endl()+'}';


    var srcFrag=''
        .endl()+'precision highp float;'
        
        .endl()+'{{MODULES_HEAD}}'

        .endl()+'varying vec3 norm;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'uniform sampler2D tex;'
        .endl()+'varying vec2 vNorm;'

        .endl()+'uniform float diffuseRepeatX;'
        .endl()+'uniform float diffuseRepeatY;'


        .endl()+'#ifdef HAS_DIFFUSE_TEXTURE'
        .endl()+'   uniform sampler2D texDiffuse;'
        .endl()+'#endif'

        .endl()+'#ifdef USE_SPECULAR_TEXTURE'
        .endl()+'   uniform sampler2D texSpec;'
        .endl()+'   uniform sampler2D texSpecMatCap;'
        .endl()+'#endif'


        .endl()+'#ifdef HAS_NORMAL_TEXTURE'
        .endl()+'   uniform sampler2D texNormal;'
        .endl()+'   uniform mat4 normalMatrix;'
        .endl()+'   uniform float normalScale;'
        .endl()+'   uniform float normalRepeatX;'
        .endl()+'   uniform float normalRepeatY;'
        .endl()+'   varying vec3 e;'
        .endl()+'   vec2 vNormt;'
        .endl()+'#endif'
        
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        
        .endl()+'#ifdef HAS_DIFFUSE_TEXTURE'
        .endl()+'   vec2 texCoords=texCoord;'
        .endl()+'{{MODULE_BEGIN_FRAG}}'
        .endl()+'#endif'


        .endl()+'   vec2 vn=vNorm;'

        .endl()+'   #ifdef HAS_NORMAL_TEXTURE'
        .endl()+'       vec3 tnorm=texture2D( texNormal, vec2(texCoord.x*normalRepeatX,texCoord.y*normalRepeatY) ).xyz * 2.0 - 1.0;'

        .endl()+'       tnorm = normalize(tnorm*normalScale);'
        

        .endl()+'vec3 tangent;'
        .endl()+'vec3 binormal;'
        .endl()+'vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));'
        .endl()+'vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));'
        .endl()+'if(length(c1)>length(c2)) tangent = c1;'
        .endl()+'    else tangent = c2;'
        .endl()+'tangent = normalize(tangent);'
        .endl()+'binormal = cross(norm, tangent);'
        .endl()+'binormal = normalize(binormal);'
        .endl()+'tnorm=normalize(tangent*tnorm.x + binormal*tnorm.y + norm*tnorm.z);'
    
        .endl()+'       vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );'

        .endl()+'       vec3 r = reflect( e, n );'
        .endl()+'       float m = 2. * sqrt( '
        .endl()+'           pow(r.x, 2.0)+'
        .endl()+'           pow(r.y, 2.0)+'
        .endl()+'           pow(r.z + 1.0, 2.0)'
        .endl()+'       );'
        .endl()+'       vn = r.xy / m + 0.5;'


        .endl()+'       vn.t=clamp(vn.t, 0.0, 1.0);'
        .endl()+'       vn.s=clamp(vn.s, 0.0, 1.0);'
        .endl()+'    #endif'
        
        .endl()+'    vec4 col = texture2D( tex, vn );'

        .endl()+'    #ifdef HAS_DIFFUSE_TEXTURE'
        .endl()+'       col = col*texture2D( texDiffuse, vec2(texCoords.x*diffuseRepeatX,texCoords.y*diffuseRepeatY));'
        .endl()+'    #endif'

        .endl()+'    #ifdef USE_SPECULAR_TEXTURE'
        .endl()+'       vec4 spec = texture2D( texSpecMatCap, vn );'
        .endl()+'       spec*= texture2D( texSpec, vec2(texCoords.x*diffuseRepeatX,texCoords.y*diffuseRepeatY) );'
        .endl()+'       col+=spec*2.0;'

        .endl()+'    #endif'

        .endl()+'    {{MODULE_COLOR}}'

        .endl()+'    gl_FragColor = col;'
        .endl()+''
        .endl()+'}';

    var shader=new CGL.Shader(cgl);
    
    shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);

    shader.bindTextures=this.bindTextures;
    this.shaderOut.val=shader;
    this.onLoaded=shader.compile;
    shader.setSource(srcVert,srcFrag);
    this.normalScaleUniform=new CGL.Uniform(shader,'f','normalScale',self.normalScale.val);
    this.normalRepeatXUniform=new CGL.Uniform(shader,'f','normalRepeatX',self.normalRepeatX.val);
    this.normalRepeatYUniform=new CGL.Uniform(shader,'f','normalRepeatY',self.normalRepeatY.val);

    this.diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',self.diffuseRepeatX.val);
    this.diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',self.diffuseRepeatY.val);

    this.render.onTriggered=this.doRender;
    this.doRender();
};

Ops.Gl.Shader.MatCapMaterial.prototype = new Op();

// --------------------------------------------------------------------------



Ops.Gl.Shader.GradientMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='GradientMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.screenSpace=this.addInPort(new Port(this,"screen space",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.screenSpace.val=false;

    this.r=this.addInPort(new Port(this,"r1",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g=this.addInPort(new Port(this,"g1",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b1",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a1",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r2=this.addInPort(new Port(this,"r2",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g2=this.addInPort(new Port(this,"g2",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b2=this.addInPort(new Port(this,"b2",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a2=this.addInPort(new Port(this,"a2",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r3=this.addInPort(new Port(this,"r3",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g3=this.addInPort(new Port(this,"g3",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b3=this.addInPort(new Port(this,"b3",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a3=this.addInPort(new Port(this,"a3",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r.val=0.2;
    this.g.val=0.2;
    this.b.val=0.2;
    this.a.val=1.0;

    this.r2.val=0.73;
    this.g2.val=0.73;
    this.b2.val=0.73;
    this.a2.val=1.0;

    this.r3.val=1.0;
    this.g3.val=1.0;
    this.b3.val=1.0;
    this.a3.val=1.0;

    var colA=[];
    var colB=[];
    var colC=[];

    var w=0,h=0;

    this.doRender=function()
    {
        if(w!=cgl.getViewPort()[2] || h!=cgl.getViewPort()[3])
        {
            w=cgl.getViewPort()[2];
            h=cgl.getViewPort()[3];
        }

        uniformWidth.setValue(w);
        uniformHeight.setValue(h);
                    
        cgl.setShader(shader);
        self.trigger.trigger();
        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'varying vec3 norm;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'uniform vec4 colA;'
        .endl()+'uniform vec4 colB;'
        .endl()+'uniform vec4 colC;'
        .endl()+'uniform float width,height;'

        .endl()+''
        .endl()+'void main()'
        .endl()+'{'


        .endl()+'   #ifdef USE_TEXCOORDS'
        .endl()+'       vec2 coords=texCoord;'
        .endl()+'   #endif'

        .endl()+'   #ifdef USE_FRAGCOORDS'
        .endl()+'       vec2 coords=vec2(gl_FragCoord.x/width,gl_FragCoord.y/height);'
        .endl()+'   #endif'

        .endl()+'   if(coords.y<=0.5)'
        .endl()+'   {'
        .endl()+'       gl_FragColor = vec4(mix(colA, colB, coords.y*2.0));'
        .endl()+'   }'
        .endl()+'   if(coords.y>0.5)'
        .endl()+'   {'
        .endl()+'       gl_FragColor = vec4(mix(colB, colC, (coords.y-0.5)*2.0));'
        .endl()+'   }'
        .endl()+'}';

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    shader.define("USE_TEXCOORDS");
    var uniformWidth=new CGL.Uniform(shader,'f','width',w);
    var uniformHeight=new CGL.Uniform(shader,'f','height',h);

    this.doRender();


    this.r.onValueChanged=this.g.onValueChanged=this.b.onValueChanged=this.a.onValueChanged=function()
    {
        colA=[self.r.val,self.g.val,self.b.val,self.a.val];
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'4f','colA',colA);
        else self.r.uniform.setValue(colA);
    };

    this.r2.onValueChanged=this.g2.onValueChanged=this.b2.onValueChanged=this.a2.onValueChanged=function()
    {
        colB=[self.r2.val,self.g2.val,self.b2.val,self.a2.val];
        if(!self.r2.uniform) self.r2.uniform=new CGL.Uniform(shader,'4f','colB',colB);
        else self.r2.uniform.setValue(colB);
    };

    this.r3.onValueChanged=this.g3.onValueChanged=this.b3.onValueChanged=this.a3.onValueChanged=function()
    {
        colC=[self.r3.val,self.g3.val,self.b3.val,self.a3.val];
        if(!self.r3.uniform) self.r3.uniform=new CGL.Uniform(shader,'4f','colC',colC);
        else self.r3.uniform.setValue(colC);
    };

    this.screenSpace.onValueChanged=function()
    {
        if(self.screenSpace.val)
        {
            shader.define("USE_FRAGCOORDS");
            shader.removeDefine("USE_TEXCOORDS");
        }
        else
        {
            shader.define("USE_TEXCOORDS");
            shader.removeDefine("USE_FRAGCOORDS");
        }

    };

    this.r3.onValueChanged();
    this.r2.onValueChanged();
    this.r.onValueChanged();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.GradientMaterial.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Shader.BasicMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='BasicMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION) );
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.shaderOut=this.addOutPort(new Port(this,"shader",OP_PORT_TYPE_OBJECT));
    this.shaderOut.ignoreValueSerialize=true;

    this.bindTextures=function()
    {
        if(self.texture.get())
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.texture.val.tex);
        }

        if(self.textureOpacity.get())
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureOpacity.val.tex);
        }
    };

    this.doRender=function()
    {
        cgl.setShader(shader);
        shader.bindTextures();
        
        self.trigger.trigger();

        cgl.setPreviousShader();
    };

    var srcVert=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'varying vec3 norm;'
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'
        .endl()+'uniform mat4 normalMatrix;'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   texCoord=attrTexCoord;'
        .endl()+'   norm=attrVertNormal;'

        .endl()+'{{MODULE_VERTEX_POSITION}}'

        .endl()+'#ifdef BILLBOARD'
        .endl()+'   vec3 position=vPosition;'

        .endl()+"   gl_Position = projMatrix * mvMatrix * vec4(( "
        .endl()+"       position.x * vec3("
        .endl()+"           mvMatrix[0][0],"
        .endl()+"           mvMatrix[1][0], "
        .endl()+"           mvMatrix[2][0] ) +"
        .endl()+"       position.y * vec3("
        .endl()+"           mvMatrix[0][1],"
        .endl()+"           mvMatrix[1][1], "
        .endl()+"           mvMatrix[2][1]) ), 1.0);"
        .endl()+'#endif '

        .endl()+"gl_PointSize=12.0;"

        .endl()+"#ifndef BILLBOARD"
        .endl()+'   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);'
        .endl()+'#endif '
        .endl()+'}';

    var srcFrag=''

        .endl()+'precision highp float;'

        .endl()+'{{MODULES_HEAD}}'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   varying vec2 texCoord;'
        .endl()+'   #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'       uniform sampler2D tex;'
        .endl()+'   #endif'
        .endl()+'   #ifdef HAS_TEXTURE_OPACITY'
        .endl()+'       uniform sampler2D texOpacity;'
        .endl()+'   #endif'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+'uniform float a;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'

        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   vec2 texCoords=texCoord;'
        .endl()+'#endif'

        .endl()+'{{MODULE_BEGIN_FRAG}}'


        .endl()+'   vec4 col=vec4(r,g,b,a);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'      #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'          col=texture2D(tex,vec2(texCoords.x,1.0-texCoords.y));'
        .endl()+'           #ifdef COLORIZE_TEXTURE'
        .endl()+'               col.r*=r;'
        .endl()+'               col.g*=g;'
        .endl()+'               col.b*=b;'
        .endl()+'           #endif'
        .endl()+'      #endif'
        .endl()+'      #ifdef HAS_TEXTURE_OPACITY'
        .endl()+'          col.a*=texture2D(texOpacity,texCoords).g;'
        .endl()+'       #endif'
        .endl()+'       col.a*=a;'
        .endl()+'   #endif'
        .endl()+'{{MODULE_COLOR}}'
        
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader(cgl);
    shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
    shader.bindTextures=this.bindTextures;
    this.shaderOut.val=shader;
    this.onLoaded=shader.compile;
    shader.setSource(srcVert,srcFrag);

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.r.onValueChanged=function()
    {
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'f','r',self.r.get());
        else self.r.uniform.setValue(self.r.get());
    };

    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.g.onValueChanged=function()
    {
        if(!self.g.uniform) self.g.uniform=new CGL.Uniform(shader,'f','g',self.g.get());
        else self.g.uniform.setValue(self.g.get());
    };

    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b.onValueChanged=function()
    {
        if(!self.b.uniform) self.b.uniform=new CGL.Uniform(shader,'f','b',self.b.get());
        else self.b.uniform.setValue(self.b.get());
    };

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.get());
        else self.a.uniform.setValue(self.a.get());
    };

    this.r.val=Math.random();
    this.g.val=Math.random();
    this.b.val=Math.random();
    this.a.val=1.0;

    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureUniform=null;

    this.texture.onPreviewChanged=function()
    {
        if(self.texture.showPreview) self.render.onTriggered=self.texture.val.preview;
        else self.render.onTriggered=self.doRender;

        console.log('show preview!');
    };


    this.texture.onValueChanged=function()
    {

        if(self.texture.get())
        {
            if(self.textureUniform!==null)return;
            // console.log('TEXTURE ADDED');
            shader.removeUniform('tex');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            // console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=null;
        }
    };

    this.textureOpacity=this.addInPort(new Port(this,"textureOpacity",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureOpacityUniform=null;

    this.textureOpacity.onPreviewChanged=function()
    {
        if(self.textureOpacity.showPreview) self.render.onTriggered=self.textureOpacity.val.preview;
        else self.render.onTriggered=self.doRender;

        console.log('show preview!');
    };

    this.textureOpacity.onValueChanged=function()
    {
        if(self.textureOpacity.get())
        {
            if(self.textureOpacityUniform!==null)return;
            console.log('TEXTURE OPACITY ADDED');
            shader.removeUniform('texOpacity');
            shader.define('HAS_TEXTURE_OPACITY');
            self.textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);
        }
        else
        {
            console.log('TEXTURE OPACITY REMOVED');
            shader.removeUniform('texOpacity');
            shader.removeDefine('HAS_TEXTURE_OPACITY');
            self.textureOpacityUniform=null;
        }
    };

    this.colorizeTexture=this.addInPort(new Port(this,"colorizeTexture",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.colorizeTexture.val=false;
    this.colorizeTexture.onValueChanged=function()
    {
        if(self.colorizeTexture.val) shader.define('COLORIZE_TEXTURE');
            else shader.removeDefine('COLORIZE_TEXTURE');
    };


    this.doBillboard=this.addInPort(new Port(this,"billboard",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.doBillboard.val=false;
    this.doBillboard.onValueChanged=function()
    {
        if(self.doBillboard.val)
            shader.define('BILLBOARD');
        else
            shader.removeDefine('BILLBOARD');
    };



    this.doRender();
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Gl.Shader.TextureSinusWobble = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='texture sinus wobble';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION) );
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);

        if(self.texture.get())
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, self.texture.val.tex);
        }

        self.trigger.trigger();


        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   varying vec2 texCoord;'
        .endl()+'   #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'       uniform sampler2D tex;'
        .endl()+'   #endif'
        .endl()+'#endif'
        .endl()+'uniform float a;'
        .endl()+'uniform float time;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1,1,1,a);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'      #ifdef HAS_TEXTURE_DIFFUSE'

        // float smoothstep(float edge0, float edge1, float x)  

        // .endl()+'          col=texture2D(tex,texCoord);'
        // .endl()+'           float x=smoothstep(-1.0,1.0,texCoord.x*sin(time+texCoord.y*(col.r-0.5)) );'
        .endl()+'           float x=texCoord.x+sin(time+texCoord.y*(3.0))*0.15 ;'
        .endl()+'           float y=texCoord.y+sin(time+texCoord.x*(3.0))*0.15 ;'
        // .endl()+'           float y=smoothstep(-1.0,1.0,texCoord.x*sin(time+texCoord.x*3.0)*cos(texCoord.x) );'
        // .endl()+'           float y=texCoord.y;'

        .endl()+'           vec2 tc=vec2(x,y );'
        .endl()+'          col=texture2D(tex,tc);'
        
        .endl()+'      #endif'
        .endl()+'       col.a*=a;'
        .endl()+'   #endif'
        .endl()+'gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.val);
        else self.a.uniform.setValue(self.a.val);
    };

    this.a.val=1.0;

    this.time=this.addInPort(new Port(this,"time",OP_PORT_TYPE_VALUE,{  }));
    this.time.onValueChanged=function()
    {
        if(!self.time.uniform) self.time.uniform=new CGL.Uniform(shader,'f','time',self.a.val);
        else self.time.uniform.setValue(self.time.val);
    };

    this.time.val=1.0;


    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.textureUniform=null;

    this.texture.onValueChanged=function()
    {

        if(self.texture.get())
        {
            if(self.textureUniform!==null)return;
            // console.log('TEXTURE ADDED');
            shader.removeUniform('tex');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            // console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=null;
        }
    };

    this.doRender();
};

Ops.Gl.Shader.TextureSinusWobble.prototype = new Op();


// --------------------------------------------------------------------------

