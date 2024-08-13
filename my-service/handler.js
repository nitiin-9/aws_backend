"use strict";
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocument,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocument.from(client);
// const documentClient = new DynamoDB.DocumentClient({
//   region: "us-east-1",
//   maxRetries: 3,
//   httpOptions: {
//     timeout: 5000,
//   },
// });
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
};

module.exports.createNode = async (event, context, callback) => {
  context.callbackWaitForEmptyEventLoop = false;

  let data = JSON.parse(event.body);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body,
      },
      ConditionExpression: "attribute_not_exists(notesId)",
    };
    await documentClient.send(new PutCommand(params));
    return send(201, data);
  } catch (err) {
    return send(500, err.message);
  }
};
module.exports.updateNode = async (event, context, callback) => {
  context.callbackWaitForEmptyEventLoop = false;

  let notesId = event.pathParameters.id;
  console.log(notesId);
  let data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      UpdateExpression: "set #title = :title, #body=:body",
      ExpressionAttributeNames: {
        "#title": "title",
        "#body": "body",
      },
      ExpressionAttributeValues: {
        ":title": data.title,
        ":body": data.body,
      },
      ConditionExpression: "attribute_exists(notesId)",
    };

    await documentClient.send(new UpdateCommand(params));
    return send(201, data);
  } catch (err) {
    return send(500, err.message);
  }
};

module.exports.deleteNode = async (event, context, callback) => {
  context.callbackWaitForEmptyEventLoop = false;

  let notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId,
      },
      ConditionExpression: "attribute_exists(notesId)",
    };
    await documentClient.send(new DeleteCommand(params));

    return send(201, notesId);
  } catch (err) {
    return send(500, err.message);
  }
};

module.exports.getAllNodes = async (event, context, callback) => {
  context.callbackWaitForEmptyEventLoop = false;

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    };
    const notes = await documentClient.send(new ScanCommand(params));
    console.log("--->", notes);

    return send(201, notes);
  } catch (err) {
    return send(500, err.message);
  }
};
