import React, { useRef, useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
export default function FloatingPlayer(){
  const { current, setCurrent } = usePlayer()
  const [embedUrl, setEmbedUrl] = useState(null)
  useEffect(()=>{
    if(!current) return setEmbedUrl(null)
    if(current.type==='youtube'){
      let u = current.url
      if(u.includes('watch?v=')) u = u.replace('watch?v=','embed/')
      u = u.replace('youtube.com','www.youtube-nocookie.com')
      setEmbedUrl(u)
    } else {
      setEmbedUrl(null)
    }
  },[current])
  if(!current) return null
  return (
    <div className="fixed bottom-4 right-4 z-60 w-96 h-56 card overflow-hidden">
      <div className="p-2 bg-gradient-to-r from-[#0e141a] to-[#081018] flex justify-between items-center text-sm">
        <div className="font-bold">{current.name}</div>
        <button onClick={()=> setCurrent(null)} className="text-gray-400">✕</button>
      </div>
      <div className="h-full bg-black">
        {current.type==='youtube' && embedUrl? (
          <iframe src={embedUrl} title={current.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
        ) : (
          <video key={current.url} src={current.url} controls autoPlay preload="auto" playsInline className="w-full h-full object-cover" onEnded={()=>{ /* no auto-play */ }} onError={(e)=>{ try{ e.target.load(); }catch(err){} }} />
        )}
      </div>
    </div>
  )
}
