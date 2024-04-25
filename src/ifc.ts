import * as OBC from "openbim-components";
import { createConsola } from "consola/browser";
import { createTar } from "nanotar";

type GeometryPartFileId = `${string}.ifc-processed-geometries-${number}`;
type GlobalDataFileId = `${string}.ifc-processed-global`;

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

type StreamedProperties = {
  types: Record<number, number[]>;
  ids: Record<
    number,
    {
      boundingBox: Record<number, number>;
      hasHoles: boolean;
      // geometryFile: string; // "url-to-geometry-file-in-your-backend"; -> this is incorrectly documented and doesnt exist
    }
  >;
  indexesFile: string; // "url-to-indexes-file-in-your-backend";
};

const logger = createConsola({
  defaults: {
    tag: "ifc",
  },
});

export async function convertToStreamable(ifcFile: File) {
  const fileUUID = crypto.randomUUID();
  logger.log("converting", performance.now());
  const streamer = new OBC.FragmentIfcStreamConverter(new OBC.Components());
  streamer.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.53/",
    absolute: true,
  };

  const streamedGeometries: StreamedGeometries = {
    assets: [],
    geometries: {},
    globalDataFileId: `${fileUUID}.ifc-processed-global`,
  };

  const geometryFiles: {
    content: Uint8Array;
    name: GeometryPartFileId | GlobalDataFileId;
    originalName: string;
  }[] = [];

  let geometryIndex = 0;

  streamer.onGeometryStreamed.add(({ buffer, data }) => {
    logger.log("onGeometryStreamed", performance.now());

    const geometryFileId: GeometryPartFileId = `${fileUUID}.ifc-processed-geometries-${geometryIndex}`;

    geometryFiles.push({
      content: buffer,
      name: geometryFileId,
      originalName: ifcFile.name,
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

  streamer.onAssetStreamed.add((assets) => {
    logger.log("onAssetsStreamed", performance.now());

    for (const asset of assets) {
      streamedGeometries.assets.push({
        id: asset.id,
        geometries: asset.geometries,
      });
    }
  });

  streamer.onIfcLoaded.add(async (globalFile) => {
    logger.log("onIfcLoaded", performance.now());

    geometryFiles.push({
      name: streamedGeometries.globalDataFileId,
      content: globalFile,
      originalName: ifcFile.name,
    });

    logger.success("onIfcLoaded complete", performance.now());
    logger.info("geometryFiles", geometryFiles);
    logger.info("streamedGeometries", streamedGeometries);

    const tar = createTar(
      geometryFiles.map(({ content, name, originalName }) => ({
        name: `${originalName}/${name}`,
        data: content,
      })),
    );

    await saveFile(new Blob([tar]), `${ifcFile.name}.tar`);
  });

  const progressEl = document.getElementById("progress") as HTMLProgressElement;
  if (!progressEl) {
    throw new Error('Element with id "progress" not found');
  }

  streamer.onProgress.add((value) => {
    progressEl.value = value * 100;
    if (value === 1) {
      logger.success("progress 100%", performance.now());
    }
  });

  streamer.streamFromBuffer(new Uint8Array(await ifcFile.arrayBuffer()));
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
