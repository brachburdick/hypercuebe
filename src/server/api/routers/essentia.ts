import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path, { resolve } from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);
//https://on.soundcloud.com/nLdvpuk4hQnHKar98

export const essentiaRouter = createTRPCRouter({
    generateBeatgrid: publicProcedure
      .input(z.object({
        chunkResults: z.array(z.object({
          uploadId: z.string(),
          location: z.string()
        }))
      }))
      .mutation(async ({ input }) => {
        const { chunkResults } = input;
        if(!chunkResults || chunkResults.length === 0 || !chunkResults[0]) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No chunk results provided',
          });
          
        }
        // Create a temporary directory to store the consolidated file
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });
  
        const consolidatedFilePath = path.join(tempDir, `${chunkResults[0].uploadId}_consolidated.mp3`);
  
        try {
          // Consolidate chunks into a single file
          const writeStream = createWriteStream(consolidatedFilePath);
          for (const chunk of chunkResults) {
            const chunkData = await fs.readFile(chunk.location);
            await new Promise((resolve, reject) => {
              writeStream.write(chunkData, (error) => {
                if (error) reject(error);
                else resolve(null);
              });
            });
          }
          writeStream.close();
  
          // Execute the python script
          console.log('generateBeatgrid endpoint');
          const pythonScriptPath = path.join(process.cwd(), 'scripts', 'GenerateBeatgrid.py');
          const venvPath = path.join(process.cwd(), 'scripts', 'venv');
          const pythonPath = process.platform === 'win32'
            ? path.join(venvPath, 'Scripts', 'python.exe')
            : path.join(venvPath, 'bin', 'python');
        
          const command = `${pythonPath} ${pythonScriptPath} "${consolidatedFilePath}"`;
  
          const { stdout, stderr } = await execAsync(command);
          
          if (stderr && stderr.trim() !== '') {
            console.warn('Python script stderr (non-empty):', stderr);
          }
      
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
          console.error('Error processing file or executing Python script:', error);
          throw new Error('Failed to generate beatgrid');
        } finally {
          // Clean up: remove the consolidated file
        //   await fs.unlink(consolidatedFilePath).catch(console.error);
        }
      }),
  

    uploadFile: publicProcedure
    .input(z.object({
        method: z.enum(['url', 'upload']),
        url: z.string().url().optional().nullable(),
        file: z.object({
          name: z.string(),
          type: z.string(),
          data: z.string().base64(),
          chunk: z.number(),
          uploadId: z.string(),
          totalChunks: z.number()
          }).optional().nullable(),
        }))
        .mutation(async ({ input }) => {
          console.log('generating beatgrid in trpc');
          if(!input.file) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'File is required for upload method',
            });
          }
          let fullAudioFilePath: string;
    
            let uploadDir: string;
    
    
            
            try {
              // Save the uploaded file
              uploadDir = path.join(process.cwd(), 'public', 'uploads');
              await fs.mkdir(uploadDir, { recursive: true });
              console.log('directory successfully made. saving file to', uploadDir);
    
            } catch (error) {
              console.error('Error creating upload directory:', error);
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create upload directory',
              });
            };
    
    
            fullAudioFilePath = path.join(uploadDir, input.file.name);
    
            try {
              await fs.writeFile(fullAudioFilePath, input.file.data);
              console.log('saved file to', fullAudioFilePath);
            } catch (error) {
              console.error('Error saving uploaded file:', error);
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to save uploaded file',
              });
            }
            return {
              uploadId: input.file.uploadId,
              location: fullAudioFilePath
            }

        }),
    });
  