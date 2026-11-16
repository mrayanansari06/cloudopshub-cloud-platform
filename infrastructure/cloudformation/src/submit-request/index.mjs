import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  const rawBody = event.isBase64Encoded
  ? Buffer.from(event.body, "base64").toString("utf-8")
  : event.body;
const body = JSON.parse(rawBody);

  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  const params = {
    TableName: "CloudOpsHubRequests",
    Item: {
      requestId: { S: requestId },
      title: { S: body.title },
      description: { S: body.description },
      status: { S: "SUBMITTED" },
      createdAt: { S: timestamp }
    }
  };

  await client.send(new PutItemCommand(params));

  return {
    statusCode: 201,
    body: JSON.stringify({ requestId, status: "SUBMITTED" })
  };
};
