<<<<<<< HEAD
import React, {useEffect,useState} from 'react';
import Header from './components/Header';
import GlobeView from './components/GlobeView';
import ChannelList from './components/ChannelList';
import Player from './components/Player';
import { loadChannels } from './utils/fetchChannels';
export default function App(){ const [data,setData]=useState(null); const [selectedCountry,setSelectedCountry]=useState(null); const [playing,setPlaying]=useState(null); const [idx,setIdx]=useState(0);
 useEffect(()=>{ loadChannels().then(d=>{ if(!d) return; if(Array.isArray(d)) setData(d); else if(typeof d==='object'){ const arr=Object.entries(d).map(([k,v])=> ({ code:v.code||k, name:v.name||k, capital:v.capital, timezone:v.timezone, channels:v.channels||[] })); setData(arr);} else setData([]); }); },[]);
 function handleCountry(code){ if(!data) return; const c=data.find(x=> (x.code && x.code.toLowerCase()===String(code).toLowerCase()) || (x.name && x.name.toLowerCase()===String(code).toLowerCase())); if(c){ setSelectedCountry(c); setIdx(0); if(c.channels && c.channels.length>0) setPlaying(c.channels[0].url); else setPlaying(null);} }
 function handleEnded(){ if(!selectedCountry) return; const chs=selectedCountry.channels||[]; if(chs.length===0) return setPlaying(null); const next=(idx+1)%chs.length; setIdx(next); setPlaying(chs[next].url); }
 return (<div className="h-screen w-screen bg-black text-white"><Header/><GlobeView countries={data} onCountryClick={handleCountry}/><ChannelList country={selectedCountry} channels={selectedCountry?.channels} play={(url)=> setPlaying(url)}/><div className="fixed bottom-4 left-4 z-50 w-96 h-56 bg-black border border-gray-800 rounded shadow-lg overflow-hidden"><div className="p-2 bg-gray-900 flex justify-between items-center text-sm"><div className="font-bold">Now Playing</div><div className="text-xs text-gray-400">{selectedCountry?.name || ''}</div></div><div className="h-full"><Player stream={playing} onEnded={handleEnded}/></div></div></div>); }
=======
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";

function App() {
  const globeRef = useRef();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    // Load channel data
    fetch("/channels.json")
      .then((res) => res.json())
      .then((data) => setChannels(data))
      .catch((err) => console.error("Error loading channels:", err));
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-green-700 text-white text-center py-4 text-2xl font-bold">
        Gengas Garden
      </header>

      {/* Globe viewer */}
      <div className="flex-1 relative">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        />
      </div>

      {/* Channel list */}
      <div className="bg-gray-900 text-white p-4 overflow-x-auto flex space-x-4">
        {channels.map((ch, i) => (
          <button
            key={i}
            onClick={() => setSelectedChannel(ch)}
            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Video player */}
      {selectedChannel && (
        <div className="absolute bottom-4 right-4 bg-black shadow-lg rounded-lg overflow-hidden">
          <video
            src={selectedChannel.url}
            controls
            autoPlay
            className="w-96 h-56"
          />
        </div>
      )}
    </div>
  );
}

export default App;
>>>>>>> 4d606049b09a8e3be9534aeeef43d6207d736a47
