const { htm } = require("@zeit/integration-utils");
const dashboardView = require("./dashboardView");
const { slugify, checkEmpty } = require("../lib/utils.js");
const { ZeitIUApiClient } = require("zeit-api-client");

module.exports = async function instanceView(viewInfo) {
  const { payload, metadata, zeitClient } = viewInfo;
  const { action, clientState } = payload;

  const zeitApi = new ZeitIUApiClient(zeitClient);

  let renderNotice = "";

  if (!metadata.instances) {
    metadata.instances = {};
    await zeitClient.setMetadata(metadata);
  }

  const instanceMetaData = {};

  if (action === "cancel") {
    return dashboardView(viewInfo);
  }

  if (action === "submit") {
    instanceMetaData.instanceName = clientState.instanceName;
    instanceMetaData.instanceSlug = clientState.instanceSlug || slugify(clientState.instanceName);
    instanceMetaData.provider = clientState.provider;
    instanceMetaData.endpoint = clientState.endpoint;
    instanceMetaData.accessKeyId = clientState.accessKeyId;
    instanceMetaData.SecretAccessKey = clientState.SecretAccessKey;
    instanceMetaData.bucketName = clientState.bucketName;
    instanceMetaData.region = clientState.region;
    instanceMetaData.cacheMaxAge = clientState.cacheMaxAge;
    instanceMetaData.cacheRevalidate = clientState.cacheRevalidate;

    metadata.instances[instanceMetaData.instanceSlug] = instanceMetaData;

    // Validation
    if (checkEmpty(instanceMetaData.instanceName)) {
      renderNotice = htm`<Notice type="error">One or more required fields are still missing.</Notice>`;
    } else {
      renderNotice = htm`<Notice type="success">Instance has been saved successfully.</Notice>`;

      await zeitClient.setMetadata(metadata);
      await createDeployment(instanceMetaData);

      return dashboardView(viewInfo);
    }
  }

  async function createDeployment(instanceMetaData) {
    // makes the deployment
    let deloymentData = {
      name: instanceMetaData.instanceSlug,
      version: 2,
      meta: {
        neardbSlug: instanceMetaData.instanceSlug,
        provider: instanceMetaData.provider,
        neardbDeployment: "active",
        bucketName: instanceMetaData.bucketName
      },
      builds: [{ src: "index.js", use: "@now/node" }],
      env: instanceMetaData,
      files: [
        {
          file: "package.json",
          data:
            '{\r\n  "name": "neardb-server",\r\n  "version": "0.0.1",\r\n  "description": "",\r\n  "main": "index.js",\r\n  "scripts": {\r\n    "test": "echo \\"Error: no test specified\\" && exit 1"\r\n  },\r\n  "author": "Leo Farias",\r\n  "license": "ISC",\r\n  "dependencies": {\r\n    "aws-sdk": "^2.466.0",\r\n    "express": "^4.17.1",\r\n    "neardb": "3.0.0-beta-0"\r\n    \r\n  }\r\n}\r\n'
        },
        {
          file: "index.js",
          data:
            'const { parse } = require("url");\r\nconst S3Adapter = require("neardb/dist/adapters/s3");\r\n\r\nconst s3 = S3Adapter.S3Adapter.init({\r\n  storage: {\r\n    bucket: "bucket",\r\n    endpoint: "play.minio.io:9000",\r\n    useSSL: true,\r\n    s3ForcePathStyle: true,\r\n    signatureVersion: "v4",\r\n    accessKeyId: "Q3AM3UQ867SPQQA43P2F", // these a public minio keys so don\'t worry\r\n    secretAccessKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" // these a public minio secret so don\'t worry\r\n  }\r\n});\r\n\r\nmodule.exports = (req, res) => {\r\n  const { query } = parse(req.url, true);\r\n  const { name = "World" } = query;\r\n\r\n  res.end(`Hello ${name}!`);\r\n};\r\n'
        }
      ]
    };
    await zeitApi.createDeployment(deloymentData);
  }

  function renderSlug(slug) {
    if (slug) {
      return htm`
        <FsFooter>
            <P><B>Slug:</B> ${instanceMetaData.instanceSlug || ""}</P>
        </FsFooter>
    `;
    } else {
      return htm`<P></P>`;
    }
  }

  function renderInstanceName(instanceName) {
    if (instanceName) {
      return htm`<Input name="instanceName" disabled label="" value="${instanceName || ""}" width="50%"/>`;
    }
    return htm`<Input name="instanceName"  label="" value="${instanceName || ""}" width="50%"/>`;
  }

  return htm`
    <Page>

        <Container>
            <Box highlight display="flex" align-items="center" justifyContent="space-between" padding-bottom="20px" border-bottom="1px solid #eee">
                <H1>Create a New Instance:</H1>
                <Button abort action="cancel"> Back to Dashboard</Button>
            </Box>
        </Container>

        <Container>
            <Box background-color="rgba(0, 118, 255, 0.07)" padding="15px" margin-bottom="10px" border-radius="5px">
                <P>Providers might have a names for configuration settings <Link href="https://www.notion.so/Guides-dc8667385a3b4c89a5df4c72c1c19153">Read our guides</Link>for more info</P>
            </Box>

            ${renderNotice}

            <Box display="flex" justifyContent="space-between">
                <Box width="100%">
                    <Container>
                        <Fieldset>
                            <FsContent>
                                <H2>Instance Name:</H2>
                                ${renderInstanceName(instanceMetaData.instanceName)}
                            </FsContent>
                            ${renderSlug(instanceMetaData.instanceSlug || false)}   
                        </Fieldset>
                        <Fieldset>
                            <FsContent>
                                <H2>Provider:</H2>
                                <P>Please select a provider which you would like to create an instance for.</P>
                                <Select name="provider" value="${instanceMetaData.provider || "aws"}">
                                    <Option value="aws" caption="AWS S3" />
                                    <Option value="google" caption="Google Cloud Storage" />
                                    <Option value="digitalocean" caption="Digital Ocean Spaces" />
                                    <Option value="minio" caption="Minio" />
                                </Select>
                            </FsContent>  
                            <FsFooter>
                                <P>Please create an account with the Provider selected.</P>
                            </FsFooter>                       
                        </Fieldset>
                        <Fieldset>
                            <FsContent>
                                <H2>Credentials:</H2>
                                <P>Credentials to the selected cloud provider.</P>
                                <Input name="accessKeyId" label="Access Key" value="${instanceMetaData.accessKeyId ||
                                  ""}" width="50%"/>
                                <Input name="SecretAccessKey" label="Secret" value="${instanceMetaData.SecretAccessKey ||
                                  ""}" width="50%"/>
                            </FsContent>                       
                        </Fieldset>
                        <Fieldset>
                            <FsContent>
                                <H2>Bucket:</H2>
                                <P>This is your database, where your data will be stored.</P>
                                <Input name="bucketName" label="Bucket Name" value="${instanceMetaData.bucketName ||
                                  ""}" width="50%"/>
                            </FsContent>                   
                        </Fieldset>
                        <Fieldset>
                            <FsContent>
                                <H2>Settings:</H2>
                                <P>Some of these need to be configured depending of the provider and it's defaults.</P>
                                <Input name="region" label="Region" value="${instanceMetaData.region ||
                                  ""}" width="50%"/>
                                  <Input name="endpoint" label="Endpoint" value="${instanceMetaData.endpoint ||
                                    ""}" width="50%"/>
                            </FsContent>                  
                        </Fieldset>
                        
                    </Container>
                </Box> 
                <Box width="400px" margin-left="40px">
                    <Fieldset>
                        <FsContent>
                            <B>Did not find your provider?</B> <BR/>
                            <Link href="https://github.com/leoafarias/neardb/issues">Let us know!</Link>
                        </FsContent>
                        <FsFooter>
                            <P>We are exploring integrations with other providers from databases like MongoDB, PostgreSQL, and Redis to services like Google Spreadsheets, and AirTable</P>                            
                        </FsFooter>
                    </Fieldset>
                    <Fieldset>
                        <FsContent>
                            <H2>Caching:</H2>
                            <P>Settings can be tweaked on the options below to better fit your needs.</P>
                            <Input name="cacheMaxAge" label="Max Age" value="${instanceMetaData.cacheMaxAge ||
                              60}" width="100%"/>
                            <Input name="cacheRevalidate" label="Revalidate" value="${instanceMetaData.cacheRevalidate ||
                              20}" width="100%"/>
                        </FsContent>                       
                        <FsFooter>
                            <P>
                                <B>Max Age: </B>Seconds you would like to cache the content on the edge.
                                <BR/>
                                <B>Revalidate:</B>Seconds cache will go until gets revalidated.                         
                            </P>
                        </FsFooter>
                    </Fieldset>
                </Box> 
                
            </Box>
            <BR/>
            <Button action="submit">Setup</Button>
            <Button abort action="cancel">Cancel</Button>
        </Container>        
    </Page>
    `;
};
