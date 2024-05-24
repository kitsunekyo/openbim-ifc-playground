import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { prisma } from "./lib/db";
import {
  BINARY_FILES_REGEX,
  JSON_FILES_REGEX,
  deleteModelFolder,
  generateTiles,
} from "./lib/storage";
import { nanoid } from "nanoid";

const CLIENT_URL = "http://localhost:8080";
const PORT = 3000;

const app = new Hono();
app.use(compress());
app.use(logger());
app.use("/files/models/*", cors());
app.use(
  "/api/*",
  cors({
    origin: CLIENT_URL,
    allowHeaders: ["content-type"],
  })
);

// hono does not allow serving static files without an extension as it cant map the mime type.
app.use(
  "/files/models/*",
  serveStatic({
    root: "./storage",
    rewriteRequestPath: (path: string) => {
      return path
        .replace(/^\/files\/models\//, "")
        .replace(JSON_FILES_REGEX, "$1.json")
        .replace(BINARY_FILES_REGEX, "$1.bin");
    },
  })
);

app.post("/api/models", async (c) => {
  const contentType = c.req.header("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    throw new HTTPException(400, {
      message: "Invalid content-type. Expected `multipart/form-data`.",
    });
  }

  const body = await c.req.parseBody();
  const file = body["file"];
  if (!(file instanceof Blob)) {
    throw new HTTPException(400, {
      message: "Invalid value received for `file`. Expected File or Blob.",
    });
  }
  const conversionId = nanoid(8);
  // using .then here instead of await, so we dont block the client
  generateTiles(file, conversionId).then(() => {});

  c.status(201);
  c.header("Location", `https://localhost:3000/api/models/${conversionId}`);

  return c.json({ message: "conversion started", conversionId });
});

app.get("/api/models", async (c) => {
  const models = await prisma.iFCModel.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });
  return c.json(models);
});

app.get("/api/models/:id", async (c) => {
  const model = await prisma.iFCModel.findFirst({
    where: {
      id: c.req.param("id"),
    },
  });

  return c.json(model);
});

app.delete("/api/models/:id", async (c) => {
  const id = c.req.param("id");

  await prisma.iFCModel
    .findUniqueOrThrow({
      where: {
        id,
      },
    })
    .catch(() => {
      throw new HTTPException(404, {
        message: `Model with id ${id} not found.`,
      });
    });

  await prisma.iFCModel.delete({
    where: {
      id,
    },
  });

  await deleteModelFolder(id);

  return c.body(null);
});

app.get("/health", (c) => {
  return c.text("OK");
});

console.log(`server is running. http://localhost:${PORT}/health`);

serve({
  fetch: app.fetch,
  port: PORT,
});
