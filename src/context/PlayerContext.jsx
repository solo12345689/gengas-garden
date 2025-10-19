import React, { createContext, useContext, useState } from 'react'
const PlayerContext = createContext()
export const usePlayer = () => useContext(PlayerContext)
export const PlayerProvider = ({children}) => {
  const [current, setCurrent] = useState(null)
  return <PlayerContext.Provider value={{current, setCurrent}}>{children}</PlayerContext.Provider>
}
