import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import Hls from "hls.js";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // 🌍 Load world map
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((world) => {
        const features = topojson.feature(world, world.objects.countries).features;
        setCountries(features);
        console.log("🌍 Loaded countries:", features.length);
      });
  }, []);

  // 📺 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      setChannels(data || {});
      console.log("✅ Channels loaded:", Object.keys(data || {}).length);
    })();
  }, []);

  // 🔤 Normalize for fuzzy matching
  const normalize = (str) =>
    str?.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "") || "";

  // 🎯 Handle country click
  const handleCountryClick = (country) => {
    if (!country?.properties?.name) return;
    const name = country.properties.name;
    const norm = normalize(name);
    const keys = Object.keys(channels);
    const match =
      keys.find((k) => normalize(k) === norm) ||
      keys.find((k) => normalize(k).includes(norm)) ||
      keys.find((k) => norm.includes(normalize(k)));

    if (match) {
      console.log("✅ Clicked:", match);
      setSelectedCountry({ name: match, channels: channels[match].channels });
    } else {
      console.log("⚠️ No channel match for", name);
      setSelectedCountry({ name, channels: [] });
    }
  };

  // 🌈 Initialize globe with multicolor polygons + working click
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return;

    const globeObj =
      globeRef.current.globe || globeRef.current; // 🧠 Handle version differences

    // Safety check
    if (typeof globeObj.polygonsData !== "function") {
      console.warn("Globe not ready yet. Retrying...");
      setTimeout(() => {
        if (typeof globeObj.polygonsData === "function") {
          globeObj.polygonsData(countries);
        }
      }, 300);
      return;
    }

    const colorFor = (name) => {
      const hue = (normalize(name).charCodeAt(0) * 47) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    };

    // Add lights
    const scene = globeObj.scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    globeObj
      .polygonsData(countries)
      .polygonCapColor((d) => colorFor(d.properties.name))
      .polygonSideColor(() => "rgba(50,50,50,0.25)")
      .polygonStrokeColor(() => "#000")
      .polygonAltitude(0.01)
      .onPolygonClick(handleCountryClick);

    console.log("🌐 Globe initialized successfully!");
  }, [countries]);

  // 🔍 Search + suggest
  useEffect(() => {
    if (!searchTerm.trim()) return setSuggestions([]);
    const result = countries
      .map((c) => c.properties.name)
      .filter((n) => n.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 6);
    setSuggestions(result);
  }, [searchTerm, countries]);

  // ▶ IPTV player setup
  useEffect(() => {
    if (!selectedChannel || selectedChannel.type !== "iptv") return;
    const video = document.getElementById("hls-player");
    if (video && selectedChannel.url.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(selectedChannel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = selectedChannel.url;
      }
    }
  }, [selectedChannel]);

  return (
    <div className="relative h-screen w-full text-white overflow-hidden">
      {/* Starry background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #000010, #000000) url('https://www.transparenttextures.com/patterns/stardust.png')",
          backgroundSize: "cover",
        }}
      />

      {/* Header bar */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/70 border-b border-cyan-600 z-10">
        <h1 className="text-2xl font-bold text-cyan-400">🌐 Genga TV</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search country..."
            className="px-3 py-2 rounded bg-black/70 text-white outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="absolute bg-black/90 mt-1 w-64 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-cyan-700 cursor-pointer"
                  onClick={() => {
                    const found = countries.find(
                      (c) => c.properties.name.toLowerCase() === s.toLowerCase()
                    );
                    if (found) handleCountryClick(found);
                    setSuggestions([]);
                    setSearchTerm("");
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌍 Globe */}
      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeRef}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          onPolygonClick={handleCountryClick}
        />
      </div>

      {/* Sidebar */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 h-full w-80 bg-black/85 p-4 overflow-y-auto z-10 border-l border-cyan-700">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">
            {selectedCountry.name}
          </h2>
          {selectedCountry.channels?.length > 0 ? (
            selectedCountry.channels.map((ch, i) => (
              <div
                key={i}
                className="p-2 border-b border-gray-700 hover:bg-cyan-700 cursor-pointer"
                onClick={() => setSelectedChannel(ch)}
              >
                <div className="font-semibold">{ch.name}</div>
                <div className="text-sm opacity-70">{ch.type}</div>
              </div>
            ))
          ) : (
            <p className="opacity-60">No channels available.</p>
          )}
        </div>
      )}

      {/* Player */}
      {selectedChannel && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/90 rounded-xl p-4 w-[640px] border border-cyan-700 shadow-xl">
          <h3 className="text-lg font-bold mb-2 text-cyan-400">
            {selectedChannel.name}
          </h3>
          {selectedChannel.type === "youtube" ? (
            <iframe
              className="w-full h-96 rounded-lg"
              src={selectedChannel.url}
              allowFullScreen
            ></iframe>
          ) : (
            <video
              id="hls-player"
              className="w-full h-96 rounded-lg"
              controls
              autoPlay
            ></video>
          )}
          <button
            className="mt-3 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded"
            onClick={() => setSelectedChannel(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
