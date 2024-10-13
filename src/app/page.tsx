'use client'
import React, { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";


export default function Home() {
  const [markers, setMarkers] = useState<number[]>([]);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

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
  }, []);


  async function generateBeatgrid(audioFilePath: string) {
    try {
      const response = await fetch('/api/essentia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioFilePath }),
      });
  
      if (!response.ok) {
        throw new Error('API request failed');
      }
  
      const data = await response.json();
      console.log('Beatgrid data:', data);
      // Handle the returned data as needed
    } catch (error) {
      console.error('Error generating beatgrid:', error);
      // Handle the error appropriately
    }
  }


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-3xl">
        <h1>HyperCuebe</h1>
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
          Markers: {markers.map((time, index) => (
            <span key={index}>{time.toFixed(2)}s </span>
          ))}

          <button
            onClick={() => generateBeatgrid('/audio/Humidity-Full.wav')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Clear Markers
          </button>

        </div>
      </main>
    </div>
  );
}
