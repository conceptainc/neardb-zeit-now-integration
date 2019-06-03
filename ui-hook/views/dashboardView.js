const { htm } = require("@zeit/integration-utils");
const { ZeitIUApiClient } = require("zeit-api-client");
const { distanceInWordsToNow, format } = require("date-fns");
const { groupBy, sortDescending } = require("../lib/utils.js");
const instanceView = require("./instanceView");

module.exports = async function dashboardView(viewInfo) {
  const { payload, metadata, zeitClient } = viewInfo;
  const { action, clientState } = payload;
  const zeitApi = new ZeitIUApiClient(zeitClient);

  let options = {
    query: {
      neardbDeployment: "active"
    }
  };

  const listInstances = await zeitApi.getDeployments(options);

  if (action === "edit-instance") {
    return instanceView(viewInfo);
  }

  if (action === "create-instance") {
    return instanceView(viewInfo);
  }

  function renderStatus(state) {
    // state = "BUILDING";
    let states = {
      READY: "#38dc3f",
      ERROR: "#dc3838",
      INITIALIZING: "##fdeb11",
      ANALYZING: "##fdeb11",
      DEPLOYING: "##fdeb11",
      BUILDING: "##fdeb11"
    };
    return htm`
        <Box height="12px" width="12px" border-radius="10px" margin-right="20px" margin-left="10px" background-color="${
          states[state]
        }"/>
      `;
  }

  function renderInstances(listInstances) {
    let instances = groupBy(listInstances, "name");
    let keys = Object.keys(instances);
    if (keys.length < 1) {
      return htm`
        <Box display="flex" height="400px" align-items="center" justify-content="center">
            <Box display="flex" flex-direction="column" align-items="center" justify-content="center">
                <Img src="https://img.icons8.com/nolan/64/000000/delete-database.png"/>
                <Box height="10px"/>
                <H2>You don't have any instances yet!</H2>
                <Box height="10px"/>
                <Button action="create-instance">Create Your First One</Button>
            </Box>
        </Box>
        `;
    }
    return htm`
        <Container>
            ${keys.map(k => {
              instances[k].sort(sortDescending);
              return htm`
                <Box background-color="white" margin-bottom="20px" padding="20px">          
                    <Box display="flex" flex-direction="row" justify-content="space-between" align-items="center" padding-bottom="20px"> 
                        <Box display="flex" flex-direction="row" align-items="center">
                            <Box margin-right="15px"><H2>${k}</H2></Box>
                        </Box>
                        <Box margin-left="20px" font-size="12px" color="#777"> Updated: ${format(
                          instances[k][0].created,
                          "MMMM DD YYYY"
                        )}</Box>
                    </Box>
                    ${instances[k].map(i => {
                      return htm`
                            <Box padding="10px" display="flex" flex-direction="row" justify-content="space-between" align-items="center" background-color="rgba(238, 238, 238, 0.25)" border="1px solid rgb(236, 236, 236)" border-radius="5px" margin-bottom="10px">
                                <Box display="flex" flex-direction="row" align-items="center" justify-content="flex-start">
                                    ${renderStatus(i.state)}
                                    <Box>
                                        <P>${i.url} | ${i.meta.provider}</P>
                                    </Box>
                                    <Box margin-left="10px" margin-top="5px" >
                                        <Link href="${"https://" + i.url}">
                                            <Img height="15px" width="15px" src="https://img.icons8.com/material-sharp/24/000000/external-link.png"/>
                                        </Link>
                                    </Box>
                                </Box>                                
                                <Box margin-right="10px">${distanceInWordsToNow(i.created, { addSuffix: true })}</Box>
                            </Box>
                            `;
                    })}
                </Box>                  
                `;
            })}
        </Container>
    `;
  }

  return htm`
    <Page>
        <Container>
            <Box highlight display="flex" align-items="center" justifyContent="space-between" padding-bottom="20px" border-bottom="1px solid #eee">
                <H1>Your Instances</H1>
                <Button action="create-instance" width="200px">+  Create</Button>
            </Box>
        </Container>
        <Container>
            ${renderInstances(listInstances)}
        </Container>
        
    </Page>`;
};
