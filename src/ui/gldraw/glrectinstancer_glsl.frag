
 IN vec4 col;
 IN vec4 posSize;
 IN float zz;
    // IN float outlinefrag;'
 IN vec2 uv;
 IN vec4 decoration;
 IN float useTexture;
 UNI float time;
 UNI sampler2D tex;
 UNI float zoom;

 float median(float r, float g, float b)
 {
    return max(min(r, g), min(max(r, g), b));
 }

 void main()
 {

    vec4 finalColor;
    finalColor.rgb=col.rgb;
    finalColor.a=1.0;

    if(useTexture>=0.0)
    {
        #ifdef SDF_TEXTURE
            vec4 smpl=texture(tex,uv);
            float sigDist = median(smpl.r, smpl.g, smpl.b) - 0.5;
            // vec2 msdfUnit = vec2(1.0/pow(zoom,2.0))/10000.0;//8.0/vec2(1024);
            // vec2 msdfUnit=vec2(1.0/zoom*200000.0);
            vec2 msdfUnit=vec2(8.0/1024.0);

            if(zoom<0.001)msdfUnit=vec2(8.0/1200.0);

            sigDist *= dot(msdfUnit, 0.5/fwidth(uv));
            float opacity = clamp(sigDist + 0.5, 0.0, 1.0);
            finalColor=vec4(finalColor.rgb, opacity);
        #endif

        #ifndef SDF_TEXTURE
            finalColor=texture(tex,uv);
            // if(int(useTexture)==1)finalColor=texture(tex[1],uv);
            // if(int(useTexture)==2)finalColor=texture(tex[2],uv);
            // if(int(useTexture)==3)finalColor=texture(tex[3],uv);
            // if(int(useTexture)==4)finalColor=texture(tex[4],uv);
            // if(int(useTexture)==5)finalColor=texture(tex[5],uv);
        #endif
    }

    float shape=decoration.r;
    float border=decoration.g;
    float selected=decoration.b;


    if(shape==1.0) // circl
    {
        float outer = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));
        float inner = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));
        finalColor.a=smoothstep(0.2+fwidth(uv.x),0.2,outer);
        finalColor.rgb=mix(vec3(0.25,0.25,0.25), vec3(finalColor),1.0-smoothstep(0.1+fwidth(uv.x),0.1,inner));
    }

    if(shape==2.0) // trianglebotto
    {
        if(uv.x+(1.0-uv.y) > 1.0)finalColor.a=1.0;
        else finalColor.a=0.0;
    }

    if(shape==5.0) // curso
    {
        if(1.0-uv.x > uv.y && 1.0-uv.y<0.8-uv.x*0.3)finalColor.a=1.0;
        else finalColor.a=0.0;
    }

    if(shape==6.0) // filled circl
    {
        float outer = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));
        finalColor.a=smoothstep(0.2+fwidth(uv.x),0.2,outer);
        // f(finalColor.a==0.0)discard;
    }

    if(shape==4.0) // fram
    {
        float outlinefrag=0.003;
        float add=(1.0-step(outlinefrag,posSize.x));
        if(add==0.0) add=(1.0-step(outlinefrag,posSize.y));
        if(add==0.0) add=(1.0-step(outlinefrag,posSize.z));
        if(add==0.0) add=(1.0-step(outlinefrag,posSize.w));
        if(add==0.0) finalColor.a=0.0;
    }


    if(border==1.0) // borde
    {
       float outlinefrag=0.004;
       float add=(1.0-step(outlinefrag,posSize.x));
       if(add==0.0)add=(1.0-step(outlinefrag,posSize.y));
       if(add==0.0)add=(1.0-step(outlinefrag,posSize.z));
       if(add==0.0)add=(1.0-step(outlinefrag,posSize.w));
       finalColor.rgb+=vec3(add*0.1);
    }

    if(selected==1.0) // stripe
    {
       float w=0.05;
       finalColor.rgb+=0.12*vec3( step(w/2.0,mod( time*0.04+posSize.x+posSize.y,w )));
    }

    finalColor.a*=col.a;

    #ifdef DEBUG_1
        finalColor.rgb=vec3((zz+1.0)/2.0);
        finalColor.a=1.0;
    #endif
    #ifdef DEBUG_2
        finalColor.rg=uv;
        finalColor.a=1.0;
    #endif

    if(finalColor.a==0.0)discard;
    outColor=finalColor;
}
