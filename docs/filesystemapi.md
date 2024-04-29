# Local FileSystem API Strategy

> This is deprecated and not recommended. Use the api version instead.

This will create the directory structure like `/serve/18b23d46-64eb-4848-b649-7ce43ec7bf92
` locally, with all the converted.

You will then have to manually start a static file server.

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

##### 3(b).2 Start the static file server

Open a terminal inside the folder `ifcjs-converted` and start a simple static file server.

```bash
npx serve . --cors -l 8888
```

Browse to [http://localhost:8888](http://localhost:8888), to see all the folders / files currently served.
