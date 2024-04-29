import fs from "node:fs/promises";
import path from "node:path";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { prisma } from "./db";

const port = 3000;

const app = new Hono();
app.use(compress());
app.use(logger());
app.use("/files/models/*", cors());
app.use(
  "/api/*",
  cors({
    origin: "http://localhost:8080",
    allowHeaders: ["content-type"],
  })
);

app.get("/health", (c) => {
  return c.text("OK");
});

app.get();

// TODO: wont serve files if they dont have a known file extension
app.use(
  "/files/models/*",
  serveStatic({
    root: "./storage",
    index: "*",
    rewriteRequestPath: (path: string) => {
      return path.replace(/^\/files\/models\//, "");
    },
  })
);

app.get("/api/models", async (c) => {
  const models = await prisma.iFCModel.findMany();
  return c.json(models);
});

app.post("/api/models/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody(); // oder .arrayBuffer()
  const file = body["file"];

  const contentType = c.req.header("content-type");

  if (!contentType?.includes("multipart/form-data")) {
    throw new HTTPException(400, {
      message: "Invalid content-type. Expected `multipart/form-data`.",
    });
  }

  if (!(file instanceof Blob)) {
    throw new HTTPException(400, { message: "Invalid file received." });
  }

  await fs.mkdir(path.join(__dirname, `/../storage/${id}`), {
    recursive: true,
  });

  await fs.writeFile(
    path.join(__dirname, `/../storage/${id}/${file.name}`),
    Buffer.from(await file.arrayBuffer())
  );

  const existingModel = await prisma.iFCModel.findUnique({
    where: {
      id,
    },
  });

  if (!existingModel) {
    await prisma.iFCModel.create({
      data: {
        id,
        name: file.name, // TODO: this should actually just be the original name - sent via form?
      },
    });
  }

  return c.json({
    message: `Added file.`,
    file: `http://localhost:${port}/files/models/${id}/${file.name}`,
  });
});

app.post("/api/models/:id/batch", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody({ all: true }); // oder .arrayBuffer()
  const file = body["file"];

  const contentType = c.req.header("content-type");

  if (!contentType?.includes("multipart/form-data")) {
    throw new HTTPException(400, {
      message: "Invalid content-type. Expected `multipart/form-data`.",
    });
  }

  if (!Array.isArray(file)) {
    throw new HTTPException(400, {
      message: "Invalid file received. Expected an array of files.",
    });
  }

  await fs.mkdir(path.join(__dirname, `/../storage/${id}`), {
    recursive: true,
  });

  const filteredFiles = file.filter((f): f is File => f instanceof Blob);

  for (const f of filteredFiles) {
    await fs.writeFile(
      path.join(__dirname, `/../storage/${id}/${f.name}`),
      Buffer.from(await f.arrayBuffer())
    );
  }

  const existingModel = await prisma.iFCModel.findUnique({
    where: {
      id,
    },
  });

  if (!existingModel) {
    await prisma.iFCModel.create({
      data: {
        id,
        name: filteredFiles[0]?.name || "MOCK_NAME", // TODO: this should actually just be the original name - sent via form?
      },
    });
  }

  return c.json({
    message: `Added ${filteredFiles.length} files.`,
    count: filteredFiles.length,
    files: filteredFiles.map(
      (f) => `http://localhost:${port}/files/models/${id}/${f.name}`
    ),
  });
});

console.log(`ifc server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
