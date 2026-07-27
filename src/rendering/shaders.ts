export const vertexSource = `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;
out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec2 vUv;
void main() {
  vec4 worldPosition = uModel * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(uNormalMatrix * normal);
  vUv = uv;
  gl_Position = uProjection * uView * worldPosition;
}`;

export const basicFragmentSource = `#version 300 es
precision highp float;
uniform vec4 uColor;
uniform sampler2D uMap;
uniform int uHasMap;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 color = uColor;
  if (uHasMap == 1) color *= texture(uMap, vUv);
  outColor = color;
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
uniform int uSpotCount;
uniform vec3 uSpotColor[MAX_LIGHTS];
uniform vec3 uSpotPosition[MAX_LIGHTS];
uniform vec3 uSpotDirection[MAX_LIGHTS];
uniform float uSpotIntensity[MAX_LIGHTS];
uniform float uSpotDistance[MAX_LIGHTS];
uniform float uSpotCosAngle[MAX_LIGHTS];
uniform float uSpotPenumbra[MAX_LIGHTS];
in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec2 vUv;
out vec4 outColor;

vec3 shade(vec3 lightDirection, vec3 normal, vec3 view, vec3 base, float shininess) {
  float diffuse = max(dot(normal, lightDirection), 0.0);
  vec3 halfVector = normalize(lightDirection + view);
  float specular = pow(max(dot(normal, halfVector), 0.0), shininess) * (1.0 - uRoughness) * mix(0.04, 1.0, uMetalness);
  return diffuse * base + specular;
}

void main() {
  vec4 surface = uColor;
  if (uHasMap == 1) surface *= texture(uMap, vUv);
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(uCameraPosition - vWorldPosition);
  vec3 base = surface.rgb;
  vec3 lighting = max(uAmbientColor, vec3(0.12));
  float shininess = mix(8.0, 96.0, 1.0 - uRoughness);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uDirectionalCount) break;
    vec3 l = normalize(-uDirectionalDirection[i]);
    lighting += shade(l, n, v, base, shininess) * uDirectionalColor[i] * uDirectionalIntensity[i];
  }

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uPointCount) break;
    vec3 toLight = uPointPosition[i] - vWorldPosition;
    float distanceToLight = length(toLight);
    vec3 l = toLight / max(distanceToLight, 0.0001);
    float attenuation = uPointDistance[i] > 0.0
      ? max(1.0 - distanceToLight / uPointDistance[i], 0.0)
      : 1.0 / (1.0 + 0.08 * distanceToLight * distanceToLight);
    lighting += shade(l, n, v, base, shininess) * uPointColor[i] * uPointIntensity[i] * attenuation;
  }

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uSpotCount) break;
    vec3 toLight = uSpotPosition[i] - vWorldPosition;
    float distanceToLight = length(toLight);
    vec3 l = toLight / max(distanceToLight, 0.0001);
    // Cone falloff: full inside cos(angle), fading out across the penumbra.
    float cosAngle = dot(normalize(-l), normalize(uSpotDirection[i]));
    float outer = uSpotCosAngle[i];
    float inner = mix(1.0, outer, 1.0 - uSpotPenumbra[i]);
    float cone = clamp((cosAngle - outer) / max(inner - outer, 0.0001), 0.0, 1.0);
    if (cone <= 0.0) continue;
    float attenuation = uSpotDistance[i] > 0.0
      ? max(1.0 - distanceToLight / uSpotDistance[i], 0.0)
      : 1.0 / (1.0 + 0.08 * distanceToLight * distanceToLight);
    lighting += shade(l, n, v, base, shininess) * uSpotColor[i] * uSpotIntensity[i] * attenuation * cone;
  }

  outColor = vec4(clamp(base * lighting, 0.0, 1.0), surface.a);
}`;
