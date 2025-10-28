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
  const [searchTerm, setSearchTerm] = useState("");
  const [playerChannel, setPlayerChannel] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // 🗺️ Load world countries (your GeoJSON)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/countries.geojson.txt"
        );
        const json = await res.json();
        console.log("🌍 Loaded", json.features?.length || 0, "countries");
        setWorldData(json);
      } catch (err) {
        console.error("❌ Failed to load countries:", err);
      }
    })();
  }, []);

  // 📺 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      console.log("✅ Channels loaded:", data ? Object.keys(data).length : 0);
      if (data) setChannels(data);
    })();
  }, []);

  // 🎨 Setup globe
  useEffect(() => {
    if (!globeRef.current || !worldData) return;

    const g = globeRef.current;

    const setupGlobe = () => {
      if (typeof g.polygonsData !== "function") {
        console.warn("⚠️ Globe not ready yet, retrying...");
        setTimeout(setupGlobe, 400);
        return;
      }

      g.polygonsData(worldData.features)
        .polygonCapColor(() => {
          const colors = [
            "#00bcd4",
            "#4caf50",
            "#ff9800",
            "#9c27b0",
            "#f44336",
            "#2196f3",
            "#ffeb3b",
            "#03a9f4",
          ];
          return colors[Math.floor(Math.random() * colors.length)];
        })
        .polygonSideColor(() => "rgba(0,0,0,0.25)")
        .polygonStrokeColor(() => "#111")
        .polygonAltitude(() => 0.015)
        .backgroundColor("#000010");
    };

    setupGlobe();
  }, [worldData]);

  // 🌍 Click on country
  const handleCountryClick = (polygon) => {
    const name = polygon?.properties?.name;
    if (name) {
      setSelectedCountry(name);
      setPlayerChannel(null);
    }
  };

  // 🔍 Handle search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) return setSuggestions([]);
    const matches = Object.keys(channels)
      .filter((c) => c.toLowerCase().includes(term))
      .slice(0, 6);
    setSuggestions(matches);
  };

  const handleSelectSuggestion = (country) => {
    setSelectedCountry(country);
    setSuggestions([]);
  };

  const selectedChannels = channels[selectedCountry]?.channels || [];

  // 🎥 Channel click
  const handleChannelClick = (ch) => {
    setPlayerChannel(ch);
  };

  // ❌ Close player → show search
  const closePlayer = () => {
    setPlayerChannel(null);
    setSelectedCountry(null);
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-white"
      style={{
        background: "radial-gradient(circle at 20% 20%, #04061a 0%, #000010 100%)",
      }}
    >
      {/* Globe */}
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="#000000"
          onPolygonClick={handleCountryClick}
          polygonsTransitionDuration={300}
          enablePointerInteraction={true}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4 bg-black/40 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-wide">
          🌍 <span className="text-cyan-400">Genga TV</span>
        </h1>
        {selectedCountry && !playerChannel && (
          <button
            onClick={() => setSelectedCountry(null)}
            className="text-white/80 hover:text-white text-lg flex items-center gap-2 bg-green-600/80 px-4 py-2 rounded-full"
          >
            <FaArrowLeft /> Back
          </button>
        )}
      </div>

      {/* Search */}
      {!selectedCountry && !playerChannel && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-80 text-center z-50">
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
            <ul className="bg-black/90 mt-2 rounded-md border border-white/10">
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

      {/* Sidebar */}
      <AnimatePresence>
        {selectedCountry && !playerChannel && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4 }}
            className="absolute left-0 top-0 h-full w-80 bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
          >
            <h2 className="text-xl font-semibold mb-3">
              {selectedCountry} ({selectedChannels.length})
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

      {/* Player */}
      <AnimatePresence>
        {playerChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50"
          >
            <div className="relative w-[80%] h-[70%] bg-black rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={closePlayer}
                className="absolute top-3 right-3 text-white text-2xl hover:text-red-400"
              >
                <FaTimes />
              </button>
              {playerChannel.type === "youtube" ? (
                <iframe
                  src={playerChannel.url}
                  title={playerChannel.name}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              ) : (
                <video src={playerChannel.url} controls autoPlay className="w-full h-full" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
