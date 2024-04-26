import * as OBC from "openbim-components";
import { createConsola } from "consola/browser";

const WEB_IFC_WASM = "https://unpkg.com/web-ifc@0.0.53/";

type GeometryPartFileId = `${string}.ifc-processed-geometries-${number}`;
type GlobalDataFileId = `${string}.ifc-processed-global`;
type IfcProcessedFileId = `${string}.ifc-processed.json`;

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
      geometryFile: GeometryPartFileId;
    };
  };
  globalDataFileId: GlobalDataFileId;
};

const logger = createConsola({
  defaults: {
    tag: "ifc",
  },
});

async function createWriter(fileUUID: string) {
  const directoryHandle = await window.showDirectoryPicker({
    startIn: "downloads",
    mode: "readwrite",
  });
  const serveDirectoryHandle = await directoryHandle.getDirectoryHandle(
    "serve",
    { create: true },
  );
  const ifcDirectoryHandle = await serveDirectoryHandle.getDirectoryHandle(
    fileUUID,
    {
      create: true,
    },
  );

  return async function writeFile(
    data: FileSystemWriteChunkType,
    fileName: string,
  ) {
    const fileHandle = await ifcDirectoryHandle.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  };
}

export async function convertToStreamable(ifcFile: File) {
  const fileName = ifcFile.name.replace(/\s/g, "_");
  const fileUUID = crypto.randomUUID();
  const writeFile = await createWriter(fileUUID);

  const converter = new OBC.FragmentIfcStreamConverter(new OBC.Components());
  converter.settings.wasm = {
    path: WEB_IFC_WASM,
    absolute: true,
  };

  const streamedGeometries: StreamedGeometries = {
    assets: [],
    geometries: {},
    globalDataFileId: `${fileName}.ifc-processed-global`,
  };

  let geometryIndex = 0;

  converter.onGeometryStreamed.add(async ({ buffer, data }) => {
    const geometryFileId: GeometryPartFileId = `${fileName}.ifc-processed-geometries-${geometryIndex}`;
    await writeFile(buffer, geometryFileId);

    for (const id in data) {
      streamedGeometries.geometries[id] = {
        boundingBox: data[id].boundingBox,
        hasHoles: data[id].hasHoles,
        geometryFile: geometryFileId,
      };
    }

    geometryIndex++;
  });

  converter.onAssetStreamed.add((assets) => {
    for (const asset of assets) {
      streamedGeometries.assets.push({
        id: asset.id,
        geometries: asset.geometries,
      });
    }
  });

  converter.onIfcLoaded.add(async (globalFile) => {
    await writeFile(globalFile, streamedGeometries.globalDataFileId);
    await writeFile(
      JSON.stringify(streamedGeometries),
      `${fileName}.ifc-processed.json` satisfies IfcProcessedFileId,
    );

    logger.success("onIfcLoaded complete");
    logger.info("streamedGeometries", streamedGeometries);

    const infoEl = document.getElementById("info") as HTMLDivElement;
    if (!infoEl) {
      throw new Error('Element with id "info" not found');
    }
    infoEl.innerHTML = `
      <p>Files generated! Replace <code>MODEL_UUID</code> and <code>MODEL_NAME</code> in <code>src/viewer.ts</code></p>
      <pre>
        const MODEL_UUID = "${fileUUID}";
        const MODEL_NAME = "${fileName}";
      </pre>
    `;
  });

  const progressEl = document.getElementById("progress") as HTMLProgressElement;
  if (!progressEl) {
    throw new Error('Element with id "progress" not found');
  }

  converter.onProgress.add((value) => {
    progressEl.value = value * 100;
    if (value === 1) {
      logger.success("progress 100%");
    }
  });

  converter.streamFromBuffer(new Uint8Array(await ifcFile.arrayBuffer()));
}
