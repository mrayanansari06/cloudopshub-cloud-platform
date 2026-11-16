import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  const params = {
    TableName: "CloudOpsHubRequests"
  };

  const result = await client.send(new ScanCommand(params));

  const items = result.Items.map((item) => ({
    requestId: item.requestId.S,
    title: item.title.S,
    description: item.description.S,
    status: item.status.S,
    createdAt: item.createdAt.S
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(items)
  };
};
