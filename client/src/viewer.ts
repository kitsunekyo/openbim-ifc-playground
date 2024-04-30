import * as OBC from "openbim-components";
import * as THREE from "three";

const STORAGE = import.meta.env.VITE_STORAGE || "server";
let SERVER_BASE_URL = "http://localhost:3000/files/models";
if (STORAGE === "local") {
  SERVER_BASE_URL = "http://localhost:8888";
}

const MODEL_UUID = import.meta.env.VITE_MODEL_UUID;
if (!MODEL_UUID) {
  throw new Error("MODEL_UUID must be set in .env");
}

const MODEL_URL = `${SERVER_BASE_URL}/${MODEL_UUID}`;

export async function initializeViewer() {
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
  loader.url = `${MODEL_URL}/`; // implicitly loads ifc-processed-global and ifc-processed-geometries-0 files from this url
  loader.culler.threshold = 20;
  loader.culler.maxHiddenTime = 1000;
  loader.culler.maxLostTime = 40000;

  const settingsUrl = `${MODEL_URL}/ifc-processed.json`;
  const streamLoaderSettings = await fetch(settingsUrl).then((res) =>
    res.json()
  );

  loader.load(streamLoaderSettings);
}

initializeViewer();

/**
 * DOM rendering.
 */

export function render() {
  const startButtonEl = document.getElementById(
    "startButton"
  ) as HTMLButtonElement;

  if (!startButtonEl) {
    throw new Error('Element with id "startButton" not found');
  }

  startButtonEl.addEventListener("click", () => initializeViewer());
}
