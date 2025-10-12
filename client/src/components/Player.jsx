import React, { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { requestStream } from '../utils/api'

export default function Player(){
  const { currentChannel, videoRef, setIsPlaying } = usePlayer();
  const [streamUrl, setStreamUrl] = useState(null);

  useEffect(()=>{
    setStreamUrl(null);
    if(!currentChannel) return;
    if(currentChannel.type==='youtube'){
      requestStream(currentChannel.url).then(j=> setStreamUrl(j.streamUrl)).catch(()=> setStreamUrl(null));
    } else {
      setStreamUrl(currentChannel.url);
    }
  },[currentChannel]);

  if(!currentChannel) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-60 card overflow-hidden">
      <div className="p-2 bg-gradient-to-r from-[#0e141a] to-[#081018] flex justify-between items-center">
        <div className="font-bold">{currentChannel.name}</div>
        <button onClick={()=> setIsPlaying(false)} className="text-gray-400">✕</button>
      </div>
      <div className="h-full bg-black flex items-center justify-center">
        {streamUrl ? (
          <video ref={videoRef} key={streamUrl} src={streamUrl} controls autoPlay preload="auto" playsInline className="w-full h-full object-cover" onError={(e)=>{ try{ e.target.load(); }catch(err){} }} />
        ) : (
          <div className="text-gray-400">Preparing stream...</div>
        )}
      </div>
    </div>
  )
}
