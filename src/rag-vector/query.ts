import dotenv from "dotenv";
dotenv.config();

import { OpenAIEmbeddings } from "@langchain/openai";
import * as neo4j from "./neo4j";
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  parse,
  printSchema,
  visit,
  ObjectTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
} from "graphql";
import { GQLPTClient } from "gqlpt";
import { AdapterOpenAI } from "@gqlpt/adapter-openai";
import { typeDefs } from "../local/schema";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const gqlptClient = new GQLPTClient({
  adapter: new AdapterOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  typeDefs,
});

const typeMap: { [key: string]: GraphQLObjectType | GraphQLInputObjectType } =
  {};

function getGraphQLType(type: any): any {
  if (typeof type === "string") {
    switch (type) {
      case "String":
        return GraphQLString;
      case "ID":
        return GraphQLID;
      default:
        return typeMap[type] || GraphQLString;
    }
  }
  if (type.kind === "NonNullType") {
    return new GraphQLNonNull(getGraphQLType(type.type));
  }
  if (type.kind === "ListType") {
    return new GraphQLList(getGraphQLType(type.type));
  }
  if (type.kind === "NamedType") {
    return getGraphQLType(type.name.value);
  }
  return GraphQLString;
}

function createType(
  node: ObjectTypeDefinitionNode | InputObjectTypeDefinitionNode
): GraphQLObjectType | GraphQLInputObjectType {
  const fields = {};
  // @ts-ignore
  node.fields.forEach((field) => {
    // @ts-ignore
    fields[field.name.value] = {
      type: getGraphQLType(field.type),
      // @ts-ignore
      args: field.arguments?.reduce((acc, arg) => {
        acc[arg.name.value] = { type: getGraphQLType(arg.type) };
        return acc;
      }, {}),
    };
  });

  if (node.kind === "ObjectTypeDefinition") {
    return new GraphQLObjectType({
      name: node.name.value,
      fields: fields,
    });
  } else {
    return new GraphQLInputObjectType({
      name: node.name.value,
      fields: fields,
    });
  }
}

async function query() {
  await neo4j.connect();
  await gqlptClient.connect();

  const plainText = "Find all user names";

  const queryVector = await embeddings.embedQuery(plainText);

  const session = neo4j.driver.session();

  const result = await session.run(
    `
    MATCH (n:SchemaNode {schemaHash: $schemaHash})
    WITH n, gds.similarity.cosine(n.vector, $queryVector) AS similarity
    ORDER BY similarity DESC
    LIMIT 20
    RETURN n.definition, n.kind, n.name, similarity
    `,
    { schemaHash: gqlptClient.schemaHash, queryVector }
  );

  const relevantNodes = result.records.map((record) => ({
    definition: record.get("n.definition"),
    kind: record.get("n.kind"),
    name: record.get("n.name"),
    similarity: record.get("similarity"),
  }));

  relevantNodes.forEach((node) => {
    if (node.kind === "ObjectType" || node.kind === "InputObjectType") {
      const ast = parse(node.definition);
      visit(ast, {
        ObjectTypeDefinition: (objectNode) => {
          typeMap[objectNode.name.value] = createType(objectNode);
        },
        InputObjectTypeDefinition: (inputNode) => {
          typeMap[inputNode.name.value] = createType(inputNode);
        },
      });
    }
  });

  const schemaConfig: any = {
    query: typeMap["Query"] as GraphQLObjectType,
  };
  if (typeMap["Mutation"]) {
    schemaConfig.mutation = typeMap["Mutation"] as GraphQLObjectType;
  }

  try {
    const schema = new GraphQLSchema(schemaConfig);
    const partialSchema = printSchema(schema);

    const client = new GQLPTClient({
      typeDefs: partialSchema,
      adapter: new AdapterOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
    });
    await client.connect();

    console.log(`Schema created:\n${partialSchema}`);

    const { query, variables } = await client.generateQueryAndVariables(
      plainText
    );

    console.log("Generated query:", query);
    console.log("Generated variables:", variables);
  } catch (error) {
    console.error("Error creating schema:", error);
  } finally {
    await session.close();
    process.exit();
  }
}

query();
