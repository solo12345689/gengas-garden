import React from 'react'
import { usePlayer } from '../context/PlayerContext'
export default function ChannelList({country, onClose}){
  const { setCurrent } = usePlayer()
  if(!country) return null
  const chs = country.channels || []
  return (
    <div className="fixed top-16 right-4 z-50 w-96 max-h-[70vh] overflow-y-auto card p-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-bold">{country.name}</div>
          <div className="text-xs text-gray-400">{country.capital} • {country.timezone}</div>
        </div>
        <button className="text-gray-400" onClick={onClose}>✕</button>
      </div>
      {chs.length===0? <div className="text-gray-500">No channels</div> : chs.map((ch,i)=> (
        <div key={i} className="p-2 rounded hover:bg-gray-800 cursor-pointer flex items-center gap-2" onClick={()=> setCurrent(ch)}>
          <div className="w-10 h-6 bg-gray-700 rounded flex items-center justify-center text-xs">{ch.type==='youtube'?'YT':'TV'}</div>
          <div className="flex-1">
            <div className="font-medium text-sm">{ch.name}</div>
            <div className="text-xs text-gray-400">{(ch.tags||[]).slice(0,3).join(', ')}</div>
          </div>
          <div className="text-xs text-gray-500">{ch.type}</div>
        </div>
      ))}
    </div>
  )
}
