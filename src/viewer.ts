import * as OBC from "openbim-components";
import * as THREE from "three";

const MODEL_PATH = "http://localhost:3000/TESTED_Simple_project_01.ifc/";
const MODEL_UUID = "1baa82a7-0388-49f5-bb9e-4d4791c4a30f";

/**
 * @param path - path to the *.ifc-processed.json file
 */
async function loadModel(loader: OBC.FragmentStreamLoader, path: string) {
  const streamLoaderSettings = await fetch(path).then((res) => res.json());
  loader.load(streamLoaderSettings);
}

export function start() {
  const viewerEl = document.getElementById("viewerRoot");

  if (!viewerEl) {
    throw new Error('Element with id "viewerRoot" not found');
  }

  const components = new OBC.Components();
  const scene = new OBC.SimpleScene(components);
  components.scene = scene;
  components.renderer = new OBC.SimpleRenderer(components, viewerEl);
  const camera = new OBC.SimpleCamera(components);
  components.camera = camera;
  components.raycaster = new OBC.SimpleRaycaster(components);
  new OBC.SimpleGrid(components, new THREE.Color(0x666666));

  camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

  const loader = new OBC.FragmentStreamLoader(components);
  loader.useCache = true;
  loader.url = MODEL_PATH;

  camera.controls.addEventListener("controlend", () => {
    loader.culler.needsUpdate = true;
  });

  loader.culler.threshold = 20;
  loader.culler.maxHiddenTime = 1000;
  loader.culler.maxLostTime = 40000;

  components.init();
  scene.setup(); // add lights

  loadModel(loader, `${MODEL_PATH}${MODEL_UUID}.ifc-processed.json`);
}
