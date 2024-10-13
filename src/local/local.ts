import { AdapterOpenAI } from "@gqlpt/adapter-openai";
import dotenv from "dotenv";
dotenv.config();

import { GQLPTClient } from "gqlpt";
import { schema } from "./schema";

const client = new GQLPTClient({
  schema,
  adapter: new AdapterOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

async function findAllUserNames() {
  const query = "Find all user names";

  const response = await client.generateAndSend(query);

  return response;
}

async function findLoginsByAlice() {
  const query = "Find all the logins by alice";

  const response = await client.generateAndSend(query);

  return response;
}

async function main() {
  await client.connect();

  const logins = await findLoginsByAlice();

  console.log("Alice Logins", JSON.stringify(logins, null, 2));

  const userNames = await findAllUserNames();

  console.log("User Names", JSON.stringify(userNames, null, 2));
}

main();
