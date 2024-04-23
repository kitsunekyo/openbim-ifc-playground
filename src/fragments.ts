import * as OBC from "openbim-components";
import { createConsola } from "consola";

type StreamedGeometries = {
  assets: Array<{
    id: number;
    geometries: Array<{
      color: number[];
      geometryID: number;
      transformation: number[];
    }>;
  }>;
  geometries: {
    [id: number]: {
      boundingBox: Record<number, number>;
      hasHoles: boolean;
      geometryFile: string;
    };
  };
  globalDataFileId: string;
};

type StreamedProperties = {
  types: Record<number, number[]>;
  ids: Record<
    number,
    {
      boundingBox: Record<number, number>;
      hasHoles: boolean;
      geometryFile: string; // "url-to-geometry-file-in-your-backend";
    }
  >;
  indexesFile: string; // "url-to-indexes-file-in-your-backend";
};

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
  const streamer = new OBC.FragmentIfcStreamConverter(new OBC.Components());
  streamer.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.51/",
    absolute: true,
  };

  const streamedGeometries: StreamedGeometries = {
    assets: [],
    geometries: {},
    // TODO: ??? where do i get the group file
    globalDataFileId: "url-to-fragments-group-file-in-your-backend",
  };

  const geometryFiles: { file: Uint8Array; name: string }[] = [];

  streamer.onGeometryStreamed.add((geometry) => {
    const fileName = `${crypto.randomUUID()}.ifc-geometry`;
    geometryFiles.push({
      file: geometry.buffer,
      name: fileName,
    });

    for (const id in geometry.data) {
      const geometryData = geometry.data[id];
      streamedGeometries.geometries[id] = {
        boundingBox: geometryData.boundingBox,
        hasHoles: geometryData.hasHoles,
        geometryFile: fileName,
      };
    }
  });

  streamer.onAssetStreamed.add((assets) => {
    logger.log("onAssetsStreamed", assets);
  });

  streamer.onIfcLoaded.add(async (groupBuffer) => {
    logger.log("onIfcLoaded", groupBuffer);
  });

  const progressEl = document.getElementById("progress") as HTMLProgressElement;

  streamer.onProgress.add((value) => {
    progressEl.value = value * 100;
    if (value === 1) {
      handleStreamCompleted();
    }
  });

  function handleStreamCompleted() {
    logger.success("stream completed", geometryFiles, streamedGeometries);
  }

  streamer.streamFromBuffer(new Uint8Array(await file.arrayBuffer()));
}
