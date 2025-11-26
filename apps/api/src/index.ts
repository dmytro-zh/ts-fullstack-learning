import { startStandaloneServer } from '@apollo/server/standalone';
import { createApolloServer } from './server';

const server = createApolloServer();

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({}),
}).then(({ url }) => {
  console.log(`GraphQL ready at ${url}`);
});
