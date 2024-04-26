import * as OBC from "openbim-components";
import { createConsola } from "consola/browser";
import { createTar } from "nanotar";

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

export async function convertToStreamable(ifcFile: File) {
  const fileUUID = crypto.randomUUID();
  const fileName = ifcFile.name.replace(/\s/g, "_");

  logger.log("converting");
  const converter = new OBC.FragmentIfcStreamConverter(new OBC.Components());
  converter.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.53/",
    absolute: true,
  };

  const streamedGeometries: StreamedGeometries = {
    assets: [],
    geometries: {},
    globalDataFileId: `${fileName}.ifc-processed-global`,
  };

  const geometryFiles: {
    content: Uint8Array;
    name: GeometryPartFileId | GlobalDataFileId;
  }[] = [];

  let geometryIndex = 0;

  converter.onGeometryStreamed.add(({ buffer, data }) => {
    logger.log("onGeometryStreamed");

    const geometryFileId: GeometryPartFileId = `${fileName}.ifc-processed-geometries-${geometryIndex}`;

    geometryFiles.push({
      content: buffer,
      name: geometryFileId,
    });

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
    logger.log("onAssetsStreamed");

    for (const asset of assets) {
      streamedGeometries.assets.push({
        id: asset.id,
        geometries: asset.geometries,
      });
    }
  });

  converter.onIfcLoaded.add(async (globalFile) => {
    logger.log("onIfcLoaded");

    geometryFiles.push({
      name: streamedGeometries.globalDataFileId,
      content: globalFile,
    });

    logger.success("onIfcLoaded complete");
    logger.info("geometryFiles", geometryFiles);
    logger.info("streamedGeometries", streamedGeometries);

    const tar = createTar([
      ...geometryFiles.map(({ content, name }) => ({
        name: `${fileUUID}/${name}`,
        data: content,
      })),
      {
        name: `${fileUUID}/${fileName}.ifc-processed.json` satisfies IfcProcessedFileId,
        data: JSON.stringify(streamedGeometries),
      },
    ]);

    await saveFile(new Blob([tar]), `${ifcFile.name}.tar`);
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

async function saveFile(blob: Blob, name?: string) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker#browser_compatibility
  // @ts-ignore
  const newHandle = await window.showSaveFilePicker({
    startIn: "downloads",
    suggestedName: name,
    types: [
      { description: "Tar archive", accept: { "application/x-tar": [".tar"] } },
    ],
  });
  const writableStream = await newHandle.createWritable();
  await writableStream.write(blob);
  await writableStream.close();
}
