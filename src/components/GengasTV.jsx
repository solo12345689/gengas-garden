import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaPlay, FaSearch, FaTimes } from "react-icons/fa";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [playerChannel, setPlayerChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // 🗺️ Load world map data
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/countries.geojson.txt"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("🌍 Loaded countries:", data.features?.length);
        setWorldData(data);
      })
      .catch((err) => console.error("❌ Error loading world data:", err));
  }, []);

  // 📡 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      console.log("✅ Channels loaded:", data ? Object.keys(data).length : 0);
      if (data) setChannels(data);
    })();
  }, []);

  // 🎨 Setup globe with multi-color
  useEffect(() => {
    if (!worldData || !globeRef.current) return;

    const g = globeRef.current;
    if (typeof g.polygonsData !== "function") return;

    const colorPalette = [
      "#FF6B6B",
      "#4ECDC4",
      "#FFD93D",
      "#1A535C",
      "#FF9F1C",
      "#2EC4B6",
      "#E71D36",
      "#9B5DE5",
      "#00BBF9",
      "#F15BB5",
    ];

    g.polygonsData(worldData.features)
      .polygonCapColor(() => colorPalette[Math.floor(Math.random() * colorPalette.length)])
      .polygonSideColor(() => "rgba(0,0,0,0.2)")
      .polygonStrokeColor(() => "#222")
      .polygonAltitude(() => 0.02)
      .onPolygonClick((country) => {
        const name = country?.properties?.name;
        if (name && channels[name]) {
          setSelectedCountry(name);
          setPlayerChannel(null);
        }
      });

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.4;
  }, [worldData, channels]);

  // 🔍 Search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) return setSuggestions([]);
    const matches = Object.keys(channels)
      .filter((c) => c.toLowerCase().includes(term))
      .slice(0, 5);
    setSuggestions(matches);
  };

  const handleSelectSuggestion = (country) => {
    setSelectedCountry(country);
    setSuggestions([]);
  };

  const selectedChannels = channels[selectedCountry]?.channels || [];

  // 📺 Channel click
  const handleChannelClick = (ch) => {
    setPlayerChannel(ch);
  };

  const closePlayer = () => {
    setPlayerChannel(null);
    setSelectedCountry(null);
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-white"
      style={{
        background: "radial-gradient(circle at 30% 20%, #04061a 0%, #000010 100%)",
      }}
    >
      {/* 🌍 Globe */}
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="#000000"
        />
      </div>

      {/* 🧭 Top bar */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4 bg-black/40 backdrop-blur-sm z-50">
        <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
          🌍 <span className="text-cyan-400">Genga TV</span>
        </h1>
        {selectedCountry && !playerChannel && (
          <button
            onClick={() => setSelectedCountry(null)}
            className="text-white/80 hover:text-white bg-green-600/80 px-4 py-2 rounded-full flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </button>
        )}
      </div>

      {/* 🔍 Search box */}
      {!selectedCountry && !playerChannel && (
        <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 w-96 text-center z-50">
          <div className="relative">
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search country..."
              className="w-full p-3 rounded-md bg-black/70 border border-white/20 text-white outline-none placeholder-gray-400"
            />
            <FaSearch className="absolute right-3 top-3 text-white/50" />
          </div>
          {suggestions.length > 0 && (
            <ul className="bg-black/90 mt-2 rounded-md border border-white/10 text-left">
              {suggestions.map((c) => (
                <li
                  key={c}
                  className="p-2 hover:bg-white/10 cursor-pointer"
                  onClick={() => handleSelectSuggestion(c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 📜 Sidebar for country channels */}
      <AnimatePresence>
        {selectedCountry && !playerChannel && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4 }}
            className="absolute right-0 top-0 h-full w-80 bg-black/70 backdrop-blur-lg p-4 overflow-y-auto z-40"
          >
            <h2 className="text-xl font-semibold mb-3 text-cyan-400">
              {selectedCountry} Channels
            </h2>
            {selectedChannels.length === 0 && (
              <p className="text-gray-400">No channels available</p>
            )}
            <ul>
              {selectedChannels.map((ch, i) => (
                <li
                  key={i}
                  onClick={() => handleChannelClick(ch)}
                  className="p-2 hover:bg-white/10 cursor-pointer flex justify-between items-center"
                >
                  {ch.name}
                  <FaPlay className="text-xs" />
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 Player (centered) */}
      <AnimatePresence>
        {playerChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50"
          >
            <div className="relative w-[80%] max-w-4xl h-[70%] bg-black rounded-lg shadow-lg overflow-hidden flex flex-col">
              <div className="flex justify-between items-center bg-cyan-900/50 px-4 py-2">
                <h2 className="text-cyan-400 font-semibold text-lg">
                  {playerChannel.name}
                </h2>
                <button
                  onClick={closePlayer}
                  className="text-white text-2xl hover:text-red-400"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1">
                {playerChannel.type === "youtube" ? (
                  <iframe
                    src={playerChannel.url}
                    title={playerChannel.name}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video
                    src={playerChannel.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
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
