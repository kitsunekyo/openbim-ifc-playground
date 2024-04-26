import * as OBC from "openbim-components";
import * as THREE from "three";

const SERVER_URL = "http://localhost:8080/";
const MODEL_UUID = "f2c30224-b175-409b-b8fb-94f76d8a75f4";
const MODEL_NAME = "200226_FH2_Tragwerk_IFC4_Design.ifc";
const BASE_URL = `${SERVER_URL}/${MODEL_UUID}/`;

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
  loader.url = BASE_URL;

  camera.controls.addEventListener("controlend", () => {
    loader.culler.needsUpdate = true;
  });

  loader.culler.threshold = 20;
  loader.culler.maxHiddenTime = 1000;
  loader.culler.maxLostTime = 40000;

  components.init();
  scene.setup(); // adds lights

  loadModel(loader, `${BASE_URL}/${MODEL_NAME}.ifc-processed.json`);
}
