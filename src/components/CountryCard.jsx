import React from 'react'
export default function CountryCard({country, onClick}){
  const tz = country.timezone || '';
  const capital = country.capital || '';
  const now = tz ? new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',timeZone:tz}) : '';
  return (
    <div onClick={()=>onClick(country)} className="bg-gray-900/80 hover:bg-gray-800 cursor-pointer rounded p-3 flex flex-col gap-2 items-start">
      <div className="flex items-center gap-2">
        <div className="w-10 h-6 bg-gray-700 rounded flex items-center justify-center text-xs">{country.code||''}</div>
        <div className="font-semibold">{country.name}</div>
      </div>
      <div className="text-xs text-gray-400">{capital} • {now}</div>
    </div>
  )
}
