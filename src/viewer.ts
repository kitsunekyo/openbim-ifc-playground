import * as OBC from "openbim-components";
import * as THREE from "three";

const SERVER_URL = "http://localhost:8888";

// replace these values to load different models
const MODEL_UUID = "f5cac56e-297f-42e9-ab61-98c8722b553a";
const MODEL_NAME = "TESTED_Simple_project_01.ifc";

const BASE_URL = `${SERVER_URL}/${MODEL_UUID}`;

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
  scene.setup(); // adds lights

  components.renderer = new OBC.SimpleRenderer(components, viewerEl);
  components.raycaster = new OBC.SimpleRaycaster(components);

  const camera = new OBC.SimpleCamera(components);
  camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
  camera.controls.addEventListener("controlend", () => {
    loader.culler.needsUpdate = true;
  });
  components.camera = camera;

  new OBC.SimpleGrid(components, new THREE.Color(0x666666)); // has to be loaded after camera

  components.init();

  const loader = new OBC.FragmentStreamLoader(components);
  loader.useCache = true;
  loader.url = `${BASE_URL}/`;
  loader.culler.threshold = 20;
  loader.culler.maxHiddenTime = 1000;
  loader.culler.maxLostTime = 40000;

  loadModel(loader, `${BASE_URL}/${MODEL_NAME}.ifc-processed.json`);
}
