# openbim-components playground

This playground allows you to pick an ifc file and have it processed through the `FragmentIfcStreamConverter`. It will create all necessary tile files for streaming.

## Use

### Install dependencies and start the web app

```bash
# install dependencies
npm i
# run devserver
npm run dev
```

### Convert IFC file to tiles

The app converts an ifc file to the necessary files for streaming:

- myFile.`ifc-processed.json`: settings file for the streamer
- myFile.`ifc-processed-geometries-0`: binary geometry partial file. starts at 0 and increments for every geometry partial
- myFile.`ifc-processed-global`: binary global geometry file

Select an ifc file and hit submit. The file will be converted and the browser will prompt you to download the result.

> Use Chrome or Edge. Downloading the tar archive is handled through the FileSystemAPI, which hasn't landed in all browsers yet.

### Save the file

Save the tar archive from the previous step and extract it somewhere.
You will see a structure like this `0000-0000-0000-0000/[original_filename.ifc].ifc-processed.json`.

> Whitespaces in the original filename are replaced with _ to prevent encoding issues.

Copy the uuid folder (eg. `f2c30224-b175-409b-b8fb-94f76d8a75f4`) to the `./serve/` folder in the root of this repo.

Serve our files from `./serve/` statically, with cors enabled.

```bash
npm run serve
```

### Stream the model into the viewer

Open `./src/viewer.ts` and change `MODEL_NAME` to the filename (whitespaces are replaced with _). Change `MODEL_UUID` to the generated uuid of the generated folder.

```ts
const MODEL_UUID = "f2c30224-b175-409b-b8fb-94f76d8a75f4";
const MODEL_NAME = "200226_FH2_Tragwerk_IFC4_Design.ifc";
```

Click the "stream model from path" button. The model should now load in the viewer.

## Links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer

## Screenshot

![image](https://github.com/kitsunekyo/openbim-ifc-playground/assets/8297816/d1fc7a01-938b-449d-9b2a-902cee3bd761)

