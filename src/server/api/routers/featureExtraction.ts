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
import createClient from '~/utils/supabase/api';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { stdout } from 'process';
import { spawn } from 'child_process';
const execAsync = promisify(exec);
//https://on.soundcloud.com/nLdvpuk4hQnHKar98

export const featureExtractionRouter = createTRPCRouter({
    extractFeatures: publicProcedure
        .input(z.object({
            songName: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            // Download the file from Supabase storage
            const { data, error } = await ctx.supabase.storage.from('songs').download(input.songName);
            if (error) throw error;

            // convert data to buffer
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Create a temporary file
            const tempDir = tmpdir();
            const tempAudioFilePath = path.join(tempDir, input.songName);


            let output = '';
            try {
                // Write the file to the temporary location
                await writeFile(tempAudioFilePath, buffer);

                // Execute the Python script
                console.log('extractFeatures endpoint');
                const pythonScriptPath = path.join(process.cwd(), 'scripts', 'ExtractFeatures.py');
                const venvPath = path.join(process.cwd(), 'scripts', 'venv');
                const pythonPath = process.platform === 'win32'
                    ? path.join(venvPath, 'Scripts', 'python.exe')
                    : path.join(venvPath, 'bin', 'python');

                // const command = `${pythonPath} ${pythonScriptPath} "${tempAudioFilePath}"`;
                // const { stdout, stderr } = await execAsync(command);

                console.log('Executing Python script:');
                console.log('Audio file:', tempAudioFilePath);
                console.log('Python script:', pythonScriptPath);
                console.log('Python interpreter:', pythonPath);

                const pythonProcess = spawn(pythonPath, [pythonScriptPath, tempAudioFilePath]);

                let stdoutData = '';
                let stderrData = '';

                pythonProcess.stdout.on('data', (data) => {
                    console.log('Received stdout chunk:', data.toString());
                    stdoutData += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    console.error('Received stderr chunk:', data.toString());
                    stderrData += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    console.log(`Python process exited with code ${code}`);

                    if (code !== 0) {
                        console.error('stderr output:');
                        console.error(stderrData);
                        throw new Error(`Python script exited with code ${code}`);
                    }

                    if (stdoutData.length === 0) {
                        console.error('stdout is empty');
                        throw new Error('No output from Python script');
                    }

                    try {
                        const features = JSON.parse(stdoutData);
                        return features;
                    } catch (parseError) {
                        console.error('Error parsing JSON:', parseError);
                        console.error('Raw stdout output:');
                        console.error(stdoutData);
                        throw new Error('Failed to parse features');
                    }
                });

                pythonProcess.on('error', (error) => {
                    console.error('Failed to start Python process:', error);
                    throw new Error('Failed to start Python process');    
                });
            } catch (error) {
                console.error('Error in extractFeatures:', error);
                throw error;
            }
        }),
});