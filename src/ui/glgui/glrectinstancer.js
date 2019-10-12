var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.RectInstancer=class
{
    constructor(cgl,options)
    {
        if(!cgl)
        {
            console.log("[RectInstancer] no cgl");
            throw new Error("[RectInstancer] no cgl");
            return;
        }
        this._counter=0;
        this._num=10000;
        this._needsRebuild=true;
        this._rects=[];
        this._interactive=true;

        this._draggingRect=null;

        this._positions=new Float32Array(3*this._num);
        this._colors=new Float32Array(4*this._num);
        this._sizes=new Float32Array(2*this._num);
        this._outlines=new Float32Array(this._num);
        this._texRect=new Float32Array(this._num);

        this._shader=new CGL.Shader(cgl,'rectinstancer');
        this._shader.setSource(''
            .endl()+'IN vec3 vPosition;'
            .endl()+'IN vec3 instPos;'
            .endl()+'IN vec4 instCol;'
            
            .endl()+'IN vec2 attrTexCoord;'
            .endl()+'IN vec4 texRect;'

            .endl()+'IN vec2 instSize;'
            .endl()+'IN float outline;'
            
            .endl()+'OUT float outlinefrag;'
            .endl()+'OUT vec4 posSize;'
            .endl()+'OUT vec4 col;'
            .endl()+'OUT vec2 uv;'

            .endl()+'UNI float zoom,resX,resY,scrollX,scrollY;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'    float aspect=resX/resY;'

            .endl()+'    uv=attrTexCoord*texRect.zw+texRect.xy;'

            .endl()+'    outlinefrag=outline/resY*aspect;'

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
            .endl()+'IN float outlinefrag;'
            .endl()+'IN vec2 uv;'

            .endl()+'void main()'
            .endl()+'{'

            .endl()+'   outColor=col;'

            // outlines
            .endl()+'   if(outlinefrag>0.0){'
            .endl()+'       outColor.rgb+=1.0-smoothstep(0.0,outlinefrag,posSize.x);'
            .endl()+'       outColor.rgb+=1.0-smoothstep(0.0,outlinefrag,posSize.y);'
            .endl()+'       outColor.rgb+=1.0-smoothstep(0.0,outlinefrag,posSize.z);'
            .endl()+'       outColor.rgb+=1.0-smoothstep(0.0,outlinefrag,posSize.w);'
            .endl()+'   }'

            // .endl()+'   outColor.r=uv.x;'
            // .endl()+'   outColor.g=uv.y;'

            .endl()+'}');

        this._uniZoom=new CGL.Uniform(this._shader,'f','zoom',0),
        this._uniResX=new CGL.Uniform(this._shader,'f','resX',0),
        this._uniResY=new CGL.Uniform(this._shader,'f','resY',0),
        this._uniscrollX=new CGL.Uniform(this._shader,'f','scrollX',0),
        this._uniscrollY=new CGL.Uniform(this._shader,'f','scrollY',0);

        this._geom=new CGL.Geometry("rectinstancer");
        this._geom.vertices = new Float32Array([ 1,1,0, 0,1,0, 1,0,0, 0,0,0 ]);
        this._geom.verticesIndices = new Float32Array([ 2,1,0,  3,1,2 ]);
        this._geom.texCoords = new Float32Array([1,1,  0,1,  1,0,  0,0 ]);

        this._mesh=new CGL.Mesh(cgl,this._geom);
        this._mesh.numInstances=this._num;


        var i=0;
        for(i=0;i<2*this._num;i++) this._sizes[i]=0;//Math.random()*61;
        for(i=0;i<3*this._num;i++) this._positions[i]=0;//Math.random()*60;
        for(i=0;i<4*this._num;i++) this._colors[i]=1;//Math.random();
        for(i=0;i<this._num;i++) this._outlines[i]=0;//Math.random();
        for(i=0;i<4*this._num;i+=4)
        {
            this._texRect[i+0]=0;
            this._texRect[i+1]=0;
            this._texRect[i+2]=1;
            this._texRect[i+2]=1;
        }
    }

    set interactive(i) { this._interactive=i; }
    get interactive() { return this._interactive; }

    dispose()
    {

    }

    isDragging()
    {
        return this._draggingRect!=null;
    }

    render(resX,resY,scrollX,scrollY,zoom)
    {
        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0/zoom);

        if(this._needsRebuild)this.rebuild();

        this._mesh.render(this._shader);
    }

    rebuild()
    {
        // console.log("rebuild!");
        // todo only update whats needed
        this._mesh.setAttribute('instPos',this._positions,3,{instanced:true});
        this._mesh.setAttribute('instCol',this._colors,4,{instanced:true});
        this._mesh.setAttribute('instSize',this._sizes,2,{instanced:true});
        this._mesh.setAttribute('outline',this._outlines,1,{instanced:true});

        this._needsRebuild=false;
    }

    getIndex()
    {
        this._counter++;
        // console.log("inst counter",this._counter);
        return this._counter;
    }

    _float32Diff(a,b)
    {
        return Math.abs(a-b)>0.0001;
    }

    setPosition(idx,x,y)
    {
        if( this._float32Diff(this._positions[idx*3+0],x) || this._float32Diff(this._positions[idx*3+1],y)) { this._needsRebuild=true; }

        this._positions[idx*3+0]=x;
        this._positions[idx*3+1]=y;
    }

    setSize(idx,x,y)
    {
        if( this._float32Diff(this._sizes[idx*2+0],x) || this._float32Diff(this._sizes[idx*2+1],y)) { this._needsRebuild=true; }

        this._sizes[idx*2+0]=x;
        this._sizes[idx*2+1]=y;
    }



    setColor(idx,r,g,b,a)
    {
        if(
            this._float32Diff(this._colors[idx*4+0],r) ||
            this._float32Diff(this._colors[idx*4+1],g) ||
            this._float32Diff(this._colors[idx*4+2],b) ||
            this._float32Diff(this._colors[idx*4+3],a) ) { this._needsRebuild=true; }

        this._colors[idx*4+0]=r;
        this._colors[idx*4+1]=g;
        this._colors[idx*4+2]=b;
        this._colors[idx*4+3]=a;
    }

    setOutline(idx,o)
    {
        if(this._outlines[idx]!=o) { this._needsRebuild=true; }

        this._outlines[idx]=o;
    }

    createRect(options)
    {
        var r=new CABLES.GLGUI.GlRect(this,options||{});
        this._rects.push(r);

        r.on("dragStart", (rect)=> { this._draggingRect=rect; });
        r.on("dragEnd", ()=> { this._draggingRect=null; });


        return r;
    }

    mouseMove(x,y,button)
    {
        if(!this._interactive)return;
        
        if(this._draggingRect)
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
        {
            this._rects[i].mouseDown(e);
        }
    }

    mouseUp(e)
    {
        if(!this._interactive)return;

        if(this._draggingRect)
        {
            this._draggingRect.mouseDragEnd();
        }

        for(var i=0;i<this._rects.length;i++)
        {
            this._rects[i].mouseUp(e);
        }
    }

}