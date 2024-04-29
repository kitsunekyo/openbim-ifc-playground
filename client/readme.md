# openbim-components `FragmentIfcStreamConverter` example

This playground allows you to pick an ifc file and have it processed through the `FragmentIfcStreamConverter`. It will create all necessary tile files for streaming.

## Requirements

- node 20 LTS
- npm
- chrome or edge (FileSystemAPI isn't supported by all browsers yet)

## Use

### Install dependencies and start the web app

Use npm to ensure you're using the correct package versions.

```bash
# install dependencies
npm i
# run devserver
npm run dev
```

### Create an `.env` file

Inside the root directory of the repo, create a `.env` file by coping the `.env.example` file.

```bash
cp .env.example .env
```

### Convert IFC file to tiles

Browse to [http://localhost:8080](http://localhost:8080).

> Open the devtools with F12, to see debug and error messages

1. Press the "Select file" button to Select an ifc file.
2. Press the "Convert to tiles" button.
3. The browser will ask you to select a folder where the app can write the converted directories / files.
4. Inside of your "downloads" folder, create a folder `ifcjs-converted/` and select it. (Or just select it, if it already exists.)
5. Your conversion will start, and you should see the progressbar filling

> Note that for 1.5GB files this can take **45 minutes**.

This will create the directory structure `downloads/ifcjs-converted/serve/`, if it doesn't exist yet.
For each conversion it will also create a new directory with a UUID to prevent naming conflicts.

Inside this directory you will find all geometry and json files.

- my_ifc_file.ifc.`ifc-processed.json`: settings file for the streamer
- my_ifc_file.ifc.`ifc-processed-geometries-0`: binary geometry partial file.  
  Starts at 0 and increments for every geometry partial
- my_ifc_file.ifc.`ifc-processed-global`: binary global geometry file

Once the conversion is complete, you should see a message that gives you UUID and filename for the next steps.

### Copy the converted ifc files

Copy the contents of `downloads/ifcjs-converted/` into the root folder in this repository.
You should now have a `serve/` folder next to `node_modules/`, `.env` etc.

For subsequent requests, you can just copy the converted ifcjs folders (eg. `35a0c19e-891c-4709-801c-ac5acfb918a9/`) into the serve directory, instead of replacing the full `serve/` folder.

### Start the geometry server

```bash
npm run serve
```

This will run a static webserver, that serves all files from the `serve/` folder inside our repository.

Browse to [http://localhost:8888](http://localhost:8888), to see all the folders / files currently served.

### Stream the model into the viewer

Inside `.env` change `VITE_MODEL_NAME` to the ifc filename (whitespaces are replaced with \_). Change `VITE_MODEL_UUID` to the generated uuid of the generated folder. The html page should show you the correct values after the conversion is complete.

```ts
VITE_MODEL_UUID = "e04907d4-0fdf-43cf-83d7-4fc80cfe1646";
VITE_MODEL_NAME = "05_large_Model_opening_error_03.ifc";
```

Open [http://localhost:8080/viewer.html](http://localhost:8080/viewer.html) to see the viewer.

## Links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer

## Screenshot

![image](https://github.com/kitsunekyo/openbim-ifc-playground/assets/8297816/d1fc7a01-938b-449d-9b2a-902cee3bd761)
