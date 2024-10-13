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
      const fullAudioFilePath = path.join(process.cwd(),"public", input.audioFilePath);
      const pythonScriptPath = path.join(process.cwd(), 'scripts', 'GenerateBeatgrid.py');
      const venvPath = path.join(process.cwd(), 'scripts', 'venv');
      const pythonPath = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
    
      const command = `${pythonPath} ${pythonScriptPath} "${fullAudioFilePath}"`;

      try {
        // this is stupid. 
        // but it works.
        // improve later.
        // what is the expected out? Im getting stdout == stderr
        const { stdout, stderr } = await execAsync(command);
        
        
        if (stderr && stderr.trim() !== '') {
          console.warn('Python script stderr (non-empty):', stderr);
        }
  
        // Only try to parse stdout if it's not empty
        if (stdout && stdout.trim() !== '') {
          try {
            return JSON.parse(stdout);
          } catch (parseError) {
            console.error('Error parsing stdout as JSON:', parseError);
            throw new Error('Failed to parse beatgrid data');
          }
        } else {
          console.error('stdout is empty');
          throw new Error('No data returned from Python script');
        }
      } catch (error) {
        console.error('Error executing Python script:', error);
        throw new Error('Failed to generate beatgrid');
      }
    }),

  testEndpoint: publicProcedure.query(() => {
    return 'Hello, world!';
  }),
});
