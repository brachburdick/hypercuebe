import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { essentiaRouter } from "./routers/essentia";
import { songsRouter } from "./routers/songs";
import { type createTRPCContext } from "./trpc";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";


/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  essentia: essentiaRouter,
  songs: songsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
