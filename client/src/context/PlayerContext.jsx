import React, { createContext, useContext, useState, useRef } from 'react';
const PlayerContext = createContext();
export function usePlayer(){ return useContext(PlayerContext); }
export function PlayerProvider({children}){
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const playChannel = (ch)=>{ setCurrentChannel(ch); setIsPlaying(true); }
  return (
    <PlayerContext.Provider value={{ currentChannel, isPlaying, videoRef, playChannel, setIsPlaying }}>
      {children}
    </PlayerContext.Provider>
  )
}
