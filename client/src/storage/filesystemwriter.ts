/**
 * Write files client side with FileSystem API
 */
export async function createFileSystemWriter(fileUUID: string) {
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
    data: ArrayBufferView | string,
    name: string
  ) {
    const fileHandle = await ifcDirectoryHandle.getFileHandle(name, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  };
}
