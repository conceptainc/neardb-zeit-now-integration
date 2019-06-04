const express = require("express");
const helmet = require("helmet");
const S3Adapter = require("neardb/dist/adapters/s3");
const bodyParser = require("body-parser");

const app = express();

app.use(helmet());
app.use(bodyParser.json()); // handle json data
app.use(bodyParser.urlencoded({ extended: true }));

process.env;

const s3 = S3Adapter.S3Adapter.init({
  storage: {
    bucket: process.env.bucketName,
    endpoint: process.env.endpoint,
    useSSL: true,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  }
});

app.get("*", async (req, res, next) => {
  try {
    let payload = await s3.get(JSON.parse(req.query.path));

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

app.post("*", async (req, res, next) => {
  if (req.body == null) {
    return res.status(400).send({ error: "no JSON object in the request" });
  }

  try {
    let payload = await s3.set(req.body, JSON.parse(req.query.path));
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

app.put("*", async (req, res, next) => {
  if (req.body == null) {
    return res.status(400).send({ error: "no JSON object in the request" });
  }
  try {
    let payload = await s3.update(req.body, JSON.parse(req.query.path));
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

app.delete("*", async (req, res, next) => {
  try {
    let payload = await s3.remove(JSON.parse(req.query.path));
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = app;
