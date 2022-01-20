IN vec3 vPosition;
IN vec2 attrTexCoord;
OUT vec2 texCoord;
UNI mat4 projMatrix;
UNI mat4 modelMatrix;
UNI mat4 viewMatrix;

void main()
{
    texCoord=attrTexCoord;
    vec4 pos = vec4( vPosition, 1. );
    mat4 mvMatrix=viewMatrix * modelMatrix;
    gl_Position = projMatrix * mvMatrix * pos;
}
