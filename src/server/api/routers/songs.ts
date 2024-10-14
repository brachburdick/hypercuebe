import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import createClient from "~/utils/supabase/api";
    
export const songsRouter = createTRPCRouter({
    getAllSongs: publicProcedure
      .query(async ({ctx}) => {
        try {
          const {data, error} = await ctx.supabase.storage.from('songs').list();
        //   console.log('initial call data', JSON.stringify(getSongsResponse, null, 2));
        return data;
        } catch (error) {
          console.error('Error fetching songs:', error);
          throw new Error('Failed to fetch songs');
        }
      }),
  });