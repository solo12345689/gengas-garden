import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";
import { motion, AnimatePresence } from "framer-motion";
import { FaGlobe, FaSearch, FaTimes } from "react-icons/fa";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);

  // 🌍 Load map & channels
  useEffect(() => {
    (async () => {
      try {
        const world = await fetch("/world-110m.json").then((r) => r.json());
        const ch = await loadChannels();
        const features = topojson.feature(world, world.objects.countries);
        setWorldData(features);
        setChannels(ch);
        setFilteredCountries(Object.keys(ch));
      } catch (err) {
        console.error("Error loading data:", err);
      }
    })();
  }, []);

  // 🔎 Search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term.trim()) setFilteredCountries(Object.keys(channels));
    else {
      const filtered = Object.keys(channels).filter((c) =>
        c.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  // 🗺 Click on a country
  const handleCountryClick = (d) => {
    const name = d.properties.name;
    if (channels[name]) {
      setSelectedCountry(name);
    } else {
      console.log(`No match for ${name}`);
      setSelectedCountry(null);
    }
    setSelectedChannel(null);
  };

  // 🎥 Select a channel
  const handleChannelSelect = (ch) => setSelectedChannel(ch);
  const closePlayer = () => setSelectedChannel(null);

  return (
    <div className="relative w-full h-screen text-white overflow-hidden">
      {/* ✨ Starry Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#020617,_#000)]">
        <canvas
          id="stars"
          className="absolute inset-0"
          style={{ zIndex: 0 }}
        ></canvas>
      </div>

      {/* 🔝 Top Navigation Bar */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 py-3 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <FaGlobe className="text-cyan-400" />
          <h1 className="text-cyan-400 font-bold text-2xl tracking-wide">
            Genga TV
          </h1>
        </div>
        <div className="flex items-center bg-white/10 px-3 py-2 rounded-lg gap-2">
          <FaSearch className="text-cyan-400" />
          <input
            type="text"
            placeholder="Filter countries..."
            value={searchTerm}
            onChange={handleSearch}
            className="bg-transparent text-white focus:outline-none placeholder-gray-400 w-56"
          />
        </div>
      </div>

      {/* 🌐 Interactive Globe */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {worldData && (
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            backgroundColor="rgba(0,0,0,0)"
            polygonsData={worldData.features.filter(
              (d) => d.properties.ISO_A2 !== "AQ"
            )}
            polygonCapColor={() =>
              `rgba(${Math.floor(Math.random() * 255)}, ${
                Math.floor(Math.random() * 255)
              }, ${Math.floor(Math.random() * 255)}, 0.8)`
            }
            polygonSideColor={() => "rgba(0,0,0,0.15)"}
            polygonStrokeColor={() => "#111"}
            polygonLabel={({ properties: d }) => `${d.name}`}
            onPolygonClick={handleCountryClick}
          />
        )}
      </div>

      {/* 📜 Sidebar */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute right-0 top-16 w-80 h-[85vh] bg-black/70 backdrop-blur-md overflow-y-auto p-4 border-l border-cyan-500 z-50"
          >
            <h2 className="text-cyan-300 mb-3 text-lg font-semibold">
              {selectedCountry}
            </h2>
            {channels[selectedCountry] &&
            channels[selectedCountry].channels.length > 0 ? (
              channels[selectedCountry].channels.map((ch, i) => (
                <div
                  key={i}
                  onClick={() => handleChannelSelect(ch)}
                  className="cursor-pointer border-b border-gray-700 py-2 hover:text-cyan-300 transition"
                >
                  {ch.name}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No channels available</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎥 Video Player */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
          >
            <div className="relative w-[80%] max-w-3xl bg-black border border-cyan-500 rounded-2xl shadow-xl">
              <button
                onClick={closePlayer}
                className="absolute top-3 right-3 text-cyan-400 hover:text-red-400 text-2xl"
              >
                <FaTimes />
              </button>
              <div className="p-4 text-cyan-300 text-lg font-semibold">
                {selectedChannel.name}
              </div>
              <div className="w-full aspect-video">
                {selectedChannel.type === "youtube" ? (
                  <iframe
                    src={selectedChannel.url}
                    title={selectedChannel.name}
                    allowFullScreen
                    className="w-full h-full rounded-b-2xl"
                  />
                ) : (
                  <video
                    src={selectedChannel.url}
                    controls
                    autoPlay
                    className="w-full h-full rounded-b-2xl"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
