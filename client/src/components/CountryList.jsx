import React from 'react'
import ChannelCard from './ChannelCard'
export default function CountryList({countries,onSelect}){
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {countries.map((c,i)=> (
        <div key={i} onClick={()=> onSelect(c)}>
          <ChannelCard channel={c} />
        </div>
      ))}
    </div>
  )
}
