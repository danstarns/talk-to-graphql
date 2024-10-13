import { createSchema } from "graphql-yoga";
import path from "path";
import fs from "fs";

const users = [
  { id: "1", name: "Alice Johnson" },
  { id: "2", name: "Bob Smith" },
  { id: "3", name: "Charlie Brown" },
];

const logins = [
  { id: "1", createdAt: "2024-10-15T10:30:00Z", userId: "1" },
  { id: "2", createdAt: "2024-10-16T14:45:00Z", userId: "2" },
  { id: "3", createdAt: "2024-10-17T09:15:00Z", userId: "3" },
  { id: "4", createdAt: "2024-10-17T16:20:00Z", userId: "1" },
  { id: "5", createdAt: "2024-10-18T11:00:00Z", userId: "2" },
];

export const typeDefs = fs.readFileSync(
  path.join(__dirname, "schema.graphql"),
  "utf-8"
);

const resolvers = {
  Query: {
    logins: (_: any, { where }: any) => {
      let filteredLogins = logins;

      if (where) {
        if (where.date) {
          if (where.date.gt) {
            filteredLogins = filteredLogins.filter(
              (login) => new Date(login.createdAt) > new Date(where.date.gt)
            );
          }
          if (where.date.lt) {
            filteredLogins = filteredLogins.filter(
              (login) => new Date(login.createdAt) < new Date(where.date.lt)
            );
          }
        }
        if (where.user && where.user.name) {
          const user = users.find((u) =>
            u.name.toLowerCase().includes(where.user.name.toLowerCase())
          );
          if (user) {
            filteredLogins = filteredLogins.filter(
              (login) => login.userId === user.id
            );
          } else {
            return [];
          }
        }
      }

      return filteredLogins;
    },
    users: (_: any, { where }: any) => {
      if (where && where.name) {
        return users.filter((user) =>
          user.name.toLowerCase().includes(where.name.toLowerCase())
        );
      }
      return users;
    },
  },
  Login: {
    user: (parent: any) => users.find((user) => user.id === parent.userId),
  },
  User: {
    logins: (parent: any) =>
      logins.filter((login) => login.userId === parent.id),
  },
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});
