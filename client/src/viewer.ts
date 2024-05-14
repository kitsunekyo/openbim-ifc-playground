import * as OBC from "openbim-components";
import * as THREE from "three";

const SERVER_BASE_URL = "http://localhost:3000/files/models";

export async function initializeViewer(modelId: string) {
  const modelUrl = `${SERVER_BASE_URL}/${modelId}`;
  const viewerContainer = document.getElementById("viewerContainer");
  if (!viewerContainer) {
    throw new Error('Element with id "viewerContainer" not found');
  }

  viewerContainer.innerHTML = "";

  const viewerEl = document.createElement("div");
  viewerEl.style.width = "800px";
  viewerEl.style.height = "500px";
  viewerEl.style.backgroundColor = "#ddd";

  viewerContainer.appendChild(viewerEl);

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
  loader.url = `${modelUrl}/`; // implicitly loads ifc-processed-global and ifc-processed-geometries-0 files from this url
  loader.culler.threshold = 20;
  loader.culler.maxHiddenTime = 1000;
  loader.culler.maxLostTime = 40000;

  const settingsUrl = `${modelUrl}/ifc-processed.json`;
  const streamLoaderSettings = await fetch(settingsUrl).then((res) =>
    res.json()
  );

  loader.load(streamLoaderSettings);

  return components;
}
