var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.RectInstancer=class extends CABLES.EventTarget
{
    constructor(cgl,options)
    {
        super();

        if(!cgl)
        {
            console.log("[RectInstancer] no cgl");
            throw new Error("[RectInstancer] no cgl");
            return;
        }

        this._counter=0;
        this._num=5000;
        this._needsRebuild=true;
        this._rects=[];
        this._textures=[];
        this._interactive=true;
        this.allowDragging=false;
        this._cgl=cgl;
        this._needsTextureUpdate=false;
        this._draggingRect=null;

        this._setupAttribBuffers();

        this._shader=new CGL.Shader(cgl,'rectinstancer');
        this._shader.setSource(''
            .endl()+'IN vec3 vPosition;'
            .endl()+'IN vec3 instPos;'
            .endl()+'IN vec4 instCol;'
            .endl()+'IN vec2 attrTexCoord;'
            .endl()+'IN vec4 texRect;'

            .endl()+'IN vec2 instSize;'
            // .endl()+'IN float outline;'
            
            .endl()+'IN float circle;'
            .endl()+'OUT float frCircle;'
            
            // .endl()+'OUT float outlinefrag;'
            .endl()+'OUT vec4 posSize;'
            .endl()+'OUT vec4 col;'
            .endl()+'OUT vec2 uv;'

            .endl()+'IN float contentTexture;'
            .endl()+'OUT float useTexture;'

            .endl()+'UNI float zoom,resX,resY,scrollX,scrollY;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'    float aspect=resX/resY;'

            .endl()+'    useTexture=contentTexture;'
            .endl()+'    frCircle=circle;'

            .endl()+'    uv=attrTexCoord*texRect.zw+texRect.xy;'
            .endl()+'    uv.y=1.0-uv.y;'

            // .endl()+'    outlinefrag=outline/resY*aspect*1.0;'

            .endl()+'    vec3 pos=vPosition;'
            .endl()+'    pos.xy*=instSize;'

            .endl()+'    posSize=vec4(pos.xy*zoom,instSize*zoom-pos.xy*zoom);'
            
            .endl()+'    pos.x+=instPos.x;'
            .endl()+'    pos.y+=instPos.y;'
            .endl()+'    pos.y*=aspect;'
            .endl()+'    pos.y=0.0-pos.y;'

            .endl()+'    col=instCol;'

            .endl()+'    pos*=zoom;'

            .endl()+'    pos.x+=scrollX;'
            .endl()+'    pos.y+=scrollY;'

            .endl()+'    gl_Position = vec4(pos,1.0);'
            .endl()+'}'




            , ''
            .endl()+'IN vec4 col;'
            .endl()+'IN vec4 posSize;'
            // .endl()+'IN float outlinefrag;'
            .endl()+'IN vec2 uv;'
            .endl()+'IN float frCircle;'
            .endl()+'IN float useTexture;'
            .endl()+'UNI sampler2D tex[8];'

            .endl()+'void main()'
            .endl()+'{'

            .endl()+'   outColor=col;'

            // outlines
            // .endl()+'   if(outlinefrag>0.0){'

            // .endl()+'       float add=(1.0-step(outlinefrag,posSize.x));'
            // .endl()+'       if(add==0.0)add=(1.0-step(outlinefrag,posSize.y));'
            // .endl()+'       if(add==0.0)add=(1.0-step(outlinefrag,posSize.z));'
            // .endl()+'       if(add==0.0)add=(1.0-step(outlinefrag,posSize.w));'
            // .endl()+'       outColor.rgb+=vec3(add*0.4);'
            // .endl()+'   }'

            .endl()+'if(useTexture>=0.0)'
            .endl()+'{'

            .endl()+'   #ifdef SDF_TEXTURE'
            // https://blog.mapbox.com/drawing-text-with-signed-distance-fields-in-mapbox-gl-b0933af6f817
            .endl()+'       float smpl=texture(tex[0],uv).r;'
            .endl()+'       float scale = 1.0 / fwidth(smpl);'
            .endl()+'       float signedDistance = (smpl - 0.5) * scale*0.5;'

            .endl()+'       float color = clamp(signedDistance + 0.5, 0.0, 1.0);'

            .endl()+'       outColor=vec4(outColor.rgb, color);'
            .endl()+'   #endif'
            .endl()+'   #ifndef SDF_TEXTURE'

            .endl()+'   if(int(useTexture)==0)outColor=texture(tex[0],uv);'
            .endl()+'   if(int(useTexture)==1)outColor=texture(tex[1],uv);'
            .endl()+'   if(int(useTexture)==2)outColor=texture(tex[2],uv);'
            .endl()+'   if(int(useTexture)==3)outColor=texture(tex[3],uv);'
            .endl()+'   if(int(useTexture)==4)outColor=texture(tex[4],uv);'
            .endl()+'   if(int(useTexture)==5)outColor=texture(tex[5],uv);'
            .endl()+'   #endif'
            .endl()+'}'

            .endl()+'if(frCircle>0.0)'
            .endl()+'{'
            .endl()+'   float outer = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));'
            .endl()+'   float inner = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));'
            .endl()+'   outColor.a=smoothstep(0.22,0.2,outer) * 1.0-smoothstep(0.12,0.1,inner);'
            .endl()+'}'

            .endl()+'}');

        this._uniZoom=new CGL.Uniform(this._shader,'f','zoom',0),
        this._uniResX=new CGL.Uniform(this._shader,'f','resX',0),
        this._uniResY=new CGL.Uniform(this._shader,'f','resY',0),
        this._uniscrollX=new CGL.Uniform(this._shader,'f','scrollX',0),
        this._uniscrollY=new CGL.Uniform(this._shader,'f','scrollY',0);

        this._uniTexture=new CGL.Uniform(this._shader,'t[]','tex',[0,1,2,3,4,5,6,7,8]),

        this._geom=new CGL.Geometry("rectinstancer");
        this._geom.vertices = new Float32Array([ 1,1,0, 0,1,0, 1,0,0, 0,0,0 ]);
        this._geom.verticesIndices = new Float32Array([ 2,1,0,  3,1,2 ]);
        this._geom.texCoords = new Float32Array([1,1,  0,1,  1,0,  0,0 ]);


        this._mesh=new CGL.Mesh(cgl,this._geom);
        this._mesh.numInstances=this._num;


        this.clear();

    }

    set interactive(i) { this._interactive=i; }
    get interactive() { return this._interactive; }

    dispose()
    {

    }

    clear()
    {
        var i=0;
        for(i=0;i<2*this._num;i++) this._attrSizes[i]=0;//Math.random()*61;
        for(i=0;i<3*this._num;i++) this._attrPositions[i]=0;//Math.random()*60;
        for(i=0;i<4*this._num;i++) this._attrColors[i]=1;//Math.random();
        // for(i=0;i<this._num;i++) this._attrOutline[i]=0;//Math.random();
        for(i=0;i<this._num;i++) this._attrCircle[i]=0;//Math.random();

        for(i=0;i<this._num;i++) this._attrTextures[i]=-1;//Math.random();
        
        for(i=0;i<4*this._num;i+=4)
        {
            this._attrTexRect[i+0]=0;
            this._attrTexRect[i+1]=0;
            this._attrTexRect[i+2]=1;
            this._attrTexRect[i+3]=1;
        }
    }

    _setupAttribBuffers()
    {
        const oldAttrPositions = this._attrPositions;
        const oldAttrTextures = this._attrTextures;
        const oldAttrColors = this._attrColors;
        const oldAttrSizes = this._attrSizes;
        const oldAttrCircle = this._attrCircle;
        const oldAttrTexRect = this._attrTexRect;


        this._attrPositions=new Float32Array(3*this._num);
        this._attrTextures=new Float32Array(this._num);
        this._attrColors=new Float32Array(4*this._num);
        this._attrSizes=new Float32Array(2*this._num);
        this._attrCircle=new Float32Array(this._num);
        this._attrTexRect=new Float32Array(4*this._num);
        this.clear();

        if(oldAttrPositions)this._attrPositions.set(oldAttrPositions);
        if(oldAttrTextures)this._attrTextures.set(oldAttrTextures);
        if(oldAttrColors)this._attrColors.set(oldAttrColors);
        if(oldAttrSizes)this._attrSizes.set(oldAttrSizes);
        if(oldAttrCircle)this._attrCircle.set(oldAttrCircle);
        if(oldAttrTexRect)this._attrTexRect.set(oldAttrTexRect);

    }

    isDragging()
    {
        return this._draggingRect!=null;
    }

    _setupTextures()
    {
        console.log("SETTING UP TEXTURES!!");
        this._needsTextureUpdate=false;
        this._textures.length=0;
        var count=0;
        for(var i=0;i<this._rects.length;i++)
        {
            if(this._rects[i].texture)
            {
                var found=false;

                for(var j=0;j<this._textures.length;j++)
                {
                    if(this._textures[j] && this._textures[j].texture==this._rects[i].texture)
                    {
                        found=true;
                        this._attrTextures[this._rects[i].idx]=this._textures[j].num;
                        this._needsRebuild=true;
                    }
                }

                if(!found)
                {
                    this._attrTextures[this._rects[i].idx]=count;
                    this._textures[count]=
                        {
                            "texture":this._rects[i].texture,
                            "num":count
                        };
                    count++;
                    this._needsRebuild=true;
                }
            }
            else this._attrTextures[this._rects[i].idx]=-1;
        }

        // console.log(this._attrTextures);
        // console.log("this._textures.length",this._textures.length);


    }


    _bindTextures()
    {
        for(var i=0;i<this._textures.length;i++)
        {
            if(this._textures[i])
                this._cgl.setTexture(this._textures[i].num, this._textures[i].texture.tex);
            // console.log("bind",i,this._textures[i].texture.width);
        }
    }


    render(resX,resY,scrollX,scrollY,zoom)
    {
        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0/zoom);

        if(this._needsTextureUpdate)this._setupTextures();
        this._bindTextures();
        
        if(this._needsRebuild) this.rebuild();

        this.emitEvent("render");

        this._mesh.render(this._shader);
    }

    rebuild()
    {
        // todo only update whats needed

        var perf = CABLES.uiperf.start('[glRectInstancer] rebuild');
        this._mesh.numInstances=this._num;

        this._mesh.setAttribute('instPos',this._attrPositions,3,{instanced:true});
        this._mesh.setAttribute('instCol',this._attrColors,4,{instanced:true});
        this._mesh.setAttribute('instSize',this._attrSizes,2,{instanced:true});
        // this._mesh.setAttribute('outline',this._attrOutline,1,{instanced:true});
        this._mesh.setAttribute('circle',this._attrCircle,1,{instanced:true});
        this._mesh.setAttribute('texRect',this._attrTexRect,4,{instanced:true});
        this._mesh.setAttribute('contentTexture',this._attrTextures,1,{instanced:true});
        
        perf.finish();

        this._needsRebuild=false;
    }

    getNumRects()
    {
        return this._counter;
    }

    getIndex()
    {
        this._counter++;
        // console.log("inst counter",this._counter);
        if(this._counter>this._num-100)
        {
            this._num+=1000;
            console.log('resize to',this._num)
            this._setupAttribBuffers();
            this._needsRebuild=true;
            this._needsTextureUpdate=false;
    
        }
        return this._counter;
    }

    _float32Diff(a,b)
    {
        return Math.abs(a-b)>0.0001;
    }

    setPosition(idx,x,y)
    {
        if( this._float32Diff(this._attrPositions[idx*3+0],x) || this._float32Diff(this._attrPositions[idx*3+1],y)) { this._needsRebuild=true; }

        this._attrPositions[idx*3+0]=x;
        this._attrPositions[idx*3+1]=y;
    }

    setSize(idx,x,y)
    {
        if( this._float32Diff(this._attrSizes[idx*2+0],x) || this._float32Diff(this._attrSizes[idx*2+1],y)) { this._needsRebuild=true; }

        this._attrSizes[idx*2+0]=x;
        this._attrSizes[idx*2+1]=y;
    }

    setAllTexture(tex,sdf)
    {
        this._shader.toggleDefine("SDF_TEXTURE",sdf);

        for(var i=0;i<this._rects.length;i++)
        {
            this._rects[i].setTexture(tex);
        }
    }

    setTexRect(idx,x,y,w,h)
    {
        if(
            this._float32Diff(this._attrTexRect[idx*4+0],x) ||
            this._float32Diff(this._attrTexRect[idx*4+1],y) ||
            this._float32Diff(this._attrTexRect[idx*4+2],w) ||
            this._float32Diff(this._attrTexRect[idx*4+3],h) ) { this._needsRebuild=true; }

        this._attrTexRect[idx*4+0]=x;
        this._attrTexRect[idx*4+1]=y;
        this._attrTexRect[idx*4+2]=w;
        this._attrTexRect[idx*4+3]=h;
    }

    setColor(idx,r,g,b,a)
    {
        if(r.length)
        {
            a=r[3];
            b=r[2];
            g=r[1];
            r=r[0];
        }
        if(
            this._float32Diff(this._attrColors[idx*4+0],r) ||
            this._float32Diff(this._attrColors[idx*4+1],g) ||
            this._float32Diff(this._attrColors[idx*4+2],b) ||
            this._float32Diff(this._attrColors[idx*4+3],a) ) { this._needsRebuild=true; }

        this._attrColors[idx*4+0]=r;
        this._attrColors[idx*4+1]=g;
        this._attrColors[idx*4+2]=b;
        this._attrColors[idx*4+3]=a;
    }

    setCircle(idx,o)
    {
        if(this._attrCircle[idx]!=o) { this._needsRebuild=true; }
        this._attrCircle[idx]=o;
    }

    // setOutline(idx,o)
    // {
    //     if(this._attrOutline[idx]!=o) { this._needsRebuild=true; }
    //     this._attrOutline[idx]=o;
    // }

    createRect(options)
    {
        options=options||{};
        var r=new CABLES.GLGUI.GlRect(this,options);
        this._rects.push(r);

        if(options.draggable)
        {
            this.allowDragging=options.draggable;
            r.on("dragStart", (rect)=> { if(this.allowDragging) this._draggingRect=rect; });
            r.on("dragEnd", ()=> { this._draggingRect=null; });
        }

        r.on("textureChanged", ()=>{ this._needsTextureUpdate=true; });


        return r;
    }

    mouseMove(x,y,button)
    {
        if(!this._interactive)return;
        if(this.allowDragging && this._draggingRect)
        {
            this._draggingRect.mouseDrag(x,y,button);
            return;
        }

        for(var i=0;i<this._rects.length;i++)
        {
            this._rects[i].mouseMove(x,y,button);
        }
    }

    mouseDown(e)
    {
        if(!this._interactive)return;

        for(var i=0;i<this._rects.length;i++)
            this._rects[i].mouseDown(e);
    }

    mouseUp(e)
    {
        if(!this._interactive)return;

        for(var i=0;i<this._rects.length;i++)
            this._rects[i].mouseUp(e);

        if(this._draggingRect)
            this._draggingRect.mouseDragEnd();
    }

}