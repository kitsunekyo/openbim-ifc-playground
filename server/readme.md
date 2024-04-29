# model server

```bash
npm install
npm run dev
```

### Routes

```bash
# add a single file with form-data body
POST localhost:3000/api/models/:id

# delete model
DELETE localhost:3000/api/models/:id

# add multiple files with form-data body
POST localhost:3000/api/models/:id/batch

# get ifc models (for model management ui)
GET localhost:3000/api/models

# delete all model files and db entries (for debugging only)
DELETE localhost:3000/api/models

# get static files (for viewer)
GET localhost:3000/files/models/:id/TESTED_Simple_project_01.ifc.ifc-processed.json
```
