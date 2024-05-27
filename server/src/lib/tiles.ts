import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

/**
 * I think everything in this file should be abstracted away
 * from the end user. The library is very opinionated about
 * file names and structure, so it should be handled internally.
 */

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

export function createGeometryTiler(config: {
  onProgress?: (v: number) => any;
  onGeometryStreamed: (geometryFile: {
    name: string;
    data: Uint8Array;
  }) => void;
  onCompleted: (payload: {
    settingsFile: { name: string; data: string };
    globalFile: { name: string; data: Uint8Array };
  }) => void;
}) {
  const { onProgress, onGeometryStreamed, onCompleted: onProcessed } = config;
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

    onGeometryStreamed({ name: tileFileId, data: buffer });

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
    onProcessed({
      settingsFile: {
        name: settingsFileId,
        data: JSON.stringify(settings),
      },
      globalFile: {
        name: settings.globalDataFileId,
        data,
      },
    });
  });

  if (onProgress) {
    geometryTiler.onProgress.add(onProgress);
  }

  return geometryTiler;
}

type PropertyTileFileId = `ifc-processed-properties-${number}`;
type PropertyIndexesFileId = "ifc-processed-properties-indexes";
type PropertySettingsFileId = "ifc-processed-properties.json";

type PropertySettings = {
  types: Record<number, number[]>;
  ids: Record<number, number>; // ? this differs from the docs
  indexesFile: PropertyIndexesFileId;
};

export function createPropertyTiler(config: {
  onProgress?: (v: number) => any;
  onPropertiesStreamed: (propertiesFile: {
    name: string;
    data: string;
  }) => void;
  onCompleted: (payload: {
    settingsFile: { name: string; data: string };
    indexesFile: { name: string; data: string };
  }) => void;
}) {
  const { onProgress, onPropertiesStreamed, onCompleted: onProcessed } = config;
  const components = new OBC.Components();
  const propsTiler = new OBC.IfcPropertiesTiler(components);

  const settings: PropertySettings = {
    types: {},
    ids: {},
    indexesFile: "ifc-processed-properties-indexes",
  };

  let fileIndex = 0;

  propsTiler.onPropertiesStreamed.add(async (props) => {
    const tileFileId: PropertyTileFileId = `ifc-processed-properties-${fileIndex}`;

    if (!settings.types[props.type]) {
      settings.types[props.type] = [];
    }
    settings.types[props.type].push(fileIndex);

    for (const id in props.data) {
      settings.ids[id] = fileIndex;
    }

    onPropertiesStreamed({
      name: tileFileId,
      data: JSON.stringify(props.data),
    });

    fileIndex++;
  });
  if (onProgress) {
    propsTiler.onProgress.add(onProgress);
  }

  propsTiler.onIndicesStreamed.add(async (props) => {
    const settingsFileId: PropertySettingsFileId =
      "ifc-processed-properties.json";

    const serializedRelations = components
      .get(OBC.IfcRelationsIndexer)
      .serializeRelations(props);
    onProcessed({
      settingsFile: {
        name: settingsFileId,
        data: JSON.stringify(settings),
      },
      indexesFile: {
        name: settings.indexesFile,
        data: serializedRelations,
      },
    });
  });

  return propsTiler;
}
