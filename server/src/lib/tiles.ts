import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";

const STORAGE_DIR = path.join(__dirname, "/../../storage");

type GeometryTileFileId = `ifc-processed-geometries-${number}`;
type GeometryGlobalFileId = "ifc-processed-global";
type GeometrySettingsFileId = "ifc-processed.json";

// todo: previously StreamLoaderSettings - not yet exported in new pkg. so we have to create our own
type GeometrySettings = {
  assets: Array<{
    id: number;
    geometries: Array<{
      color: number[];
      geometryID: number;
      transformation: number[];
    }>;
  }>;
  geometries: Record<
    number,
    {
      boundingBox: { [id: number]: number };
      hasHoles: boolean;
      geometryFile: GeometryTileFileId;
    }
  >;
  globalDataFileId: GeometryGlobalFileId;
};

export const BINARY_FILES_REGEX =
  /(ifc-processed-geometries-[0-9]+|ifc-processed-global)/;

export async function generateTiles(ifcFile: File, conversionId: string) {
  const sourceFileName = ifcFile.name.replace(/\s/g, "_");

  await prisma.iFCModel.create({
    data: {
      id: conversionId,
      name: sourceFileName,
      geometries_progress: 0,
      properties_progress: 0,
    },
  });

  const config = {
    id: conversionId,
    outdir: path.join(STORAGE_DIR, conversionId),
  };

  await fs.mkdir(config.outdir, { recursive: true }).catch((error) => {
    console.error("Error creating conversion directory", error);
  });

  await fs
    .writeFile(
      path.join(config.outdir, sourceFileName),
      Buffer.from(await ifcFile.arrayBuffer())
    )
    .catch((error) => {
      console.error("Error writing ifc file", error);
    });

  await Promise.all([
    generateGeometryTiles(ifcFile, config),
    generatePropertyTiles(ifcFile, config),
  ]).catch((error) => {
    console.error("Error generating tiles", error);
  });

  return {
    conversionId,
    sourceFileName,
  };
}

async function generateGeometryTiles(
  ifcFile: File,
  config: {
    id: string;
    outdir: string;
  }
) {
  const geometryTiler = new OBC.IfcGeometryTiler(new OBC.Components());
  geometryTiler.settings.excludedCategories.add(WEBIFC.IFCSPACE);
  geometryTiler.settings.wasm.logLevel = WEBIFC.LogLevel.LOG_LEVEL_ERROR;
  // geometryTiler.settings.autoSetWasm = true; // automatically resolves wasm version from package.json
  geometryTiler.settings.webIfc = {
    // MEMORY_LIMIT: 2147483648, // default: 2GB
    COORDINATE_TO_ORIGIN: true,
    OPTIMIZE_PROFILES: true,
  };

  geometryTiler.settings.minAssetsSize = 1000;
  geometryTiler.settings.minGeometrySize = 20;

  const settings: GeometrySettings = {
    assets: [],
    geometries: {},
    globalDataFileId: "ifc-processed-global",
  };

  let fileIndex = 0;

  geometryTiler.onGeometryStreamed.add(async ({ buffer, data }) => {
    const tileFileId: GeometryTileFileId = `ifc-processed-geometries-${fileIndex}`;

    for (const id in data) {
      settings.geometries[id] = {
        boundingBox: data[id].boundingBox,
        hasHoles: data[id].hasHoles,
        geometryFile: tileFileId,
      };
    }

    // we write to disk with .bin extension so the mime-type in the response is correct
    const sanitizedTileFileId = tileFileId.replace(
      BINARY_FILES_REGEX,
      "$1.bin"
    );

    fs.writeFile(
      path.join(config.outdir, sanitizedTileFileId),
      Buffer.from(buffer)
    )
      .then(() => console.log(`Wrote file ${tileFileId}`))
      .catch(() => console.log(`Error writing file ${tileFileId}`));

    fileIndex++;
  });

  geometryTiler.onAssetStreamed.add(async (assets) => {
    for (const asset of assets) {
      settings.assets.push({
        id: asset.id,
        geometries: asset.geometries,
      });
    }
  });

  geometryTiler.onIfcLoaded.add(async (data) => {
    const settingsFileId: GeometrySettingsFileId = "ifc-processed.json";
    const writeSettingsFile = fs.writeFile(
      path.join(config.outdir, settingsFileId),
      JSON.stringify(settings)
    );

    // we write to disk with .bin extension so the mime-type in the response is correct
    const globalFileId = settings.globalDataFileId.replace(
      BINARY_FILES_REGEX,
      "$1.bin"
    );
    const writeGlobalFile = fs.writeFile(
      path.join(config.outdir, globalFileId),
      Buffer.from(data)
    );

    await Promise.all([writeSettingsFile, writeGlobalFile]).catch(() =>
      console.log("Error writing file")
    );
  });

  geometryTiler.onProgress.add(async (v) => {
    await prisma.iFCModel.update({
      where: {
        id: config.id,
      },
      data: {
        geometries_progress: v,
      },
    });
  });

  return geometryTiler.streamFromBuffer(
    new Uint8Array(await ifcFile.arrayBuffer())
  );
}

type PropertyTileFileId = `ifc-processed-properties-${number}`;
type PropertyIndexesFileId = "ifc-processed-properties-indexes";
type PropertySettingsFileId = "ifc-processed-properties.json";

type PropertySettings = {
  types: Record<number, number[]>;
  ids: Record<number, number>; // ? this differs from the docs
  indexesFile: PropertyIndexesFileId;
};

export const JSON_FILES_REGEX =
  /(ifc-processed-properties-[0-9]+|ifc-processed-properties-indexes)/;

async function generatePropertyTiles(
  ifcFile: File,
  config: {
    id: string;
    outdir: string;
  }
) {
  const components = new OBC.Components();
  const propsTiler = new OBC.IfcPropertiesTiler(components);

  const settings: PropertySettings = {
    types: {},
    ids: {},
    indexesFile: "ifc-processed-properties-indexes",
  };

  let fileIndex = 0;

  propsTiler.onPropertiesStreamed.add(async (props) => {
    if (!settings.types[props.type]) {
      settings.types[props.type] = [];
    }
    settings.types[props.type].push(fileIndex);

    for (const id in props.data) {
      settings.ids[id] = fileIndex;
    }

    const tileFileId: PropertyTileFileId = `ifc-processed-properties-${fileIndex}`;
    // we write to disk with .json extension so the mime-type in the response is correct
    const sanitizedTileFileId = tileFileId.replace(JSON_FILES_REGEX, "$1.json");

    fs.writeFile(
      path.join(config.outdir, sanitizedTileFileId),
      JSON.stringify(props.data)
    )
      .then(() => console.log(`Wrote file ${sanitizedTileFileId}`))
      .catch(() => console.log(`Error writing file ${sanitizedTileFileId}`));

    fileIndex++;
  });

  propsTiler.onProgress.add(async (v) => {
    await prisma.iFCModel.update({
      where: {
        id: config.id,
      },
      data: {
        properties_progress: v,
      },
    });
  });

  propsTiler.onIndicesStreamed.add(async (props) => {
    const settingsFileId: PropertySettingsFileId =
      "ifc-processed-properties.json";

    const writeSettingsFile = fs.writeFile(
      path.join(config.outdir, settingsFileId),
      JSON.stringify(settings)
    );

    const serializedRelations = components
      .get(OBC.IfcRelationsIndexer)
      .serializeRelations(props);
    const sanitizedIndexesFileId = settings.indexesFile.replace(
      JSON_FILES_REGEX,
      "$1.json"
    );

    const writeIndexesFile = fs.writeFile(
      path.join(config.outdir, sanitizedIndexesFileId), // ? might have to do a replace here if its json
      serializedRelations
    );

    await Promise.all([writeSettingsFile, writeIndexesFile]).catch(() =>
      console.log(`Error writing file`)
    );
  });

  await propsTiler.streamFromBuffer(
    new Uint8Array(await ifcFile.arrayBuffer())
  );
}

export async function deleteModel(id: string) {
  return fs.rm(path.join(STORAGE_DIR, id), {
    recursive: true,
  });
}
