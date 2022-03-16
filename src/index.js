import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Wireframe } from "three/examples/jsm/lines/Wireframe.js";
import { WireframeGeometry2 } from "three/examples/jsm/lines/WireframeGeometry2.js";
global.THREE = THREE;

require("three/examples/js/controls/OrbitControls");
const { GUI } = require("dat.gui");

let container, stats1, stats2, stats3;

let camera, scene, renderer;

let geometry, material, road, road2, road3, roadLength, roadStartZ, wireframe;

let planeTrain = [];

let options = {
  rotX: 0
};

init();
render();

// function vertexShader() {
//   return `
//     void main() {
//       vec3 p = position;

//       vec2 summit = vec2(5.0, 5.0);
//       float distance = sqrt(pow(abs(p.x - 0.0), 2.0) + pow(abs(p.y - 0.0), 2.0));
//       if(distance > 4.0) {
//         p.z = 0.0;
//       } else {
//         p.z = pow((5.0 - distance)/2.0, 2.0);
//       }

//       vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
//       gl_Position = projectionMatrix * mvPosition;
//     }
//   `;
// }

// function fragmentShader() {
//   return `
//     void main() {
//       vec3 color = vec3(1.0, 1.0, 0.0);
//       gl_FragColor = vec4(color, 1.0);
//     }
//   `;
// }

// function planeToGrid(geometry) {
//   let segmentsX = 49;
//   let segmentsY = 289;
//   let indices = [];
//   for (let i = 0; i < segmentsY + 1; i++) {
//     let index11 = 0;
//     let index12 = 0;
//     for (let j = 0; j < segmentsX; j++) {
//       index11 = (segmentsX + 1) * i + j;
//       index12 = index11 + 1;
//       let index21 = index11;
//       let index22 = index11 + (segmentsX + 1);
//       indices.push(index11, index12);
//       if (index22 < (segmentsX + 1) * (segmentsY + 1) - 1) {
//         indices.push(index21, index22);
//       }
//     }
//     if (index12 + segmentsX + 1 <= (segmentsX + 1) * (segmentsY + 1) - 1) {
//       indices.push(index12, index12 + segmentsX + 1);
//     }
//   }
//   geometry.setIndex(indices);
//   return geometry;
// }

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

  // Object.assign(THREE.PlaneBufferGeometry.prototype, {
  //   toGrid: function () {
  //     let segmentsX = this.parameters.widthSegments || 1;
  //     let segmentsY = this.parameters.heightSegments || 1;
  //     let indices = [];
  //     for (let i = 0; i < segmentsY + 1; i++) {
  //       let index11 = 0;
  //       let index12 = 0;
  //       for (let j = 0; j < segmentsX; j++) {
  //         index11 = (segmentsX + 1) * i + j;
  //         index12 = index11 + 1;
  //         let index21 = index11;
  //         let index22 = index11 + (segmentsX + 1);
  //         indices.push(index11, index12);
  //         if (index22 < (segmentsX + 1) * (segmentsY + 1) - 1) {
  //           indices.push(index21, index22);
  //         }
  //       }
  //       if (index12 + segmentsX + 1 <= (segmentsX + 1) * (segmentsY + 1) - 1) {
  //         indices.push(index12, index12 + segmentsX + 1);
  //       }
  //     }
  //     this.setIndex(indices);
  //     return this;
  //   }
  // });

  // const loader = new THREE.TextureLoader();
  // const texture = loader.load("src/terrain_2.jpeg");

  // geometry = new THREE.PlaneBufferGeometry(10, 10, 10, 10);
  // material = new THREE.MeshStandardMaterial({
  //   color: 0x0000ff,
  //   wireframe: true,
  //   polygonOffset: true,
  //   polygonOffsetFactor: 1, // positive value pushes polygon further away
  //   polygonOffsetUnits: 1,
  //   displacementMap: texture
  // });
  // const plane = new THREE.Mesh(geometry, material);
  // scene.add(plane);
  // plane.scale.z = 4;
  // plane.rotation.x = -Math.PI / 2;

  // wireframe
  // var gridPlane = new THREE.LineSegments(
  //   new THREE.PlaneBufferGeometry(10, 10, 10, 10).toGrid(),
  //   new THREE.ShaderMaterial({
  //     vertexShader: vertexShader(),
  //     fragmentShader: fragmentShader()
  //   })
  // );
  // gridPlane.rotation.x = -Math.PI / 2.5;
  // scene.add(gridPlane);

  const gltf_loader = new GLTFLoader();
  gltf_loader.load("src/synthroad.glb", (gltf) => {
    road = gltf.scene;
    road2 = road.clone();
    road3 = road.clone();

    // plane = root.getObjectByName("Plane");
    // wireframe = root.getObjectByName("Wireframe");

    // wireframe.material = new THREE.MeshBasicMaterial({ color: "#FF0000" });

    let box = new THREE.Box3().setFromObject(road);
    let boxSize = new THREE.Vector3();
    box.getSize(boxSize);
    roadLength = boxSize.z;
    roadStartZ = 0; // since the object origin is initially at z:0
    // console.log(box.min, box.max, boxSize);

    road2.position.z -= roadLength;
    road3.position.z -= roadLength * 2;

    scene.add(road);
    scene.add(road2);
    scene.add(road3);

    // console.log(road.position.z)

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
