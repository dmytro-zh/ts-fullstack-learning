import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

export type GraphQLContext = {
  auth: {
    userId: string | null;
    role: AppRole | null;
  };
};
