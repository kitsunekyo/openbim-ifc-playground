const API_ENDPOINT_URL = `${import.meta.env.VITE_SERVER_URL}/api/models`;

/**
 * Upload files to the model server
 */
export async function createUploader(fileUUID: string) {
  return async function uploadFile(
    data: ArrayBufferView | string,
    name: string
  ) {
    const postUrl = await fetch(`${API_ENDPOINT_URL}/${fileUUID}`, {
      method: "POST",
      body: JSON.stringify({
        fileName: name,
      }),
    })
      .then((r) => r.json())
      .catch(() => {
        console.error("Failed to get presigned post URL");
      });

    const formData = new FormData();

    for (const key in postUrl.fields) {
      formData.append(key, postUrl.fields[key]);
    }

    let file: File;
    if (typeof data === "string") {
      file = new File([new Blob([data])], name, {
        type: "application/json",
      }); // TODO: check if content really IS json
    } else {
      file = new File([new Blob([data])], name);
    }
    formData.append("file", file);

    await fetch(postUrl.url, {
      method: "POST",
      body: formData,
    });
  };
}
