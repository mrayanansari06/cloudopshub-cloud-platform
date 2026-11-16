import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new DynamoDBClient({});
const snsClient = new SNSClient({});

export const handler = async (event) => {
  const requestId = event.pathParameters.requestId;
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;
  const body = JSON.parse(rawBody);
  const newStatus = body.status;

  if (newStatus !== "APPROVED" && newStatus !== "REJECTED") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "status must be APPROVED or REJECTED" })
    };
  }

  const current = await client.send(new GetItemCommand({
    TableName: "CloudOpsHubRequests",
    Key: { requestId: { S: requestId } }
  }));

  if (!current.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "request not found" })
    };
  }

  if (current.Item.status.S !== "SUBMITTED") {
    return {
      statusCode: 409,
      body: JSON.stringify({
        error: `cannot change status from ${current.Item.status.S} to ${newStatus}`
      })
    };
  }

  await client.send(new UpdateItemCommand({
    TableName: "CloudOpsHubRequests",
    Key: { requestId: { S: requestId } },
    UpdateExpression: "SET #s = :newStatus",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":newStatus": { S: newStatus } }
  }));

  await snsClient.send(new PublishCommand({
    TopicArn: "arn:aws:sns:eu-north-1:786896018350:CloudOpsHubNotifications",
    Subject: `Request ${newStatus}`,
    Message: `Request ${requestId} (${current.Item.title.S}) has been ${newStatus}.`
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ requestId, status: newStatus })
  };
};
