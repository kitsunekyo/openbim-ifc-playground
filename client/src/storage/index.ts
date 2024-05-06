import { createFileSystemWriter } from "./filesystemwriter";
import { createUploader } from "./uploader";

/**
 * `"server"`: uses the server from ./server/ as remote model storage
 * `"local"`: uses FileSystemApi and prompts the user to download files
 */
const STORAGE = import.meta.env.VITE_STORAGE || "server";

export async function createStorage(fileUUID: string) {
  if (STORAGE === "server") {
    return createUploader(fileUUID);
  }
  return createFileSystemWriter(fileUUID);
}
