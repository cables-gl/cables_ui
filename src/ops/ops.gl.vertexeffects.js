// --------------------------------------------------------------------------

Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};

Ops.Gl.ShaderEffects.VertexSinusWobble = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    var shader=null;
    var uniTime;

    this.name='VertexSinusWobble';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.frequency=this.addInPort(new Port(this,"frequency",OP_PORT_TYPE_VALUE));
    var uniFrequency=null;
    this.frequency.val=1.0;
    this.frequency.onValueChanged=function(){ if(uniFrequency)uniFrequency.setValue(self.frequency.val); };

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE));
    var uniAmount=null;
    this.amount.val=1.0;
    this.amount.onValueChanged=function(){ if(uniAmount)uniAmount.setValue(self.amount.val); };


    this.phase=this.addInPort(new Port(this,"phase",OP_PORT_TYPE_VALUE));
    var uniPhase=null;
    this.phase.val=1.0;
    this.phase.onValueChanged=function(){ if(uniAmount)uniAmount.setValue(self.phase.val); };


    this.toAxisX=this.addInPort(new Port(this,"axisX",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.toAxisX.val=true;
    this.toAxisX.onValueChanged=setDefines;

    this.toAxisY=this.addInPort(new Port(this,"axisY",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.toAxisY.val=true;
    this.toAxisY.onValueChanged=setDefines;

    this.toAxisZ=this.addInPort(new Port(this,"axisZ",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.toAxisZ.val=true;
    this.toAxisZ.onValueChanged=setDefines;


    function setDefines()
    {
        if(!shader)return;

        if(self.toAxisX.val)shader.define(module.prefix+'_TO_AXIS_X');
            else shader.removeDefine(module.prefix+'_TO_AXIS_X');

        if(self.toAxisY.val)shader.define(module.prefix+'_TO_AXIS_Y');
            else shader.removeDefine(module.prefix+'_TO_AXIS_Y');

        if(self.toAxisZ.val)shader.define(module.prefix+'_TO_AXIS_Z');
            else shader.removeDefine(module.prefix+'_TO_AXIS_Z');
    }
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_time;'
        .endl()+'uniform float {{mod}}_frequency;'
        .endl()+'uniform float {{mod}}_amount;'
        .endl()+'uniform float {{mod}}_phase;'
        .endl();

    var srcBodyVert=''
        .endl()+'float {{mod}}_v=sin( (pos.x)*0.1 + {{mod}}_time * {{mod}}_frequency + {{mod}}_phase ) * {{mod}}_amount;'

        .endl()+'#ifdef {{mod}}_TO_AXIS_X'
        .endl()+'   pos.x+={{mod}}_v;'
        .endl()+'#endif'

        .endl()+'#ifdef {{mod}}_TO_AXIS_Y'
        .endl()+'   pos.y+={{mod}}_v;'
        .endl()+'#endif'

        .endl()+'#ifdef {{mod}}_TO_AXIS_Z'
        .endl()+'   pos.z+={{mod}}_v;'
        .endl()+'#endif'

        // .endl()+'norm=normalize(norm);'
        .endl();




    var startTime=Date.now()/1000.0;

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;
    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();
            shader=cgl.getShader();
            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            uniTime=new CGL.Uniform(shader,'f',module.prefix+'_time',0);
            uniFrequency=new CGL.Uniform(shader,'f',module.prefix+'_frequency',self.frequency.val);
            uniAmount=new CGL.Uniform(shader,'f',module.prefix+'_amount',self.amount.val);
            uniPhase=new CGL.Uniform(shader,'f',module.prefix+'_phase',self.phase.val);
            setDefines();
        }

        uniTime.setValue(Date.now()/1000.0-startTime);
        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.VertexSinusWobble.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.ShaderEffects.VertexExtrudeGlitch = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='VertexExtrudeGlitch';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.min=this.addInPort(new Port(this,"min",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.max=this.addInPort(new Port(this,"max",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.extrude=this.addInPort(new Port(this,"extrude",OP_PORT_TYPE_VALUE));

    this.min.onValueChanged=function(){ if(uniMin)uniMin.setValue(self.min.val); };
    this.max.onValueChanged=function(){ if(uniMax)uniMax.setValue(self.max.val); };
    this.width.onValueChanged=function(){ if(uniWidth)uniWidth.setValue(self.width.val); };
    this.extrude.onValueChanged=function(){ if(uniExtrude)uniExtrude.setValue(self.extrude.val); };

    var shader=null;
    var uniMin;
    var uniMax;
    var uniWidth;
    var uniExtrude;
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_x;'
        .endl()+'uniform float {{mod}}_y;'
        .endl()+'uniform float {{mod}}_width;'
        .endl()+'uniform float {{mod}}_extrude;'
        .endl();

    var srcBodyVert=''
        .endl()+'   if(texCoord.x>{{mod}}_x && texCoord.x<{{mod}}_x+{{mod}}_width && texCoord.y>{{mod}}_y && texCoord.y<{{mod}}_y+{{mod}}_width)pos.xyz*={{mod}}_extrude;'
        .endl();

    var module=null;

    function removeModule()
    {
        console.log('remove module?',shader,module);

        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
            console.log('remove module!');
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();
            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            uniMin=new CGL.Uniform(shader,'f',module.prefix+'_x',self.min.val);
            uniMax=new CGL.Uniform(shader,'f',module.prefix+'_y',self.max.val);
            uniWidth=new CGL.Uniform(shader,'f',module.prefix+'_width',self.width.val);
            uniExtrude=new CGL.Uniform(shader,'f',module.prefix+'_extrude',self.extrude.val);

        }

        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.VertexExtrudeGlitch.prototype = new Op();
Ops.Gl.ShaderEffects.VertexGlitch=Ops.Gl.ShaderEffects.VertexExtrudeGlitch;

// --------------------------------------------------------------------------

Ops.Gl.ShaderEffects.VertexDisplacementMap = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='VertexDisplacementMap';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.extrude=this.addInPort(new Port(this,"extrude",OP_PORT_TYPE_VALUE));

    this.extrude.onValueChanged=function(){ if(uniExtrude)uniExtrude.setValue(self.extrude.val); };

    var shader=null;
    var uniExtrude,uniTexture;
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_extrude;'
        .endl()+'uniform sampler2D {{mod}}_texture;'
        .endl();

    var srcBodyVert=''
        .endl()+'float {{mod}}_texVal=texture2D( {{mod}}_texture, texCoord ).b+1.0;'
        // .endl()+'pos.y+={{mod}}_texVal * {{mod}}_extrude;'
        .endl()+'pos.xyz*={{mod}}_texVal * {{mod}}_extrude;'

        // .endl()+'norm=normalize(norm+normalize(pos.xyz));'


        // .endl()+'vec3 tangent;'
        // .endl()+'vec3 binormal;'
        // .endl()+'vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));'
        // .endl()+'vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));'
        // .endl()+'if(length(c1)>length(c2)) tangent = c1;'
        // .endl()+'    else tangent = c2;'
        // .endl()+'tangent = normalize(tangent);'
        // .endl()+'binormal = cross(norm, tangent);'
        // .endl()+'binormal = normalize(binormal);'
        // .endl()+'vec3 normpos = normalize(pos.xyz);'

        // .endl()+'norm=normalize(tangent*normpos.x + binormal*normpos.y + norm*normpos.z);'


        // .endl()+'norm.y+={{mod}}_texVal * {{mod}}_extrude;'
        .endl();


    var srcHeadFrag=''
        .endl()+'uniform sampler2D {{mod}}_texture;'
        .endl();

    var srcBodyFrag=''
        .endl()+'col=texture2D( {{mod}}_texture, texCoord );'
        .endl();

    var module=null;

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();



            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            uniTexture=new CGL.Uniform(shader,'t',module.prefix+'_texture',4);
            uniExtrude=new CGL.Uniform(shader,'f',module.prefix+'_extrude',self.extrude.val);

            // module=shader.addModule(
            //     {
            //         name:'MODULE_COLOR',
            //         srcHeadFrag:srcHeadFrag,
            //         srcBodyFrag:srcBodyFrag
            //     });

            // uniTexture=new CGL.Uniform(shader,'t',module.prefix+'_texture',4);

        }

        if(self.texture.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE4);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.texture.val.tex);
        }

        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.VertexDisplacementMap.prototype = new Op();

// --------------------------------------------------------------------------


// --------------------------------------------------------------------------

Ops.Gl.ShaderEffects.MorphMesh = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='MorphMesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.geometry0=this.addInPort(new Port(this,"geometry 0",OP_PORT_TYPE_OBJECT));
    this.geometry1=this.addInPort(new Port(this,"geometry 1",OP_PORT_TYPE_OBJECT));

    this.fade=this.addInPort(new Port(this,"fade",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.fade.onValueChanged=function(){ if(uniFade)uniFade.setValue(self.fade.val); };

    var geom=null;
    var mesh=null;
    var shader=null;
    var uniFade;
    
    var srcHeadVert=''
        .endl()+'attribute vec3 attrMorphTargetA;'
        .endl()+'uniform float {{mod}}_fade;'
        .endl();

    var srcBodyVert=''
        .endl()+'   pos = vec4( vPosition*{{mod}}_fade+attrMorphTargetA*(1.0-{{mod}}_fade), 1. );'
        .endl();

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(!mesh)return;


        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();

            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            console.log('morph module inited');
        
            uniFade=new CGL.Uniform(shader,'f',module.prefix+'_fade',self.fade.val);
        }

        mesh.render(cgl.getShader());
    };

    function rebuild()
    {
        if(self.geometry0.val && self.geometry1.val)
        {
            console.log('self.geometry0.val',self.geometry0.val);
            var g=self.geometry0.val;
            var geom=JSON.parse(JSON.stringify(g));

            console.log('g',geom);

            geom.morphTargets[0]=JSON.parse(JSON.stringify( self.geometry1.val.vertices ));

            console.log('geom.morphTargets[0].length',self.geometry0.val.vertices.length);
            console.log('geom.morphTargets[0].length',self.geometry1.val.vertices.length);

            mesh=new CGL.Mesh(cgl,geom);
        }
        else
        {
            mesh=null;
        }
    }

    this.geometry0.onValueChanged=rebuild;
    this.geometry1.onValueChanged=rebuild;


};

Ops.Gl.ShaderEffects.MorphMesh.prototype = new Op();
Ops.Gl.Meshes.MorphMesh = Ops.Gl.ShaderEffects.MorphMesh;


// --------------------------------------------------------------------------

