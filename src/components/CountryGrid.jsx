import React from 'react'
import CountryCard from './CountryCard'
export default function CountryGrid({countries,onCountryClick}){
  if(!countries) return <div className="p-6 text-gray-400">Loading countries...</div>
  const list = Object.values(countries);
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {list.map((c,i)=> <CountryCard key={i} country={c} onClick={onCountryClick} />)}
    </div>
  )
}
