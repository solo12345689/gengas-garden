import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaArrowLeft, FaTimes } from "react-icons/fa";
import * as THREE from "three";
import localforage from "localforage";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧭 Load globe countries
  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch("/countries.geojson.txt");
        const json = await res.json();
        const features = json.features.map((d) => ({
          ...d,
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        }));
        setCountries(features);
        console.log("🌍 Loaded", features.length, "countries");
      } catch (e) {
        console.error("❌ Failed to load world data:", e);
      }
    }
    loadWorld();
  }, []);

  // ⚡ Load channels (cached + lazy update)
  useEffect(() => {
    async function fetchChannelsWithCache() {
      setLoading(true);
      try {
        const cached = await localforage.getItem("gengas_channels");
        if (cached) {
          setChannels(cached);
          console.log("⚡ Loaded channels from cache:", Object.keys(cached).length);
        }

        // Always fetch new in background
        const fresh = await loadChannels();
        if (fresh) {
          setChannels(fresh);
          await localforage.setItem("gengas_channels", fresh);
          console.log("✅ Fetched & updated cache:", Object.keys(fresh).length);
        }
      } catch (err) {
        console.error("❌ Error loading channels:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChannelsWithCache();
  }, []);

  // 🌈 Initialize Globe
  useEffect(() => {
    if (!countries.length || !globeRef.current) return;
    const g = globeRef.current;
    g
      .polygonsData(countries)
      .polygonCapColor((d) => d.color)
      .polygonSideColor(() => "rgba(0,100,150,0.15)")
      .polygonStrokeColor(() => "#111")
      .onPolygonClick((d) => handleCountryClick(d))
      .backgroundColor("rgba(0,0,0,1)")
      .showAtmosphere(true)
      .atmosphereColor("lightskyblue")
      .atmosphereAltitude(0.25);
  }, [countries]);

  // 🗺 Click handler
  function handleCountryClick(d) {
    if (!d?.properties) return;
    const name = d.properties.ADMIN;
    setSelectedCountry(name);
    setSelectedChannel(null);
  }

  // 🔍 Search logic
  function handleSearch(e) {
    const val = e.target.value;
    setSearch(val);
    if (!val) return setSuggestions([]);
    const matches = countries
      .map((d) => d.properties.ADMIN)
      .filter((n) => n.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 10);
    setSuggestions(matches);
  }

  // 🧩 Get country channels
  const countryChannels =
    selectedCountry && channels[selectedCountry]
      ? channels[selectedCountry].channels
      : [];

  // 🎥 Video player
  const renderPlayer = () => {
    if (!selectedChannel) return null;
    return (
      <motion.div
        key="player"
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 40 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 flex items-center justify-center bg-black/90 z-50"
      >
        <div className="relative w-[90vw] max-w-5xl h-[65vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
          <button
            onClick={() => {
              setSelectedChannel(null);
              setSelectedCountry(null);
            }}
            className="absolute top-3 right-3 text-white bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <FaTimes size={20} />
          </button>

          {selectedChannel.type === "youtube" ? (
            <iframe
              src={selectedChannel.url}
              title={selectedChannel.name}
              className="w-full h-full"
              allowFullScreen
            />
          ) : (
            <video
              src={selectedChannel.url}
              className="w-full h-full"
              controls
              autoPlay
            />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0b1c2c,_#000)]"></div>

      {/* 🧭 Top Bar */}
      {!selectedChannel && (
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 bg-black/60 backdrop-blur-md z-20">
          {selectedCountry ? (
            <button
              onClick={() => setSelectedCountry(null)}
              className="flex items-center gap-2 text-white hover:text-blue-400"
            >
              <FaArrowLeft /> Back
            </button>
          ) : (
            <h1 className="text-2xl font-bold tracking-wide text-blue-400">
              🌍 Genga TV
            </h1>
          )}

          {!selectedCountry && (
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
              />
              {suggestions.length > 0 && (
                <div className="absolute mt-1 bg-gray-900 rounded-lg shadow-lg w-full z-30 max-h-48 overflow-y-auto">
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      onClick={() => {
                        setSelectedCountry(s);
                        setSuggestions([]);
                        setSearch("");
                      }}
                      className="px-4 py-2 hover:bg-blue-600 cursor-pointer"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🌍 Globe */}
      {!selectedChannel && (
        <div className="absolute inset-0 z-0">
          <Globe ref={globeRef} />
        </div>
      )}

      {/* 📋 Sidebar */}
      <AnimatePresence>
        {selectedCountry && !selectedChannel && (
          <motion.div
            key="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4 }}
            className="absolute left-0 top-0 h-full w-80 bg-gray-950/90 backdrop-blur-md p-4 overflow-y-auto z-30"
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              {selectedCountry}
            </h2>
            {countryChannels.length === 0 ? (
              <p className="text-gray-400">No channels available.</p>
            ) : (
              countryChannels.map((ch, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedChannel(ch)}
                  className="p-3 mb-2 bg-gray-800 rounded-lg hover:bg-blue-700 cursor-pointer transition"
                >
                  <p className="font-medium">{ch.name}</p>
                  <p className="text-sm text-gray-400">{ch.type}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎥 Player */}
      <AnimatePresence>{renderPlayer()}</AnimatePresence>

      {/* ⏳ Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400"></div>
        </div>
      )}
    </div>
  );
}
