import * as THREE from "three";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

let camera;
let renderer, bloomComposer, finalComposer;
let deke;

init();

async function init() {
  const container = document.getElementById("container");
  const scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    100
  );
  camera.position.set(0, 0, 4);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xcccccc));

  const pointLight = new THREE.PointLight(0xffffff, 100);
  //   camera.add(pointLight);

  const ambiant = new THREE.AmbientLight();
  //   scene.add(ambiant);

  const name = "DEKE";

  const mtlLoader = new MTLLoader();
  mtlLoader.load(
    `./assets/models/${name}.mtl`,
    (mtl) => {
      mtl.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(mtl);
      objLoader.load(
        `./assets/models/${name}.obj`,
        (obj) => {
          deke = obj.children[0];
          deke.rotation.x = Math.PI / 2;
          deke.position.y = 1;
          //   deke.scale.x = 2
          scene.add(deke);
        },
        (xhr) => {},
        (error) => console.error(error)
      );
    },
    (xhr) =>
      console.log(
        `${name} material ` + (xhr.loaded / xhr.total) * 100 + "% loaded"
      ),
    (error) => console.error(error)
  );

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = Math.pow(1.5, 4.0);
  container.appendChild(renderer.domElement);

  //

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2,
    1,
    0
  );

  const renderScene = new RenderPass(scene, camera);

  bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: document.getElementById("vertexshader").textContent,
      fragmentShader: document.getElementById("fragmentshader").textContent,
      defines: {},
    }),
    "baseTexture"
  );
  mixPass.needsSwap = true;

  const outputPass = new OutputPass();

  finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(mixPass);
  finalComposer.addPass(outputPass);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function render() {
  bloomComposer.render();
  finalComposer.render();
}

let count = 0;

function animate(time) {
  if (count > 0) {
    count--;
    renderer.toneMappingExposure = Math.pow(1.1, 4.0);
  } else {
    renderer.toneMappingExposure = Math.pow(1.2, 4.0);
  }
  if (deke) {
    deke.rotation.z = time / 5000;
    camera.lookAt(deke.position);

    if (Math.floor(Math.random() * 150) === 0) {
      count = 10;
    }
  }
  render();
}
