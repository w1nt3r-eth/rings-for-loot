import * as trpc from '@trpc/server';
import whitelist from './whitelist';

export const appRouter = trpc.router().merge('whitelist.', whitelist);

// export type definition of API
export type AppRouter = typeof appRouter;
