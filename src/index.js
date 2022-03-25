import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
global.THREE = THREE;

require("three/examples/js/controls/OrbitControls");
const { GUI } = require("dat.gui");

let container, stats1, stats2, stats3;

let camera, scene, renderer;

let road, road2, road3, roadLength, wireframe, bloomComposer, finalComposer;

const ENTIRE_SCENE = 0,
  BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const params = {
  exposure: 1,
  bloomStrength: 2.0,
  bloomThreshold: 0,
  bloomRadius: 0,
  scene: "Scene with Glow"
};

const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
const materials = {};

let planeTrain = [];

let options = {
  rotX: 0
};

function vertexShader() {
  return `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `;
}

function fragmentShader() {
  return `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;

    varying vec2 vUv;

    void main() {
      gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
    }
  `;
}

init();
render();

function init() {
  container = document.getElementById("container");

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    150
  );
  camera.position.z = 12;
  camera.position.y = 0.5;
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x555555);

  //

  scene.add(new THREE.AmbientLight(0x404040));

  //

  const gltf_loader = new GLTFLoader();
  gltf_loader.load("src/synthroad.glb", (gltf) => {
    road = gltf.scene;
    road2 = road.clone();
    road3 = road.clone();

    let terrain = road.getObjectByName("Plane");
    let terrain2 = road2.getObjectByName("Plane");
    let terrain3 = road3.getObjectByName("Plane");
    let wireframe = road.getObjectByName("Wireframe");
    let wireframe2 = road2.getObjectByName("Wireframe");
    let wireframe3 = road3.getObjectByName("Wireframe");

    wireframe.layers.enable(BLOOM_SCENE);
    wireframe2.layers.enable(BLOOM_SCENE);
    wireframe3.layers.enable(BLOOM_SCENE);

    let wfMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.0, 0.7, 0.7)
    });
    let terrainMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.0, 0.0, 1.0)
    });
    wireframe.material = wfMat;
    wireframe2.material = wfMat;
    wireframe3.material = wfMat;
    terrain.material = terrainMat;
    terrain2.material = terrainMat;
    terrain3.material = terrainMat;

    let box = new THREE.Box3().setFromObject(road);
    let boxSize = new THREE.Vector3();
    box.getSize(boxSize);
    roadLength = boxSize.z;

    road2.position.z -= roadLength;
    road3.position.z -= roadLength * 2;

    scene.add(road);
    scene.add(road2);
    scene.add(road3);

    planeTrain.push(road);
    planeTrain.push(road2);
    planeTrain.push(road3);

    render();
  });

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild(renderer.domElement);

  //

  stats1 = new Stats();
  stats1.showPanel(0); // Panel 0 = fps
  stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;";
  container.appendChild(stats1.domElement);

  stats2 = new Stats();
  stats2.showPanel(1); // Panel 1 = ms
  stats2.domElement.style.cssText = "position:absolute;top:0px;left:80px;";
  container.appendChild(stats2.domElement);

  stats3 = new Stats();
  stats3.showPanel(2); // Panel 2 = mb
  stats3.domElement.style.cssText = "position:absolute;top:0px;left:160px;";
  container.appendChild(stats3.domElement);

  // new THREE.OrbitControls(camera, renderer.domElement);

  // const gui = new GUI();
  // gui.add(options, "rotX", -Math.PI, Math.PI, Math.PI / 18).onChange((val) => {
  //   plane.rotation.x = val;
  // });

  //

  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture }
      },
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader(),
      defines: {}
    }),
    "baseTexture"
  );
  finalPass.needsSwap = true;

  finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function moveRoads() {
  let step = 0.03;

  planeTrain.forEach((plane) => {
    plane.position.z += step;
  });

  if (planeTrain.length > 1 && planeTrain[0].position.z >= roadLength + 12) {
    let plane = planeTrain.shift();
    plane.position.z = planeTrain[1].position.z - roadLength;
    planeTrain.push(plane);
  }
}

function animate() {
  requestAnimationFrame(render);

  stats1.update();
  stats2.update();
  stats3.update();

  moveRoads();
}

function render() {
  animate();

  // renderer.render(scene, camera);

  // render scene with bloom
  renderBloom(true);

  // render the entire scene, then render bloom scene on top
  finalComposer.render();
}

function renderBloom(mask) {
  if (mask === true) {
    scene.traverse(darkenNonBloomed);
    bloomComposer.render();
    scene.traverse(restoreMaterial);
  } else {
    camera.layers.set(BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(ENTIRE_SCENE);
  }
}

function darkenNonBloomed(obj) {
  if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}

function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}
