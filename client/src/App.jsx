import React, { useEffect, useState } from 'react';
import { usePlayer } from './context/PlayerContext';
import ChannelList from './components/ChannelList';
import FloatingPlayer from './components/FloatingPlayer';

export default function App(){
  const [countries, setCountries] = useState(null);
  const [selected, setSelected] = useState(null);
  const { playChannel } = usePlayer();

  useEffect(()=>{
    fetch('/api/channels')
      .then(r=>r.json())
      .then(data=> setCountries(data))
      .catch(e=>{ console.error('channels fetch failed', e); });
  },[]);

  if(!countries) return <div className="flex h-screen items-center justify-center">Loading...</div>

  const countryList = Object.values(countries);

  return (
    <div className="min-h-screen text-white">
      <header className="p-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-semibold">Gengas Garden</h1>
        <div className="text-sm text-gray-400">Live IPTV + YouTube</div>
      </header>
      <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {countryList.map((c,i)=> (
              <div key={i} className="card p-3 cursor-pointer" onClick={()=> setSelected(c)}>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-gray-400">{c.capital} • {c.timezone}</div>
              </div>
            ))}
          </div>
        </div>
        <aside className="md:col-span-1">
          {selected? <ChannelList country={selected} onClose={()=> setSelected(null)} /> : <div className="text-gray-400">Select a country to view channels</div>}
        </aside>
      </main>
      <FloatingPlayer />
    </div>
  )
}
