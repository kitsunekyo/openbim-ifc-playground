# @thatopen/components `Stream` monorepo example

This example repo allows you to pick an ifc file and have it processed for streaming.

## Requirements

- node 20 LTS + npm

## Usage

### 1. Install dependencies and start the web app

```bash
cd client
```

```bash
npm install
npm run dev
```

### 3. Convert IFC File to tiles with the api server

The api in `server/` will generate the following files, save them on the filesystem and add an entry to a sqlite database.

```ts
// geometry files
type GeometryTileFileId = `ifc-processed-geometries-${number}`;
type GeometryGlobalFileId = `ifc-processed-global`;
type GeometrySettingsFileId = `ifc-processed.json`;

// property files
type PropertyTileFileId = `ifc-processed-properties-${number}`;
type PropertyIndexesFileId = `ifc-processed-properties-indexes`;
type PropertySettingsFileId = `ifc-processed-properties.json`;
```

**Start the api server**

```bash
cd server
```

```bash
npm install
npm run migrate # setup the sqlite database
npm run dev # start the api server on http://localhost:3000
```

> You can import the postman collection to Postman, to have all available api endpoints.

**Send your ifc file to your api via a POST request**

```bash
curl --location 'localhost:3000/api/models' \
--form 'file=@"/C:/Users/aspieslechner/Downloads/ifcjs/200226 FH2_Tragwerk IFC4 Design.ifc"'
```

This will start the conversion, and return a response like this.

```json
{
  "message": "ifc tiling started",
  "conversionId": "LHS10IpZ"
}
```

You can see all the converted models in the database by doing a GET request to `http://localhost:3000/api/models` (or opening it in the browser).

> Depending on your file size, you might have to wait a bit until it all files are generated (todo: create an endpoint to get progress)

### 4. Stream the model into the viewer

Inside `client/src/viewer.ts` change `MODEL_UUID` to the generated uuid from the api response.

Open [http://localhost:8080](http://localhost:8080).

## Links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer
