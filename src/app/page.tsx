'use client'
import React, { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { api } from '~/trpc/react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [markers, setMarkers] = useState<number[]>([]);
  const [predictedBPM, setPredictedBPM] = useState<number | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const beatgridMutation = api.essentia.generateBeatgrid.useMutation();
  const uploadMutation = api.essentia.uploadFile.useMutation();

  const [audioSource, setAudioSource] = useState<string>('/audio/Humidity-Full.wav');
  const [audioFile, setAudioFile] = useState<File | null>(null);


  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#4F4A85',
      progressColor: '#383351',
      url: '/audio/Humidity-Full.wav',
    });

    wavesurferRef.current = wavesurfer;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        wavesurfer.playPause();
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (event.shiftKey && wavesurferRef.current && waveformRef.current) {
        const rect = waveformRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const duration = wavesurferRef.current.getDuration();
        const clickTime = (clickX / rect.width) * duration;
        setMarkers(prevMarkers => [...prevMarkers, clickTime]);
      } else {
        wavesurfer.play();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    waveformRef.current?.addEventListener('click', handleClick);

    return () => {
      wavesurfer.destroy();
      window.removeEventListener('keydown', handleKeyPress);
      waveformRef.current?.removeEventListener('click', handleClick);
    };
  }, [audioSource]);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('handleFileUpload', file);
    if (!file) return;
  
    try {
      setAudioFile(file);
      setAudioSource(URL.createObjectURL(file)); // This will update the WaveSurfer display
  
      const chunkSize = 1024 * 1024; // 1MB chunks
      const chunks = Math.ceil(file.size / chunkSize);
      let offset = 0;
      const uploadId = uuidv4(); // Generate a unique ID for this upload session
      let uploadResult;
      let beatgridResult;
      let chunkResults: {uploadId: string, location: string}[] = [];
      for (let i = 0; i < chunks; i++) {
        const chunk = file.slice(offset, offset + chunkSize);
        const arrayBuffer = await chunk.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const base64 = btoa(
          uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
  
        uploadResult = await uploadMutation.mutateAsync({
          method: 'upload',
          file: {
            name: file.name,
            type: file.type,
            data: base64,
            chunk: i,
            uploadId: uploadId,
            totalChunks: chunks
          }
        });
        chunkResults.push(uploadResult);
        offset += chunkSize;
      }
  
      beatgridResult = await beatgridMutation.mutateAsync({
        chunkResults: chunkResults
      });
  
      // Handle the final result
      if (beatgridResult?.beats && beatgridResult?.bpm) {
        setMarkers(beatgridResult.beats);
        setPredictedBPM(beatgridResult.bpm);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const clearMarkers = () => {
    setMarkers([]);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-3xl">
        <h1>HyperCuebe</h1>
        <h2>Generate beatgrid timestamps for your audio files</h2>
        <h3>Paste a url or upload a file</h3>
        <div className="w-full">
        
        <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="w-full p-2 border rounded mb-4"
      />
        </div>
        <div className="relative w-full">
          <div id="waveform" ref={waveformRef} className="w-full h-32" />
          {markers.map((time, index) => (
            <div 
              key={index} 
              style={{left: `${(time / (wavesurferRef.current?.getDuration() || 1)) * 100}%`}}
              className="absolute top-0 w-px h-full bg-red-500 z-10 transition-all duration-200 ease-in-out hover:scale-[1.2] hover:bg-red-700" 
            />
          ))}
        </div>
        <div className="flex flex-col items-center gap-4">
          {/* Markers: {markers.map((time, index) => (
            <span key={index}>{time.toFixed(2)}s </span>
          ))} */}
          <button
        onClick={() => {
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput instanceof HTMLElement) {
            fileInput.click();
          }
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Generate Beatgrid from Upload
      </button>

          <button
            onClick={clearMarkers}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Clear Markers
          </button>


        </div>
      </main>
    </div>
  );
}
