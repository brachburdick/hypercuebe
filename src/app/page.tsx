'use client'
import React, { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { api } from '~/trpc/react';
import { v4 as uuidv4 } from 'uuid';
import SongSelectionDropdown from './_components/songSelectionDropdown';
import { FileObject } from "@supabase/storage-js";
import { createClient } from "~/utils/supabase/component"

export default function Home() {
  const supabase = createClient();
  const {data:songData} = api.songs.getAllSongs.useQuery();
  const [currentSongName, setCurrentSongName] = useState<string>('Select a song');
  const [currentSongUrl, setCurrentSongUrl] = useState<string>('');
  const [markers, setMarkers] = useState<number[]>([]);
  const [predictedBPM, setPredictedBPM] = useState<number | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const beatgridMutation = api.essentia.generateBeatgrid.useMutation();
  // const uploadMutation = api.essentia.uploadFile.useMutation();

  const [audioSource, setAudioSource] = useState<string>('/audio/Humidity-Full.wav');
  const [audioFile, setAudioFile] = useState<File | null>(null);


  useEffect(() => {
        console.log(`currentSongUrl: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/songs/${currentSongName}`);

 
  const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4F4A85',
    progressColor: '#383351',
    url: currentSongUrl,
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



  const clearMarkers = () => {
    setMarkers([]);
  }
  // const handleSongSelection = (song: FileObject) => {
  //   setCurrentSongName(song.name);
  //   setCurrentSongUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/songs/${song.name}`);
  //   console.log(`currentSongUrl: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/songs/${song.name}`);

  // }

  const handleSongSelection = async (song: FileObject) => {
    setCurrentSongName(song.name);
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/songs/${song.name}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('songs')
        .download(song.name);
      
      if (error) throw error;
      
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const objectUrl = URL.createObjectURL(blob);
      setCurrentSongUrl(objectUrl);
    } catch (error) {
      console.error('Error downloading the song:', error);
      // Handle the error appropriately
    }
  }
  const handleGenerateBeatgrid = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('clicked - generateBeatgrid');
   
  };
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-3xl">
        <h1>HyperCuebe</h1>
        <h4>Select a song/snippet in our db to generate cues</h4>
        <div className="w-full">
        

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
            Clear grid markers
           </button>
          <SongSelectionDropdown songs={songData || []} currentSongName={currentSongName} chooseSong={handleSongSelection}/>
         

        </div>
      </main>
    </div>
  );
}
