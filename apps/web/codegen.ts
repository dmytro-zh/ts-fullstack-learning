import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Use local API SDL to avoid depending on a running server during codegen.
  schema: '../api/schema.graphql',
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    './src/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
