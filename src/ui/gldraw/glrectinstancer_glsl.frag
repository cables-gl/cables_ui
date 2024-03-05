
 IN vec4 col;
 IN vec4 posSize;
 IN float zz;
 IN vec2 uv;
 IN vec4 decoration;
 IN float useTexture;
 UNI float time;
 UNI sampler2D tex;
 UNI float zoom;
 UNI float msdfUnit;

 float median(float r, float g, float b)
 {
    return max(min(r, g), min(max(r, g), b));
 }

 float median(vec3 rgb)
 {
    return max(min(rgb.r, rgb.g), min(max(rgb.r, rgb.g),rgb.b));
 }

 float screenPxRange() {
    float pxRange=4.0;

#ifdef WEBGL1
vec2 unitRange = vec2(pxRange)/vec2(1024.0);
#endif
#ifdef WEBGL2
    vec2 unitRange = vec2(pxRange)/vec2(textureSize(tex, 0));
#endif

    vec2 screenTexSize = vec2(1.0)/fwidth(uv);
    return max(0.5*dot(unitRange, screenTexSize), 1.0);
}

float contour(in float d, in float w) {
    // smoothstep(lower edge0, upper edge1, x)
    return smoothstep(0.5 - w, 0.5 + w, d);
}
float samp(in vec2 uv, float w) {
    return contour(median(texture2D(tex, uv).rgb), w);
}


 void main()
 {

    vec4 finalColor;
    finalColor.rgb=col.rgb;
    finalColor.a=1.0;

    if(useTexture>=0.0)
    {
        #ifdef SDF_TEXTURE


    float dist = median(texture2D(tex, uv).rgb);

    // fwidth helps keep outlines a constant width irrespective of scaling
    // GLSL's fwidth = abs(dFdx(uv)) + abs(dFdy(uv))
    float width = fwidth(dist);
    // Stefan Gustavson's fwidth
    //float width = 0.7 * length(vec2(dFdx(dist), dFdy(dist)));

// basic version
    //float alpha = smoothstep(0.5 - width, 0.5 + width, dist);

// supersampled version

    float alpha = contour( dist, width );
    //float alpha = aastep( 0.5, dist );

    // ------- (comment this block out to get your original behavior)
    // Supersample, 4 extra points
    float dscale = 0.354; // half of 1/sqrt2; you can play with this
    vec2 duv = dscale * (dFdx(uv) + dFdy(uv));
    vec4 box = vec4(uv-duv, uv+duv);

    float asum = samp( box.xy, width )
               + samp( box.zw, width )
               + samp( box.xw, width )
               + samp( box.zy, width );

    // weighted average, with 4 extra points having 0.5 weight each,
    // so 1 + 0.5*4 = 3 is the divisor
    float opacity = (alpha + 0.5 * asum) / 3.0;




            // vec4 smpl=texture(tex,uv);
            // float sigDist = median(smpl.r, smpl.g, smpl.b) - 0.5;
            // // vec2 msdfUnit = vec2(1.0/pow(zoom,2.0))/10000.0;//8.0/vec2(1024);
            // // vec2 msdfUnit=vec2(1.0/zoom*200000.0);
            // // vec2 msdfUnit=vec2(8.0/1024.0);

            // // if(1.0/zoom<500.)
            // // msdfUnit=vec2(8.0/200.0);


            // sigDist *= dot(msdfUnit, 0.5/fwidth(uv).x);
            // float opacity = clamp(sigDist + 0.5, 0.0, 1.0);
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
    else
    if(shape==2.0) // trianglebottom
    {
        if(uv.x+(1.0-uv.y) > 1.0)finalColor.a=1.0;
        else finalColor.a=0.0;
    }
    else
    if(shape==4.0) // frame
    {
        float outlinefrag=0.003;
        float add=(1.0-step(outlinefrag,posSize.x));
        if(add==0.0) add=(1.0-step(outlinefrag,posSize.y));
        if(add==0.0) add=(1.0-step(outlinefrag,posSize.z));
        if(add==0.0) add=(1.0-step(outlinefrag,posSize.w));
        if(add==0.0) finalColor.a=0.0;
    }
    else
    if(shape==5.0) // cursor
    {
        if(1.0-uv.x > uv.y && 1.0-uv.y<0.8-uv.x*0.3)finalColor.a=1.0;
        else finalColor.a=0.0;
    }
    else
    if(shape==6.0) // filled circle
    {
        float outer = ((uv.x-0.5)*(uv.x-0.5) + (uv.y-0.5)*(uv.y-0.5));
        finalColor.a=smoothstep(0.2+fwidth(uv.x),0.2,outer);
        // f(finalColor.a==0.0)discard;
    }
    else
    if(shape==7.0) // cross
    {
        float r = 0.00001;
        float l = 1.0;
        vec2 p = abs((uv)-0.5);
        float a = length(p-clamp(p.x+p.y,0.0,l)*0.5) - r;
        finalColor.a = (1.0-smoothstep(0.0,fwidth(uv.x)+0.1,a));
    }
    else
    if(shape==8.0) // loading indicator...
    {
        float s = sin(time*10.0);
        float c = cos(time*10.0);
        mat2 m = mat2(c, -s, s, c);
        vec2 uvRot=m*(uv-0.5);

        float outer = ((uvRot.x)*(uvRot.x) + (uvRot.y)*(uvRot.y));
        float inner = ((uvRot.x)*(uvRot.x) + (uvRot.y)*(uvRot.y));

        finalColor.a=smoothstep(0.2+fwidth(uvRot.x),0.2,outer);
        float v=1.0-smoothstep(0.1+fwidth(uvRot.x),0.1,inner);

        finalColor.rgb=mix(vec3(0.25,0.25,0.25), vec3(finalColor),v);

        if(uvRot.x>0.0 || uvRot.y>0.0) finalColor.a=0.0;
        finalColor.a*=v;
    }
    else
    if(shape==9.0) // half block top
    {
        if(uv.y<0.5)discard;
    }
    else
    if(shape==10.0) // half block bottom
    {
        if(uv.y>0.5)discard;
    }
    else
    if(shape==11.0) // arrow down
    {
        if((abs(uv.x-0.5))>(uv.y-0.5))finalColor.a=0.0;
        else finalColor.a=1.0;
    }

    if(border>=1.0) // border
    {
       float outlinefrag=0.004*zoom*500.0;
       float add=(1.0-step(outlinefrag,posSize.x));
       if(add==0.0)add=(1.0-step(outlinefrag,posSize.y));
       if(add==0.0)add=(1.0-step(outlinefrag,posSize.z));
       if(add==0.0)add=(1.0-step(outlinefrag,posSize.w));

       if(border==2.0)finalColor.rgb+=vec3(add*0.2);
       else finalColor.rgb+=vec3(add*0.5);
    }

    // if(selected==1.0) // stripe
    // {
    //    float w=0.05;
    //    finalColor.rgb+=0.12*vec3( step(w/2.0,mod( time*0.04+posSize.x+posSize.y,w )));
    // }

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
