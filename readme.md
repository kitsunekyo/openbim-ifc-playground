# openbim-components `FragmentIfcStreamConverter` example

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

> Use Chrome or Edge. FileSystemAPI isn't supported by all browsers yet.

The app converts an ifc file to the necessary files for streaming:

- myFile.`ifc-processed.json`: settings file for the streamer
- myFile.`ifc-processed-geometries-0`: binary geometry partial file.    
  Starts at 0 and increments for every geometry partial
- myFile.`ifc-processed-global`: binary global geometry file

1. Press the "Select file" button to Select an ifc file.
2. Press the "Convert to tiles" button.
3. The browser will ask you to select a folder where the app can write the converted directories / files.
4. Navigate to the directory of this repository and press "Select folder", to select it as destination.

> If you can't browse to the repo folder, because its not on your OS file system (eg. when using WSL2), select the "Downloads" folder as directory. After the conversion is complete, copy the `serve` folder to your repo.

This will create a `serve` directory in the selected directory, if there isn't one yet. For each conversion it will also create a new directory with a UUID to prevent naming conflicts. Inside this directory you will find all geometry and json files.

### Start the geometry server

```bash
npm run serve
```

This will run a static webserver, that serves all files from the `serve/` folder inside our repository.

### Stream the model into the viewer

Open `./src/viewer.ts` and change `MODEL_NAME` to the ifc filename (whitespaces are replaced with _). Change `MODEL_UUID` to the generated uuid of the generated folder.

```ts
const MODEL_UUID = "f2c30224-b175-409b-b8fb-94f76d8a75f4";
const MODEL_NAME = "200226_FH2_Tragwerk_IFC4_Design.ifc";
```

Click the "stream model from path" button. The model should now load in the viewer.

## Links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer

## Screenshot

![image](https://github.com/kitsunekyo/openbim-ifc-playground/assets/8297816/d1fc7a01-938b-449d-9b2a-902cee3bd761)

