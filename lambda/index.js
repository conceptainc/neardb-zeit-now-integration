// @ts-nocheck
const { parse } = require("url");
const S3Adapter = require("neardb/dist/adapters/s3");
const qs = require("qs");

const s3 = S3Adapter.S3Adapter.init({
  storage: {
    bucket: "bucket",
    endpoint: "play.minio.io:9000",
    useSSL: true,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    accessKeyId: "Q3AM3UQ867SPQQA43P2F", // these a public minio keys so don't worry
    secretAccessKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" // these a public minio secret so don't worry
  }
});

module.exports = async (req, res) => {
  const { query } = parse(req.url, true);
  const { path } = query;

  console.log("=====>", JSON.parse(JSON.stringify(path)).path);
  console.log(typeof path);

  switch (req.method) {
    case "POST":
      try {
        let payload = await s3.set(req.body, JSON.parse(path).path);
        res.end(payload);
      } catch (err) {
        throw err;
      }
      break;
    case "GET":
      // code block
      break;
    case "PUT":
      // code block
      break;
    case "DELETE":
      // code block
      break;
    default:
      res.end(`Oops something went wrong!`);
  }
};

// const express = require("express");
// const bodyParser = require("body-parser");

// const app = express();
// module.exports = app;

// app.use(bodyParser.json());

// app.get("*", async (req, res, next) => {
//   try {
//     let payload = await s3.get(JSON.parse(req.query.path));

//     res.json(payload);
//   } catch (err) {
//     next(err);
//   }
// });

// app.post("*", async (req, res, next) => {
//   if (req.body == null) {
//     return res.status(400).send({ error: "no JSON object in the request" });
//   }

//   try {
//     let payload = await s3.set(req.body, JSON.parse(req.query.path));
//     res.json(payload);
//   } catch (err) {
//     next(err);
//   }
// });

// app.put("*", async (req, res, next) => {
//   if (req.body == null) {
//     return res.status(400).send({ error: "no JSON object in the request" });
//   }
//   try {
//     let payload = await s3.update(req.body, JSON.parse(req.query.path));
//     res.json(payload);
//   } catch (err) {
//     next(err);
//   }
// });

// app.delete("*", async (req, res, next) => {
//   try {
//     let payload = await s3.remove(JSON.parse(req.query.path));
//     res.json(payload);
//   } catch (err) {
//     next(err);
//   }
// });
