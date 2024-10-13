import { AdapterOpenAI } from "@gqlpt/adapter-openai";
import dotenv from "dotenv";
dotenv.config();

import { GQLPTClient } from "gqlpt";

const client = new GQLPTClient({
  url: process.env.GQLPT_URL,
  adapter: new AdapterOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  headers: JSON.parse(process.env.GQLPT_HEADERS as string),
});

async function getLatestGraphQLIssue() {
  const query =
    "Find the latest issue on the graphql/graphql-js repo and include the title createdAt and body";

  const response = await client.generateAndSend(query);

  return response;
}

async function getGraphQLStarCount() {
  const query = "Find the star count of the graphql/graphql-js repo";

  const response = await client.generateAndSend(query);

  return response;
}

async function main() {
  await client.connect();

  const latestIssue = await getLatestGraphQLIssue();

  const starCount = await getGraphQLStarCount();

  console.log("Latest Issue", JSON.stringify(latestIssue, null, 2));

  console.log("Star Count", JSON.stringify(starCount, null, 2));
}

main();
