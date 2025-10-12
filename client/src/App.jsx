import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import CountryList from './components/CountryList'
import ChannelList from './components/ChannelList'
import Player from './components/Player'

export default function App(){
  const [countries, setCountries] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(()=>{
    fetch('/api/channels')
      .then(r=>r.json())
      .then(data=> setCountries(data))
      .catch(e=> console.error('channels fetch failed', e))
  },[])

  if(!countries) return <div className="flex h-screen items-center justify-center">Loading channels...</div>

  const list = Object.values(countries)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-6 pt-20">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <CountryList countries={list} onSelect={setSelectedCountry} />
          </div>
          <aside className="md:col-span-1">
            {selectedCountry? <ChannelList country={selectedCountry} /> : <div className="p-4 text-gray-400">Select a country</div>}
          </aside>
        </div>
      </main>
      <Player />
    </div>
  )
}
