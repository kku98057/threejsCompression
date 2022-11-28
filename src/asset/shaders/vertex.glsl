varying vec2 vUv;
varying vec3 vPosition;

void main() {

    vUv = uv;

    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4( position , 1.);
    gl_PointSize = 10. * (1. / - mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}