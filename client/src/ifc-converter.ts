import * as OBC from "openbim-components";
import { logger } from "./logger";

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

/**
 * returns a function that writes a file to the file system
 */
async function createWriter(fileUUID: string) {
  const directoryHandle = await window.showDirectoryPicker({
    startIn: "downloads",
    mode: "readwrite",
  });
  const serveDirectoryHandle = await directoryHandle.getDirectoryHandle(
    "serve",
    { create: true }
  );
  const ifcDirectoryHandle = await serveDirectoryHandle.getDirectoryHandle(
    fileUUID,
    {
      create: true,
    }
  );

  return async function writeFile(
    data: FileSystemWriteChunkType,
    fileName: string
  ) {
    const fileHandle = await ifcDirectoryHandle.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  };
}

function createUploader(fileUUID: string, sourceFileName: string) {
  return async function uploadFile(
    data: ArrayBufferView | string,
    fileName: string
  ) {
    const formData = new FormData();
    formData.append("fileName", sourceFileName);
    let file: File;
    if (typeof data === "string") {
      file = new File([new Blob([data])], fileName, {
        type: "application/json",
      }); // TODO: check if content really IS json
    } else {
      file = new File([new Blob([data])], fileName);
    }
    formData.append("file", file, fileName);

    const res = await fetch(`http://localhost:3000/api/models/${fileUUID}`, {
      method: "POST",
      body: formData,
    }).then((r) => r.json());

    console.log(res);
  };
}

async function convertToStreamable(ifcFile: File) {
  const fileName = ifcFile.name.replace(/\s/g, "_");
  const fileUUID = crypto.randomUUID();
  // const writeFile = await createWriter(fileUUID);
  const uploadFile = createUploader(fileUUID, fileName);

  const converter = new OBC.FragmentIfcStreamConverter(new OBC.Components());
  converter.settings.wasm = {
    path: WEB_IFC_WASM,
    absolute: true,
  };

  let fileIndex = 0;

  const streamedGeometries: StreamedGeometries = {
    assets: [],
    geometries: {},
    globalDataFileId: `${fileName}.ifc-processed-global`,
  };

  converter.onGeometryStreamed.add(async ({ buffer, data }) => {
    const geometryFileId: GeometryPartFileId = `${fileName}.ifc-processed-geometries-${fileIndex}`;
    // await writeFile(buffer, geometryFileId);
    await uploadFile(buffer, geometryFileId);

    for (const id in data) {
      streamedGeometries.geometries[id] = {
        boundingBox: data[id].boundingBox,
        hasHoles: data[id].hasHoles,
        geometryFile: geometryFileId,
      };
    }

    fileIndex++;
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
    // await writeFile(globalFile, streamedGeometries.globalDataFileId);
    // await writeFile(
    //   JSON.stringify(streamedGeometries),
    //   `${fileName}.ifc-processed.json` satisfies IfcProcessedFileId
    // );
    await uploadFile(globalFile, streamedGeometries.globalDataFileId);
    await uploadFile(
      JSON.stringify(streamedGeometries),
      `${fileName}.ifc-processed.json` satisfies IfcProcessedFileId
    );

    logger.success("onIfcLoaded complete");
    logger.info("streamedGeometries", streamedGeometries);

    renderSuccessMessage({ fileUUID, fileName });
  });

  converter.onProgress.add(handleProgressUpdated);

  converter.streamFromBuffer(new Uint8Array(await ifcFile.arrayBuffer()));
}

/**
 * DOM rendering
 */

export function renderForm() {
  const formEl = document.getElementById("ifcForm") as HTMLFormElement;
  if (!formEl) {
    throw new Error('Element with id "ifcForm" not found');
  }

  const inputEl = document.getElementById("fileInput") as HTMLInputElement;
  if (!inputEl) {
    throw new Error('Element with id "fileInput" not found');
  }

  formEl.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();
    const file = inputEl.files?.[0];
    if (!file) {
      throw new Error("No file selected");
    }
    convertToStreamable(file);
    formEl.reset();
  });
}

function renderSuccessMessage({
  fileUUID,
  fileName,
}: {
  fileUUID: string;
  fileName: string;
}) {
  const rootEl = document.getElementById("root") as HTMLDivElement;
  if (!rootEl) {
    throw new Error('Element with id "root" not found');
  }
  rootEl.innerHTML = `
      <p>Files generated!</p>
      <p>Copy the generated <code>serve/</code> folder to the root of the project.</p>
      <p>Make sure the file server is running with <code>npm run serve</code>.</p>
      <p>Change <code>VITE_MODEL_UUID</code> and <code>VITE_MODEL_NAME</code> in your <code>.env</code> file. And browse to <a href="/viewer.html">/viewer.html</a>.</p>
      <pre>
VITE_MODEL_UUID="${fileUUID}"
VITE_MODEL_NAME="${fileName}"
      </pre>
      <p>Refresh the page if you want to convert another file.</p>
    `;
}

function handleProgressUpdated(value: number) {
  const progressEl = document.getElementById("progress") as HTMLProgressElement;
  if (!progressEl) {
    throw new Error('Element with id "progress" not found');
  }
  progressEl.value = value * 100;
  if (value === 1) {
    logger.success("progress 100%");
  }
}
