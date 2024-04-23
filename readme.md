## getting started

```bash
# install dependencies
npm i
# run devserver
npm run dev
```

## links

https://docs.thatopen.com/Tutorials/FragmentIfcStreamer

## feedback

versioning is meh, wenn ich `bim-fragment` `web-ifc` und `openbim-components` installiere, bekomm ich dependency resolution error. muss `web-ifc@^0.0.53` setzen damit ich überhaupt `openbim-components` installieren kann.

whats the difference between fragments and tiles? `FragmentIfcLoader` docs generate fragments, and `FragmentIfcStreamer` creates tiles.
why do i have to know this as a consumer of the library? i just want to give it an ifc file and load it into the viewer. the library should worry about when to use which format.

according to junghwo
tiles: for culling
fragments: regular loading


