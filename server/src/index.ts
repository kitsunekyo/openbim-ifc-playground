import "dotenv/config";
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import s3Utils from "@zvs001/s3-utils";
// import { PrismaClient } from "@prisma/client";
import { ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";

import type { LambdaEvent } from "hono/aws-lambda";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const GEOMETRY_FILE_REGEX =
  /(ifc-processed-geometries-[0-9]+|ifc-processed-global)/;

type Bindings = {
  event: LambdaEvent;
};

// const prisma = new PrismaClient();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8080";
const BUCKET_NAME = process.env.BUCKET_NAME || "openbim-models";

const s3Client = new S3Client({});

const models = {
  list: async () => {
    try {
      const res = await s3Client.send(
        new ListObjectsCommand({
          Bucket: BUCKET_NAME,
          Delimiter: "/",
        })
      );
      const modelIds =
        res.CommonPrefixes?.map((p) => p.Prefix).filter(
          (p): p is string => p !== undefined
        ) || [];
      return modelIds;
    } catch (err) {
      console.error(err);
    }
  },
  delete: async (id: string) => {
    try {
      s3Utils.deleteDir(s3Client, {
        Bucket: BUCKET_NAME,
        Prefix: `${id}/`,
      });
    } catch (err) {
      console.error(err);
    }
  },
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(compress());
app.use(logger());
app.use(
  "/api/*",
  cors({
    origin: CLIENT_URL,
    allowHeaders: ["content-type"],
  })
);

app.get("/health", (c) => {
  return c.text("OK");
});

app.get("/api/models", async (c) => {
  // const models = await prisma.iFCModel.findMany();
  const modelIds = (await models.list()) || [];
  return c.json(modelIds);
});

app.post("/api/models", async (c) => {
  const id = crypto.randomUUID();
  const { fileName } = await c.req.json();

  const post = await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: `${id}/${fileName}`,
    Conditions: [["content-length-range", 1 * 1024, 2 * Math.pow(1024, 3)]], // 1KB - 2GB
  });

  return c.json(post);
});

app.post("/api/models/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const fileName = body.fileName;

  const post = await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: `${id}/${fileName.replace(GEOMETRY_FILE_REGEX, "$1.bin")}`,
    Conditions: [["content-length-range", 1 * 1024, 2 * Math.pow(1024, 3)]], // 1KB - 2GB
  });

  return c.json(post);

  // const existingModel = await prisma.iFCModel.findUnique({
  //   where: {
  //     id,
  //   },
  // });

  // if (!existingModel) {
  //   await prisma.iFCModel.create({
  //     data: {
  //       id,
  //       name: fileName,
  //     },
  //   });
  // }
});

app.delete("/api/models/:id", async (c) => {
  const id = c.req.param("id");
  await models.delete(id);

  // const model = await prisma.iFCModel.findUnique({
  //   where: {
  //     id,
  //   },
  // });

  // if (!model) {
  //   throw new HTTPException(404, {
  //     message: `Model with id ${id} not found.`,
  //   });
  // }

  // await prisma.iFCModel.delete({
  //   where: {
  //     id,
  //   },
  // });

  return c.body(null);
});

export const handler = handle(app);
