import React, {useEffect,useState} from 'react'
import Header from './components/Header'
import CountryGrid from './components/CountryGrid'
import ChannelList from './components/ChannelList'
import FloatingPlayer from './components/FloatingPlayer'
import { loadChannels } from './utils/fetchChannels'

export default function App(){
  const [countries,setCountries]=useState(null)
  const [selected,setSelected]=useState(null)

  useEffect(()=>{
    loadChannels().then(data=>{
      if(!data) return;
      setCountries(data)
    })
  },[])

  return (
    <div className="min-h-screen min-w-screen text-white">
      <Header />
      <main className="pt-20">
        <CountryGrid countries={countries} onCountryClick={setSelected} />
        <div>{selected && <ChannelList country={selected} onClose={()=>setSelected(null)} />}</div>
        <FloatingPlayer />
      </main>
    </div>
  )
}
