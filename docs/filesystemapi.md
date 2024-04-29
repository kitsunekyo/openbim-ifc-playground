# Local FileSystem API Strategy

> This is deprecated and not recommended. Use the api version instead.

This will create the directory structure like `/serve/18b23d46-64eb-4848-b649-7ce43ec7bf92
` locally, with all the converted.

You will then have to copy them manually to a location to serve them from.

##### 3.(b).1 Convert IFC file to tiles

Browse to [http://localhost:8080](http://localhost:8080).

> Open the devtools with F12, to see debug and error messages

1. Press the "Select file" button to Select an ifc file.
2. Press the "Convert to tiles" button.
3. The browser will ask you to select a folder where the app can write the converted directories / files.
4. Inside of your "downloads" folder, create a folder `ifcjs-converted/` and select it. (Or just select it, if it already exists.)
5. Your conversion will start, and you should see the progressbar filling

> Note that for 1.5GB files this can take **45 minutes**.

Once the conversion is complete, you should see a message that gives you UUID and filename for the next steps.

##### 3.(b).2 Copy the converted ifc files

Copy the contents of `downloads/ifcjs-converted/` into the root folder in this repository.
You should now have a `serve/` folder next to `node_modules/`, `.env` etc.

For subsequent requests, you can just copy the converted ifcjs folders (eg. `35a0c19e-891c-4709-801c-ac5acfb918a9/`) into the serve directory, instead of replacing the full `serve/` folder.

##### 3(b).3 Start the geometry server

```bash
npm run serve
```

This will run a static webserver, that serves all files from the `serve/` folder inside our repository.

Browse to [http://localhost:8888](http://localhost:8888), to see all the folders / files currently served.
