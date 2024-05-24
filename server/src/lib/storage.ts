import path from "node:path";
import fs from "node:fs/promises";
import { createGeometryTiler, createPropertyTiler } from "./tiles";
import { prisma } from "./db";

const STORAGE_DIR = path.join(__dirname, "../../storage");

export const BINARY_FILES_REGEX =
  /(ifc-processed-geometries-[0-9]+|ifc-processed-global)/;
export const JSON_FILES_REGEX =
  /(ifc-processed-properties-[0-9]+|ifc-processed-properties-indexes)/;

export async function generateTiles(ifcFile: File, conversionId: string) {
  const sourceFileName = ifcFile.name.replace(/\s/g, "_");

  const config = {
    id: conversionId,
    outdir: path.join(STORAGE_DIR, conversionId),
  };

  await fs.mkdir(config.outdir, { recursive: true });
  await fs.writeFile(
    path.join(config.outdir, sourceFileName),
    Buffer.from(await ifcFile.arrayBuffer())
  );

  await prisma.iFCModel.create({
    data: {
      id: conversionId,
      name: sourceFileName,
      geometries_progress: 0,
      properties_progress: 0,
    },
  });

  const propertyTiler = createPropertyTiler({
    onProgress: async (v) => {
      await prisma.iFCModel.update({
        where: {
          id: config.id,
        },
        data: {
          properties_progress: v,
        },
      });
    },
    onCompleted: async ({ settingsFile, indexesFile }) => {
      const writeSettingsFile = fs.writeFile(
        path.join(config.outdir, settingsFile.name),
        JSON.stringify(settingsFile.data)
      );

      const indexesFileIdWithExtension = indexesFile.name.replace(
        JSON_FILES_REGEX,
        "$1.json"
      );

      const writeIndexesFile = fs.writeFile(
        path.join(config.outdir, indexesFileIdWithExtension),
        indexesFile.data
      );

      Promise.all([writeSettingsFile, writeIndexesFile])
        .then(() => {
          console.log("Properties files written");
        })
        .catch(() => console.log("Error writing properties files"));
    },
    onPropertiesStreamed: async (propertiesFile) => {
      const tileFileIdWithExtension = propertiesFile.name.replace(
        BINARY_FILES_REGEX,
        "$1.bin"
      );

      fs.writeFile(
        path.join(config.outdir, tileFileIdWithExtension),
        Buffer.from(propertiesFile.data)
      )
        .then(() => console.log(`Wrote file ${tileFileIdWithExtension}`))
        .catch(() =>
          console.log(`Error writing file ${tileFileIdWithExtension}`)
        );
    },
  });

  const geometryTiler = createGeometryTiler({
    onProgress: async (v) => {
      await prisma.iFCModel.update({
        where: {
          id: config.id,
        },
        data: {
          geometries_progress: v,
        },
      });
    },
    onCompleted: ({ settingsFile, globalFile }) => {
      const writeSettingsFile = fs.writeFile(
        path.join(config.outdir, settingsFile.name),
        JSON.stringify(settingsFile.data)
      );

      const globalDataFileIdWithExtension = globalFile.name.replace(
        BINARY_FILES_REGEX,
        "$1.bin"
      );
      const writeGlobalFile = fs.writeFile(
        path.join(config.outdir, globalDataFileIdWithExtension),
        Buffer.from(globalFile.data)
      );

      Promise.all([writeSettingsFile, writeGlobalFile])
        .then(() => {
          console.log("Geometry files written");
        })
        .catch(() => console.log("Error writing geometry files"));
    },
    onGeometryStreamed: async (geometryFile) => {
      const sanitizedTileFileId = geometryFile.name.replace(
        BINARY_FILES_REGEX,
        "$1.bin"
      );

      fs.writeFile(
        path.join(config.outdir, sanitizedTileFileId),
        Buffer.from(geometryFile.data)
      )
        .then(() => console.log(`Wrote file ${sanitizedTileFileId}`))
        .catch(() => console.log(`Error writing file ${sanitizedTileFileId}`));
    },
  });

  await Promise.all([
    geometryTiler.streamFromBuffer(new Uint8Array(await ifcFile.arrayBuffer())),
    propertyTiler.streamFromBuffer(new Uint8Array(await ifcFile.arrayBuffer())),
  ]);
}

export async function deleteModelFolder(id: string) {
  return fs.rm(path.join(STORAGE_DIR, id), {
    recursive: true,
  });
}
