# Talk to GraphQL with GQLPT

This repository demonstrates the usage of GQLPT (GraphQL Plain Text) to query a GraphQL API using natural language. It uses the GitHub GraphQL API as an example.

## Setup

1. Clone this repository:

   ```
   git clone https://github.com/danstarns/talk-to-graphql
   cd talk-to-graphql
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   GQLPT_URL="https://api.github.com/graphql"
   GQLPT_HEADERS='{"Authorization": "Bearer YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"}'
   OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
   GQLPT_ADAPTER="openai"
   ```
   Replace `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN` with your actual GitHub Personal Access Token and `YOUR_OPENAI_API_KEY` with your OpenAI API key.

## Usage

1. Generate types:

   ```
   npm run generate
   ```

   This command will generate TypeScript types based on the GraphQL schema.

2. Run the application:
   ```
   npm run start
   ```
   This will execute the main script, which demonstrates querying the GitHub GraphQL API using plain text.

## What the Code Does

The main script (`index.ts`) does the following:

1. Sets up a GQLPT client using the GitHub GraphQL API URL and your OpenAI API key.
2. Defines two functions:
   - `getLatestGraphQLIssue()`: Retrieves the latest issue from the graphql/graphql-js repository.
   - `getGraphQLStarCount()`: Fetches the star count of the graphql/graphql-js repository.
3. In the `main()` function, it calls both of these functions and logs the results.

## Customization

Feel free to modify the plain text queries in the `getLatestGraphQLIssue()` and `getGraphQLStarCount()` functions to experiment with different queries to the GitHub GraphQL API.

## Troubleshooting

If you encounter any issues:

- Ensure all environment variables in the `.env` file are set correctly.
- Check that your GitHub Personal Access Token has the necessary permissions.
- Verify that your OpenAI API key is valid and has sufficient credits.

For any other problems, please open an issue in this repository.

## License

[MIT License](LICENSE)
