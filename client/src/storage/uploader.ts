const API_URL = "http://localhost:3000/api/models";

/**
 * Upload files to the model server
 */
export function createUploader(fileUUID: string, sourceFileName: string) {
  return async function uploadFile(
    data: ArrayBufferView | string,
    name: string
  ) {
    const formData = new FormData();
    formData.append("fileName", sourceFileName);
    let file: File;
    if (typeof data === "string") {
      file = new File([new Blob([data])], name, {
        type: "application/json",
      }); // TODO: check if content really IS json
    } else {
      file = new File([new Blob([data])], name);
    }
    formData.append("file", file, name);

    const res = await fetch(`${API_URL}/${fileUUID}`, {
      method: "POST",
      body: formData,
    }).then((r) => r.json());

    console.log(res);
  };
}
