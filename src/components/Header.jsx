import React from 'react'
export default function Header(){
  return (
    <header className="fixed top-4 left-4 z-50 flex items-center gap-3">
      <div className="w-10 h-8 flex items-center justify-center rounded header-brand text-black font-bold">TV</div>
      <div className="text-xl font-bold">Gengas Garden</div>
    </header>
  )
}
