const { withUiHook, htm } = require("@zeit/integration-utils");
const { ZeitIUApiClient } = require("zeit-api-client");

const dashboardView = require("./views/dashboardView");

async function getContent(options) {
  const { payload, zeitClient } = options;
  const { clientState, action } = payload;

  const metadata = await zeitClient.getMetadata();

  const viewInfo = { metadata, zeitClient, payload };

  return dashboardView(viewInfo);
}

async function handler(options) {
  const jsx = await getContent(options);
  return htm`<Page>${jsx}</Page>`;
}

module.exports = withUiHook(handler);
