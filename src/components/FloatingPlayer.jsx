import React, { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
export default function FloatingPlayer(){
  const { current, setCurrent } = usePlayer()
  const [streamUrl, setStreamUrl] = useState(null)
  useEffect(()=>{
    if(!current) return setStreamUrl(null)
    // if youtube, request backend for playable URL
    async function fetchStream(){
      try{
        if(current.type==='youtube'){
          const res = await fetch('/api/play?url='+encodeURIComponent(current.url))
          if(!res.ok) throw new Error('play failed')
          const j = await res.json()
          setStreamUrl(j.streamUrl)
        } else {
          setStreamUrl(current.url)
        }
      }catch(err){
        console.error('stream fetch error', err)
        setStreamUrl(null)
      }
    }
    fetchStream()
  },[current])

  if(!current) return null
  return (
    <div className="fixed bottom-4 right-4 z-60 w-96 h-56 card overflow-hidden">
      <div className="p-2 bg-gradient-to-r from-[#0e141a] to-[#081018] flex justify-between items-center text-sm">
        <div className="font-bold">{current.name}</div>
        <button onClick={()=> setCurrent(null)} className="text-gray-400">✕</button>
      </div>
      <div className="h-full bg-black flex items-center justify-center">
        {streamUrl? (
          <video key={streamUrl} src={streamUrl} controls autoPlay preload="auto" playsInline className="w-full h-full object-cover" onError={(e)=>{ try{ e.target.load(); }catch(err){} }} />
        ) : (
          <div className="text-gray-400">Preparing stream...</div>
        )}
      </div>
    </div>
  )
}
