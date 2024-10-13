import dotenv from "dotenv";
dotenv.config();

import * as neo4j from "./neo4j";
import { typeDefs } from "../local/schema";
import { GQLPTClient } from "gqlpt";
import { OpenAIEmbeddings } from "@langchain/openai";

import { AdapterOpenAI } from "@gqlpt/adapter-openai";
import { parse, print, visit } from "graphql";

const gqlptClient = new GQLPTClient({
  adapter: new AdapterOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  typeDefs,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function upload() {
  await neo4j.connect();
  await gqlptClient.connect();
  const session = neo4j.driver.session();

  await session.run(
    "MATCH (n:SchemaNode {schemaHash: $schemaHash}) DETACH DELETE n",
    { schemaHash: gqlptClient.schemaHash }
  );

  const schemaNodes: any = [];
  const parsedSchema = parse(gqlptClient.getTypeDefs() as string);
  visit(parsedSchema, {
    ObjectTypeDefinition: (node) => {
      const typeNode = {
        name: node.name.value,
        kind: "ObjectType",
        definition: print(node),
        schemaHash: gqlptClient.schemaHash,
      };
      schemaNodes.push(typeNode);

      for (const field of node?.fields || []) {
        const fieldNode = {
          name: field.name.value,
          kind: "Field",
          type: field.type.toString(),
          definition: print(field),
          schemaHash: gqlptClient.schemaHash,
          parentType: node.name.value,
        };
        schemaNodes.push(fieldNode);
      }
    },
  });

  for (const node of schemaNodes) {
    const vector = await embeddings.embedQuery(JSON.stringify(node));

    if (node.kind === "ObjectType") {
      await session.run(
        `
        CREATE (n:SchemaNode:ObjectType)
        SET n = $props
        SET n.vector = $vector
        `,
        {
          props: node,
          vector,
        }
      );
    } else if (node.kind === "Field") {
      await session.run(
        `
        MATCH (t:SchemaNode {name: $parentType, schemaHash: $schemaHash})
        CREATE (f:SchemaNode:Field)
        SET f = $props
        SET f.vector = $vector
        CREATE (t)-[:HAS_FIELD]->(f)
        `,
        {
          parentType: node.parentType,
          props: node,
          vector,
          schemaHash: gqlptClient.schemaHash,
        }
      );
    }
  }

  await session.close();

  console.log("Schema uploaded to Neo4j");

  process.exit();
}

upload();
