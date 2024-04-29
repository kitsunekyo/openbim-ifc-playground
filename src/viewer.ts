import * as OBC from "openbim-components";
import * as THREE from "three";

const BASE_URL = "http://localhost:8888";
const MODEL_UUID = import.meta.env.VITE_MODEL_UUID;
const MODEL_NAME = import.meta.env.VITE_MODEL_NAME;

if (!MODEL_UUID || !MODEL_NAME) {
  throw new Error("MODEL_UUID and MODEL_NAME must be set in .env");
}

const MODEL_URL = `${BASE_URL}/${MODEL_UUID}`;

/**
 * @param path - path to the *.ifc-processed.json file
 */
async function loadModel(loader: OBC.FragmentStreamLoader, path: string) {
  const streamLoaderSettings = await fetch(path).then((res) => res.json());
  loader.load(streamLoaderSettings);
}

export function initializeViewer() {
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
  loader.url = `${MODEL_URL}/`;
  loader.culler.threshold = 20;
  loader.culler.maxHiddenTime = 1000;
  loader.culler.maxLostTime = 40000;

  loadModel(loader, `${MODEL_URL}/${MODEL_NAME}.ifc-processed.json`);
}

initializeViewer();

/**
 * DOM rendering.
 */

export function render() {
  const startButtonEl = document.getElementById(
    "startButton",
  ) as HTMLButtonElement;

  if (!startButtonEl) {
    throw new Error('Element with id "startButton" not found');
  }

  startButtonEl.addEventListener("click", () => initializeViewer());
}
