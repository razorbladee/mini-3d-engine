export const vertexSource = `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec2 vUv;
void main(){
  vec4 worldPosition=uModel*vec4(position,1.0);
  vWorldPosition=worldPosition.xyz;
  vWorldNormal=normalize(mat3(uModel)*normal);
  vUv=uv;
  gl_Position=uProjection*uView*worldPosition;
}`;

export const basicFragmentSource = `#version 300 es
precision highp float;
uniform vec4 uColor;
uniform sampler2D uMap;
uniform int uHasMap;
in vec2 vUv;
out vec4 outColor;
void main(){
  vec4 color=uColor;
  if(uHasMap==1) color*=texture(uMap,vUv);
  outColor=color;
}`;

export const litFragmentSource = `#version 300 es
precision highp float;
#define MAX_LIGHTS 4
uniform vec4 uColor;
uniform sampler2D uMap;
uniform int uHasMap;
uniform float uRoughness;
uniform float uMetalness;
uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor;
uniform int uDirectionalCount;
uniform vec3 uDirectionalColor[MAX_LIGHTS];
uniform vec3 uDirectionalDirection[MAX_LIGHTS];
uniform float uDirectionalIntensity[MAX_LIGHTS];
uniform int uPointCount;
uniform vec3 uPointColor[MAX_LIGHTS];
uniform vec3 uPointPosition[MAX_LIGHTS];
uniform float uPointIntensity[MAX_LIGHTS];
uniform float uPointDistance[MAX_LIGHTS];
in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec2 vUv;
out vec4 outColor;
void main(){
  vec4 surface=uColor;
  if(uHasMap==1) surface*=texture(uMap,vUv);
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(uCameraPosition-vWorldPosition);
  vec3 base=surface.rgb;
  vec3 lighting=uAmbientColor;
  float shininess=mix(8.0,96.0,1.0-uRoughness);
  for(int i=0;i<MAX_LIGHTS;i++){
    if(i>=uDirectionalCount) break;
    vec3 l=normalize(-uDirectionalDirection[i]);
    float d=max(dot(n,l),0.0);
    vec3 h=normalize(l+v);
    float s=pow(max(dot(n,h),0.0),shininess)*(1.0-uRoughness)*mix(0.04,1.0,uMetalness);
    lighting+=(d*base+s)*uDirectionalColor[i]*uDirectionalIntensity[i];
  }
  for(int i=0;i<MAX_LIGHTS;i++){
    if(i>=uPointCount) break;
    vec3 toLight=uPointPosition[i]-vWorldPosition;
    float distanceToLight=length(toLight);
    vec3 l=toLight/max(distanceToLight,0.0001);
    float attenuation=uPointDistance[i]>0.0?max(1.0-distanceToLight/uPointDistance[i],0.0):1.0/(1.0+0.08*distanceToLight*distanceToLight);
    float d=max(dot(n,l),0.0);
    vec3 h=normalize(l+v);
    float s=pow(max(dot(n,h),0.0),shininess)*(1.0-uRoughness)*mix(0.04,1.0,uMetalness);
    lighting+=(d*base+s)*uPointColor[i]*uPointIntensity[i]*attenuation;
  }
  outColor=vec4(clamp(base*lighting,0.0,1.0),surface.a);
}`;
