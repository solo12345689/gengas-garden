import React from 'react'
export default function ChannelCard({channel, onClick}){
  const name = channel.name || channel.title || channel.code || 'Country'
  return (
    <div className="card p-3 cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-12 h-8 bg-gray-800 rounded" />
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-400">{channel.capital || ''}</div>
        </div>
      </div>
    </div>
  )
}
