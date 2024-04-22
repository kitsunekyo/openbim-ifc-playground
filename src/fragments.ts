import * as OBC from "openbim-components";
import { createConsola } from "consola";

interface StreamedGeometries {
  assets: {
    id: number;
    geometries: {
      color: number[];
      geometryID: number;
      transformation: number[];
    }[];
  }[];
  geometries: {
    [id: number]: {
      boundingBox: { [id: number]: number };
      hasHoles: boolean;
      geometryFile: "url-to-geometry-file-in-your-backend";
    };
  };
  globalDataFileId: "url-to-fragments-group-file-in-your-backend";
}

const logger = createConsola({
  defaults: {
    tag: "fragment",
  },
});

export function setup() {
  const formEl = document.getElementById("ifcForm") as HTMLFormElement;
  if (!formEl) {
    return;
  }
  const inputEl = document.getElementById("fileInput") as HTMLInputElement;
  if (!inputEl) {
    return;
  }

  formEl.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();
    const file = inputEl.files?.[0];
    logger.log(file);
    if (!file) {
      return;
    }
    convert(file);
  });
}

async function convert(file: File) {
  logger.log("converting");
  const ifcBuffer = await file.arrayBuffer();

  const components = new OBC.Components();

  const streamer = new OBC.FragmentIfcStreamConverter(components);
  streamer.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.51/",
    absolute: true,
  };

  streamer.onGeometryStreamed.add((geometry) => {
    logger.success("onGeometryStreamed", geometry);
  });

  streamer.onAssetStreamed.add((assets) => {
    logger.success("onAssetsStreamed", assets);
  });

  streamer.onIfcLoaded.add(async (groupBuffer) => {
    logger.success("onIfcLoaded", groupBuffer);
  });

  streamer.onProgress.add((progress) => {
    logger.log("progress", progress);
  });

  streamer.streamFromBuffer(new Uint8Array(ifcBuffer));

  // streaming properties
  /*
  const propsStreamer = new OBC.FragmentPropsStreamConverter(components);
  propsStreamer.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.51/",
    absolute: true,
  };

  propsStreamer.onPropertiesStreamed.add(async (props) => {
    logger.log("onPropertiesStreamed", props);
  });

  propsStreamer.onProgress.add(async (progress) => {
    logger.log("props progress", progress);
  });

  propsStreamer.onIndicesStreamed.add(async (props) => {
    logger.log("onIndicesStreamed", props);
  });

  streamer.streamFromBuffer(new Uint8Array(ifcBuffer));
  */
}
