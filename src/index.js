import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
global.THREE = THREE;

require("three/examples/js/controls/OrbitControls");
const { GUI } = require("dat.gui");

let container, stats1, stats2, stats3;

let camera, scene, renderer;

let road, road2, road3, roadLength, wireframe;

let planeTrain = [];

let options = {
  rotX: 0
};

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
  scene.background = new THREE.Color(0x555555);

  //

  scene.add(new THREE.AmbientLight(0x444444));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-30, 30, 60);
  scene.add(dirLight);

  //

  const gltf_loader = new GLTFLoader();
  gltf_loader.load("src/synthroad.glb", (gltf) => {
    road = gltf.scene;
    road2 = road.clone();
    road3 = road.clone();

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

  new THREE.OrbitControls(camera, renderer.domElement);

  // const gui = new GUI();
  // gui.add(options, "rotX", -Math.PI, Math.PI, Math.PI / 18).onChange((val) => {
  //   plane.rotation.x = val;
  // });

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

  renderer.render(scene, camera);
}
