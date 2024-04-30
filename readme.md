# openbim-components `FragmentIfcStreamConverter` monorepo example

This example repo allows you to pick an ifc file and have it processed through the `FragmentIfcStreamConverter`. It will create all necessary tile files for streaming.

## Requirements

- node 20 LTS
- npm
- chrome or edge, when using `VITE_STORAGE="local"` (FileSystemAPI isn't supported by all browsers yet)

## Usage

### 1. Install dependencies and start the web app

```bash
cd client
```

Use npm to ensure you're using the correct package versions.

```bash
npm install
npm run dev # start the app on http://localhost:8080
```

### 2. Create an `.env` file

Inside `./client`, create an `.env` file by coping the `.env.example` file. This file will be used to configure the viewer and converter.

```bash
cp .env.example .env
```

### 3. Converting and saving the tiles

For the next step you can choose between two different strategies.

Both will generate the following files, and either put them on your browser. Or upload them to an api.

- `ifc-processed.json`: settings file for the streamer
- `ifc-processed-geometries-0`: binary geometry partial file.  
  Starts at 0 and increments for every geometry partial
- `ifc-processed-global`: binary global geometry file

#### 3.(a) API (recommended)

This uses an api to upload your converted tiles to and save them to a database.

##### 3.(a).1 Start the api server

```bash
cd server
```

```bash
npm install
npx prisma migrate dev # setup the sqlite database
npm run dev # start the api server on http://localhost:3000
```

Open the converter on http://localhost:8080/ and pick an IFC File. Then press "convert to tiles". This will convert your files, upload them directly to the model server and add a new entry in the sqlite database.

You can see all the converted models in the database by doing a GET request to `http://localhost:3000/api/models` (or opening it in the browser).

#### 3.(b) Local FileSystem API

> Enabled by setting `VITE_STORAGE="local"` in `client/.env`

[@deprecated - read more](./docs/filesystemapi.md)

### 4. Stream the model into the viewer

Inside `client/.env` change `VITE_MODEL_UUID` to the generated uuid of the generated folder. The html page should show you the correct value after the conversion is complete.

```dotenv
VITE_MODEL_UUID="e04907d4-0fdf-43cf-83d7-4fc80cfe1646"
```

Open [http://localhost:8080/viewer.html](http://localhost:8080/viewer.html).

## Links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer
