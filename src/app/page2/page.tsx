'use client';

import { api } from '~/trpc/react';

export default function Home() {
  // const generateBeatgrid = trpc.essentia.generateBeatgrid.useMutation();
  const generateBeatgrid = api.essentia.generateBeatgrid.useMutation();
  const handleGenerateBeatgrid = async () => {
    console.log('clicked - generateBeatgrid');
    try {
      const result = await generateBeatgrid.mutateAsync({ audioFilePath: '/audio/Humidity-Full.wav' });
      console.log('Beatgrid result:', result);
    } catch (error) {
      console.error('Error generating beatgrid:', error);
    }
  };

  return (
    <div>
      <h1>Essentia Beatgrid Generator</h1>
      <button onClick={handleGenerateBeatgrid}>Generate Beatgrid</button>
      {generateBeatgrid.isPending && <p>Generating beatgrid...</p>}
      {generateBeatgrid.isError && <p>Error: {generateBeatgrid.error.message}</p>}
    </div>
  );
}