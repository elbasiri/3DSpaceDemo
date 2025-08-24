import * as THREE from "https://esm.sh/three@0.166.1";
import { RGBELoader } from "https://esm.sh/three@0.166.1/examples/jsm/loaders/RGBELoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bgCanvas'), antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 3;

// Particles systeme
const particlesCount = 1500;
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 100;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/circle.png');

// Comet
const cometTexture = textureLoader.load('./textures/comet.png');
const cometGeo = new THREE.PlaneGeometry(5, 5);
const cometMat = new THREE.MeshBasicMaterial({
  map: cometTexture,
  transparent: true,
});
const comet = new THREE.Mesh(cometGeo, cometMat);
comet.position.set(-30, 25, -30);
scene.add(comet);

const material = new THREE.PointsMaterial({
  size: .15,
  map: particleTexture,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

// Fog simple
{
  const near = 50;
  const far = 70;
  const color = 'orange';
  scene.fog = new THREE.Fog(color, near, far);
}

const moonTexture = textureLoader.load('./textures/moon.jpg');

const moonConfig = {
  map: moonTexture,
  emissive: new THREE.Color(0xffffff), // glow color
  emissiveIntensity: 10 
}

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshBasicMaterial( moonConfig )
);
moon.position.set(30, 20, -40);
scene.add(moon);

const particles = new THREE.Points(geometry, material);
scene.add(particles);

moon.renderOrder = 1;
particles.renderOrder = 0;

const nebulaMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { time: { value: 0.0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec2 vUv;

    float noise(vec2 uv) {
      return fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453);
    }

    float smoothNoise(vec2 uv) {
      vec2 i = floor(uv);
      vec2 f = fract(uv);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
    }

    void main() {
      vec2 uv = vUv * 4.0;
      float n = smoothNoise(uv + time*0.02); // slower shift
      vec3 col = mix(vec3(.4,0.0,0.05), vec3(0.4,0.0,0.6), n); // dark purple nebula
      float alpha = smoothstep(0.2, 1.0, n) * 0.35; // soft fade
      gl_FragColor = vec4(col, alpha);
    }
  `
});

// huge plane behind scene
const nebula = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), nebulaMaterial);
nebula.position.set(0, 0, -60);
scene.add(nebula);


const startPos = new THREE.Vector3(-30, 25, -30);
const endPos = new THREE.Vector3(30, -25, -30); // mirrored based on aspect

let cometVisible = false;
const cometSpeed = 0.2;

function animate() {
    renderer.render(scene, camera);
    particles.rotation.y += 0.001;
    particles.material.size += Math.random() * 0;
    moon.rotation.y += .01;

    if (cometVisible) {
    // linear interpolation
    comet.position.lerp(endPos, cometSpeed); // 0.01 controls speed

    if (comet.position.distanceTo(endPos) < 0.1) {
      cometVisible = false;
    }
    } else if (Math.random() < 0.000001) {
      comet.position.copy(startPos);
      cometVisible = true;
    }

    nebulaMaterial.uniforms.time.value += 0.13;
    requestAnimationFrame(animate);
}
animate();