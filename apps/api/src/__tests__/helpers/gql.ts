import { print, type DocumentNode } from 'graphql';

export type GraphQLExec = (args: { query: string; variables?: Record<string, unknown> }) => Promise<any>;

export async function execGql<TData>(exec: GraphQLExec, args: { query: DocumentNode; variables?: Record<string, unknown> }) {
  return exec({
    query: print(args.query),
    variables: args.variables ?? {},
  }) as Promise<TData>;
}