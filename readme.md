# openbim-components playground

This playground allows you to pick an ifc file and have it processed through the `FragmentIfcStreamConverter`. It will create all necessary tile files for streaming.

## Install dependencies and start the app

```bash
# install dependencies
npm i
# run devserver
npm run dev
```

## Convert IFC File to tiles

The app converts an ifc file to the necessary files for streaming:

- myFile.ifc-processed.json: settings file for the streamer
- myFile.ifc-processed-geometries-0: binary geometry partial file. starts at 0 and increments for every geometry partial
- myFile.ifc-processed-global: binary global geometry file

Select an ifc file and hit submit. The file will be converted and the browser will prompt you to download the result.

> Use Chrome or Edge. Downloading the tar archive is handled through the FileSystemAPI, which hasn't landed in all browsers yet.

## Save the file

Save the tar archive from the previous step and extract it somewhere. Copy the folder to `./serve/`.
You should now have a folder `./serve/TESTED_Simple_project_01.ifc/`, which contains the json and geometry files.

To mock a basic backend server to host our files, use `serve`.

```bash
npm run serve
```

This will serve all files from `./serve/` statically, with cors enabled.

## Load the model into the viewer

Open `./src/viewer.ts` and change `MODEL_PATH` to our folder name. `MODEL_UUID` is the generated uuid from your individual files.

```ts
const MODEL_PATH = "http://localhost:3000/TESTED_Simple_project_01.ifc/";
const MODEL_UUID = "1baa82a7-0388-49f5-bb9e-4d4791c4a30f";
```

Click the "stream model from path" button. The model should now load in the viewer.

## links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer

