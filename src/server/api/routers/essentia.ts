import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const execAsync = promisify(exec);

export const essentiaRouter = createTRPCRouter({
  generateBeatgrid: publicProcedure
    .input(z.object({ audioFilePath: z.string() }))
    .mutation(async ({ input }) => {
    
      console.log('generateBeatgrid endpoint');
      const fullAudioFilePath = path.join(process.cwd(), input.audioFilePath);
      const pythonScriptPath = path.join(process.cwd(), 'scripts', 'GenerateBeatgrid.py');
      const venvPath = path.join(process.cwd(), 'scripts', 'venv');
      const pythonPath = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
    
    console.log('check this out',pythonPath, pythonScriptPath, fullAudioFilePath);
      const command = `${pythonPath} ${pythonScriptPath} "${fullAudioFilePath}"`;

      try {
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          throw new Error(`Python script error: ${stderr}`);
        }

        return JSON.parse(stdout);
      } catch (error) {
        console.error('Error executing Python script:', error);
        throw new Error('Failed to generate beatgrid');
      }
    }),

  testEndpoint: publicProcedure.query(() => {
    return 'Hello, world!';
  }),
});
