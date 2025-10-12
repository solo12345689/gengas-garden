import React from 'react'
import { usePlayer } from '../context/PlayerContext'
import ChannelCard from './ChannelCard'
export default function ChannelList({country}){
  const { playChannel } = usePlayer();
  const chs = country.channels || [];
  return (
    <div>
      <div className="font-bold mb-2">{country.name} — Channels</div>
      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {chs.map((ch,i)=> <div key={i}><ChannelCard channel={ch} onClick={()=> playChannel(ch)} /></div>)}
      </div>
    </div>
  )
}
