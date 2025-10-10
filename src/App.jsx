import React, {useEffect,useState} from 'react'
import Header from './components/Header'
import CountryGrid from './components/CountryGrid'
import ChannelList from './components/ChannelList'
import Player from './components/Player'
import { loadChannels } from './utils/fetchChannels'

export default function App(){
  const [countries,setCountries]=useState(null)
  const [selected,setSelected]=useState(null)
  const [playing,setPlaying]=useState(null)

  useEffect(()=>{
    loadChannels().then(data=>{
      if(!data) return;
      setCountries(data)
    })
  },[])

  function onCountryClick(country){
    setSelected(country)
  }
  function onPlay(ch){
    if(ch.type==='youtube'){
      window.open(ch.url, '_blank', 'noopener')
    } else {
      setPlaying(ch)
    }
  }
  return (
    <div className="min-h-screen min-w-screen bg-black text-white">
      <Header />
      <main className="pt-20">
        <CountryGrid countries={countries} onCountryClick={onCountryClick} />
        <ChannelList country={selected} onPlay={onPlay} onClose={()=>setSelected(null)} />
        <Player channel={playing} onClose={()=>setPlaying(null)} />
      </main>
    </div>
  )
}
