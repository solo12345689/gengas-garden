import React from 'react';
import ReactPlayer from 'react-player';
export default function Player({stream,onEnded}){ if(!stream) return <div className="h-full flex items-center justify-center text-gray-400">No stream</div>; return (<ReactPlayer url={stream} playing controls width='100%' height='100%' onEnded={onEnded}/>)}
