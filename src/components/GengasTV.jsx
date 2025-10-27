import React, { useEffect, useRef, useState, useMemo } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";
import { motion, AnimatePresence } from "framer-motion";
import { FaGlobe, FaSearch, FaTimes, FaPlay } from "react-icons/fa";
import * as THREE from "three";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [search, setSearch] = useState("");
  const [playingChannel, setPlayingChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🌍 Load world map + channels
  useEffect(() => {
    async function fetchWorldAndChannels() {
      try {
        const worldRes = await fetch("/world-110m.json");
        const worldData = await worldRes.json();
        const features = topojson.feature(worldData, worldData.objects.countries).features;
        setCountries(features);

        const data = await loadChannels();
        setChannels(data || {});
        setLoading(false);
      } catch (e) {
        console.error("Error loading world or channels", e);
        setLoading(false);
      }
    }
    fetchWorldAndChannels();
  }, []);

  // 🎨 Assign bright unique colors per country
  const colorMap = useMemo(() => {
    const map = {};
    countries.forEach((c, i) => {
      map[c.properties.name] = `hsl(${(i * 45) % 360}, 80%, 50%)`;
    });
    return map;
  }, [countries]);

  // 🌍 Click on country handler
  const handleCountryClick = (country) => {
    if (!country) return;
    setSelectedCountry(country);
    setPlayingChannel(null);
  };

  // 🔍 Search country
  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    return countries.filter((c) =>
      c.properties.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, countries]);

  // 🎬 Get channels for selected country
  const countryName = selectedCountry?.properties?.name;
  const selectedChannels = channels[countryName] ? channels[countryName].channels : [];

  // 🌌 After globe load
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.enableZoom = true;
      controls.enablePan = false;
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#020412] text-white">
      {/* 🌍 HEADER BAR */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur-md z-50 border-b border-cyan-900">
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-green-500 rounded-md px-2 py-1">
            <span className="text-black font-bold text-xl">TV</span>
          </div>
          <span className="ml-1 text-lg font-semibold text-white">Genga</span>
        </div>

        <div className="flex items-center bg-[#0d0f16] border border-cyan-700 rounded-md px-3 py-1 w-64">
          <FaSearch className="text-cyan-400 mr-2" />
          <input
            type="text"
            placeholder="Filter Countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white placeholder-gray-400 w-full"
          />
        </div>
      </div>

      {/* 🌍 GLOBE */}
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          backgroundColor="rgba(0,0,0,0)"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="#2faaff"
          atmosphereAltitude={0.25}
          polygonsData={filteredCountries}
          polygonCapColor={(d) => colorMap[d.properties.name] || "gray"}
          polygonSideColor={() => "rgba(0,100,255,0.3)"}
          polygonStrokeColor={() => "#111"}
          onPolygonClick={handleCountryClick}
          polygonsTransitionDuration={300}
        />
      </div>

      {/* 📜 SIDEBAR */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 60 }}
            className="absolute right-0 top-0 h-full w-96 bg-black/80 backdrop-blur-md overflow-y-auto border-l border-cyan-900 p-4 z-40"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">
                {countryName}
              </h2>
              <button onClick={() => setSelectedCountry(null)}>
                <FaTimes className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {selectedChannels.length > 0 ? (
              <div className="space-y-3">
                {selectedChannels.map((ch, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-[#0d0f16] border border-cyan-800 rounded-md cursor-pointer hover:bg-[#101726]"
                    onClick={() => setPlayingChannel(ch)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{ch.name}</span>
                      <FaPlay className="text-cyan-400" />
                    </div>
                    <p className="text-xs text-gray-400">{ch.language?.toUpperCase()}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No channels available</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎥 PLAYER */}
      <AnimatePresence>
        {playingChannel && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 80 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-black/90 border border-cyan-700 rounded-xl shadow-lg p-4 w-[700px] z-50"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-cyan-400 font-bold">{playingChannel.name}</h3>
              <FaTimes
                className="text-gray-400 cursor-pointer hover:text-white"
                onClick={() => setPlayingChannel(null)}
              />
            </div>

            {playingChannel.type === "youtube" ? (
              <iframe
                src={playingChannel.url}
                title={playingChannel.name}
                allowFullScreen
                className="w-full h-[400px] rounded-lg border border-cyan-700"
              ></iframe>
            ) : (
              <video
                controls
                autoPlay
                className="w-full h-[400px] rounded-lg border border-cyan-700 bg-black"
              >
                <source src={playingChannel.url} type="application/x-mpegURL" />
              </video>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌠 STAR BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_#020412_0%,_#000_100%)]">
        <canvas id="stars"></canvas>
      </div>
    </div>
  );
}
