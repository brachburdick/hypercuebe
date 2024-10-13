import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);
//https://on.soundcloud.com/nLdvpuk4hQnHKar98
async function downloadFile(url: string): Promise<string> {
    console.log('downloading file from url', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
  
    const contentType = response.headers.get('content-type');
    const extension = contentType ? `.${contentType.split('/')[1]}` : '';
    const fileName = `${uuidv4()}${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
  
    const fileStream = createWriteStream(filePath);
    await pipeline(response.body as any, fileStream);
    
    return filePath;
  }
  
  

export const essentiaRouter = createTRPCRouter({
  generateBeatgrid: publicProcedure
  .input(z.object({
    method: z.enum(['url', 'upload']),
    url: z.string().url().optional().nullable(),
    file: z.object({
      name: z.string(),
      type: z.string(),
      data: z.instanceof(Buffer)
      }).optional().nullable(),
    }))
    .mutation(async ({ input }) => {
        console.log('generating beatgrid', input);
        let fullAudioFilePath: string;

    // handle url case
      if (input.method === 'url') {
        console.log('URL');
        if (!input.url) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'URL is required for url method',
          });
        }
        try {
          // Download the file from the URL
          // This is a placeholder. You'll need to implement the download logic
          fullAudioFilePath = await downloadFile(input.url);
        } catch (error) {
          console.error('Error downloading file:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to download file from URL',
          });
        }



      // handle file upload case
      } else if (input.method === 'upload') {
        console.log('UPLOAD');
        if (!input.file) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'File is required for upload method',
          });
        }
        try {
          // Save the uploaded file
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });
          fullAudioFilePath = path.join(uploadDir, input.file.name);
          await fs.writeFile(fullAudioFilePath, input.file.data);
        } catch (error) {
          console.error('Error saving uploaded file:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to save uploaded file',
          });
        }
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid method',
        });
      }

      // execute the python script
      console.log('generateBeatgrid endpoint');
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
