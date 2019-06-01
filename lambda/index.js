const express = require("express");
const bodyParser = require("body-parser");
const S3 = require("aws-sdk/clients/s3");

const app = express();
module.exports = app;

app.use(bodyParser.json());

var s3 = new S3({
  apiVersion: "2006-03-01",
  params: { Bucket: process.env.bucket }
});

var params = {
  Bucket: "STRING_VALUE" /* required */,
  Expression: "STRING_VALUE" /* required */,
  ExpressionType: "SQL" /* required */,
  InputSerialization: {
    /* required */

    CompressionType: "GZIP",
    JSON: {
      Type: "LINES"
    }
  },
  Key: "STRING_VALUE" /* required */,
  OutputSerialization: {
    /* required */
    JSON: {
      RecordDelimiter: "STRING_VALUE"
    }
  }
};

app.get("*", (req, res) => {
  res.set("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ here: "there" }, null, 4));
});

app.post("*", (req, res) => {
  if (req.body == null) {
    return res.status(400).send({ error: "no JSON object in the request" });
  }

  res.set("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(req.body, null, 4));
});

app.all("*", (req, res) => {
  res.status(405).send({ error: "only POST requests are accepted" });
});
