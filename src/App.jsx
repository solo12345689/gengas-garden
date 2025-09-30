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
