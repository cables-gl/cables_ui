IN vec2 texCoord;
IN vec4 fcolor;
IN vec4 finactiveColor;
IN vec4 fcolorBorder;
IN float fProgress;
IN float fSplineLength;
IN float fspeed;
IN float zz;

UNI vec4 fadeOutOptions;
UNI vec2 mousePos;

UNI float a;
UNI float time;

UNI float width;
UNI float widthSelected;


// vec4 finactiveColor=vec4(0.0,0.0,0.0,1.0);


{{MODULES_HEAD}}

void main()
{
    vec4 finalColor=fcolor;
    // float darken=1.0;
    // float minOpacity=0.7;

    #ifdef DRAWSPEED
        if(fspeed==0.0)finalColor=finactiveColor;
        if(fspeed==1.0)finalColor=fcolor;
        // if(fspeed==0.0)darken=1.0;
        // if(fspeed==1.0)darken=1.1;
        if(fspeed>=2.0)
        {
            float ffspeed=clamp(fspeed,0.,25.0);
            float darken=step(0.5,mod((time*ffspeed/2.0)+fProgress*0.2*(ffspeed*0.1),1.0));

            if(darken>0.5)finalColor=finactiveColor;
            else finalColor=fcolor;
        }
    #endif

    {{MODULE_COLOR}}
    // finalColor.rgb*=darken;

    // #ifdef LINE_OUTLINE
    //     if(abs(texCoord.y)>0.7) finalColor.rgb*=0.0;
    // #endif

    #ifdef DEBUG_1
        finalColor.rgb=vec3((zz+1.0)/2.0);
        finalColor.a=1.0;
    #endif
    #ifdef DEBUG_2
        finalColor.rg=texCoord;
        finalColor.a=1.0;
    #endif
    finalColor.a=1.0;





    // selected border
    if(fcolorBorder.a>0.0)
    {
        float border=widthSelected/(width+widthSelected)/2.0;

        float fade=0.0;

        fade=
            smoothstep(border+fwidth(texCoord.y),border,texCoord.y)+ // left border
            smoothstep(1.0-border-fwidth(texCoord.y),1.0-border,texCoord.y); // right

        finalColor=mix(finalColor,fcolorBorder,fade);
    }



    #ifdef FADEOUT
        // fade out over distance

        float fadeDistStart=fadeOutOptions.x;
        float fadeDist=fadeOutOptions.y;
        float fadeDistLength=6.0;
        float minOpacity=fadeOutOptions.w;


        if(fcolorBorder.a==0.0 && fSplineLength>fadeDistStart*2.0 && fProgress>fadeDistStart && fProgress<fSplineLength-fadeDistStart)
        {
            finalColor.a=0.0;
            finalColor.a=1.0-smoothstep(fProgress,fadeDistStart,fadeDistStart+fadeDist);
            finalColor.a+=1.0-(smoothstep(fProgress,fSplineLength-fadeDistStart,fSplineLength-fadeDistStart-fadeDist));
            finalColor.a=clamp(finalColor.a,minOpacity,1.0);
        }

    #endif

// finalColor=finactiveColor;
// finalColor.rgb*=fProgress/fSplineLength;
 // finalColor=vec4(1.0);

 // finalColor.a=1.0;

  // finalColor.rgb=fcolor.rgb;
    outColor = finalColor;
}
