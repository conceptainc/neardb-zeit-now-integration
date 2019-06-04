const { withUiHook, htm } = require("@zeit/integration-utils");
const { ZeitIUApiClient } = require("zeit-api-client");

const instanceView = require("./views/instanceView");
const dashboardView = require("./views/dashboardView");

module.exports = withUiHook(async ({ payload, zeitClient }) => {
  const { clientState, action } = payload;
  // get the previous info
  const metadata = await zeitClient.getMetadata();

  metadata.secret = metadata.secret || "";
  metadata.bucketName = metadata.bucketName || "";
  metadata.region = metadata.region || "";
  metadata.apiKey = metadata.apiKey || "";
  metadata.cachingOptions = metadata.cachingOptions || "";
  // get the last deployments
  const zeitApi = new ZeitIUApiClient(zeitClient);
  const latestDeployments = await zeitApi.getDeployments();

  // handle submit action
  if (action === "submit") {
    // set values on metadata
    metadata.secret = clientState.secret;
    metadata.bucketName = clientState.bucketName;
    metadata.region = clientState.region;
    metadata.apiKey = clientState.apiKey;
    metadata.cachingOptions = clientState.cachingOptions;
    await zeitClient.setMetadata(metadata);

    // CHECK HOW SET THE PROJECT ID, ON DEV IS COMING NULL
    if (payload.projectId) {
      const envSecret = await zeitClient.ensureSecret("secret", metadata.secret);
      await zeitClient.upsertEnv(payload.projectId, "SECRET", envSecret);

      const envBucketName = await zeitClient.ensureSecret("bucketName", metadata.bucketName);
      await zeitClient.upsertEnv(payload.projectId, "BUCKET_NAME", envBucketName);

      const envRegion = await zeitClient.ensureSecret("secret", metadata.region);
      await zeitClient.upsertEnv(payload.projectId, "SECRET", envRegion);

      const envApiKey = await zeitClient.ensureSecret("secret", metadata.apiKey);
      await zeitClient.upsertEnv(payload.projectId, "API_KEY", envApiKey);

      const envCachingOptions = await zeitClient.ensureSecret("secret", metadata.cachingOptions);
      await zeitClient.upsertEnv(payload.projectId, "CACHING_OPTIONS", envCachingOptions);
    }
    // makes the deployment
    const deloymentData = {
      name: "neardb",
      version: 2,
      files: [
        {
          file: "index.html",
          data:
            '<!doctype html>\n<html>\n  <head>\n    <title>A simple deployment with the Now API!</title>\n  </head>\n  <body>\n    <h1>Welcome to a simple static file</h1>\n    <p>Deployed with <a href="https://zeit.co/docs/api">ZEIT&apos;s Now API</a>!</p>\n    </body>\n</html>'
        }
      ]
    };
    await zeitApi.createDeployment(deloymentData);

    return htm`
      <Page>
        <Container>
          <P>Integration Done.</P>
          <Container>
            <Button action="reload">Reload</Button>
          </Container>
          <H1>Latest Deployments</H1>
          <Code>
            ${JSON.stringify(latestDeployments, null, 2)}
          </Code>
        </Container>
      </Page>
    `;
  }

  const baseReturn = instanceView;

  if (action === "reload") {
    return baseReturn;
  }

  return baseReturn;
});
