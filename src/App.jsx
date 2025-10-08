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
