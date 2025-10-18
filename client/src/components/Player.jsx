import React from 'react'
import ReactPlayer from 'react-player'
export default function Player({channel, onClose}){
  if(!channel) return null;
  if(channel.type==='youtube'){
    const yt = channel.url;
    return (
      <div className="fixed bottom-4 left-4 z-50 w-96 h-56 bg-black border border-gray-800 rounded shadow-lg p-1">
        <div className="p-2 bg-gray-900 text-sm flex justify-between"><div className="font-bold">YouTube channel</div><button onClick={onClose} className="text-gray-400">✕</button></div>
        <div className="p-3 text-sm text-gray-400">This is a YouTube stream — it will open in a new tab when you click the 'Open' button.<div className="mt-2"><a className="text-blue-400" href={yt} target="_blank" rel="noopener noreferrer">Open on YouTube</a></div></div>
      </div>
    )
  }
  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 h-56 bg-black border border-gray-800 rounded shadow-lg overflow-hidden">
      <div className="p-2 bg-gray-900 flex justify-between items-center text-sm"><div className="font-bold">Now Playing</div><button onClick={onClose} className="text-gray-400">✕</button></div>
      <div className="h-full">
        <ReactPlayer url={channel.url} playing controls width='100%' height='100%' />
      </div>
    </div>
  )
}
