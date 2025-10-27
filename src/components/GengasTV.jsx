import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { loadChannels } from "../utils/fetchChannels";
import * as THREE from "three";
import Hls from "hls.js";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState([]);

  // Load world map data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((world) => {
        const features = topojson.feature(world, world.objects.countries).features;
        setWorldData(features);
      });
  }, []);

  // Load channel data
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      if (data) {
        console.log("✅ Channels loaded:", Object.keys(data).slice(0, 10));
        setChannels(data);
      }
    })();
  }, []);

  // Normalize country names for matching
  const normalizeName = (name) =>
    name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");

  const handleClick = (country) => {
    if (!country?.properties?.name) return;
    const name = country.properties.name;
    console.log("🌍 Clicked:", name);

    const norm = normalizeName(name);
    const keys = Object.keys(channels);

    let match =
      keys.find((k) => normalizeName(k) === norm) ||
      keys.find((k) => normalizeName(k).includes(norm)) ||
      keys.find((k) => norm.includes(normalizeName(k)));

    if (match) {
      const ch = channels[match]?.channels || [];
      console.log(`📺 ${match} → ${ch.length} channels`);
      setSelectedCountry({ name: match, channels: ch });
    } else {
      console.warn("⚠️ No match found for", name);
      setSelectedCountry({ name, channels: [] });
    }
  };

  // Initialize colorful globe
  useEffect(() => {
    if (!worldData || !globeRef.current) return;

    const globe = globeRef.current;
    const interval = setInterval(() => {
      if (typeof globe.polygonsData === "function") {
        clearInterval(interval);

        const colorScale = (name) => {
          const seed = normalizeName(name);
          const hue = (seed.charCodeAt(0) * 37) % 360;
          return `hsl(${hue}, 80%, 55%)`;
        };

        globe
          .polygonsData(worldData)
          .polygonCapColor((d) => colorScale(d.properties.name))
          .polygonSideColor(() => "rgba(80,80,80,0.3)")
          .polygonStrokeColor(() => "#111")
          .polygonAltitude(0.01)
          .onPolygonClick(handleClick)
          .pointOfView({ altitude: 2.2 });

        const scene = globe.scene();
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(1, 1, 1);
        scene.add(dirLight);

        console.log("🌐 Globe initialized successfully.");
      }
    }, 300);

    return () => clearInterval(interval);
  }, [worldData]);

  // Search bar auto-suggest
  useEffect(() => {
    if (!worldData || searchTerm.trim() === "") {
      setFiltered([]);
      return;
    }
    const list = worldData
      .map((c) => c.properties.name)
      .filter((n) => n.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
    setFiltered(list);
  }, [searchTerm, worldData]);

  // HLS IPTV support
  useEffect(() => {
    if (selectedChannel && selectedChannel.type === "iptv") {
      const video = document.getElementById("hls-player");
      if (video && selectedChannel.url.endsWith(".m3u8")) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(selectedChannel.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = selectedChannel.url;
        } else {
          console.error("❌ HLS not supported in this browser");
        }
      }
    }
  }, [selectedChannel]);

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
      {/* Space background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 50% 50%, #000010, #000000) url('https://www.transparenttextures.com/patterns/stardust.png')",
          backgroundSize: "contain",
          zIndex: 0,
        }}
      ></div>

      {/* Header bar */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/70 backdrop-blur-md z-20 border-b border-cyan-700">
        <h1 className="text-2xl font-bold text-cyan-400 tracking-wide">🌍 Genga TV</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Filter Countries..."
            className="px-3 py-2 rounded bg-black/70 text-white outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filtered.length > 0 && (
            <div className="absolute bg-black/90 text-white mt-1 w-64 rounded shadow-lg max-h-64 overflow-y-auto">
              {filtered.map((c) => (
                <div
                  key={c}
                  className="px-3 py-2 hover:bg-cyan-700 cursor-pointer"
                  onClick={() => {
                    const found = worldData.find(
                      (d) => d.properties.name.toLowerCase() === c.toLowerCase()
                    );
                    if (found) handleClick(found);
                    setSearchTerm("");
                    setFiltered([]);
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Globe */}
      <div className="absolute inset-0 z-10">
        {worldData && (
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundColor="rgba(0,0,0,0)"
          />
        )}
      </div>

      {/* Sidebar */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 h-full w-80 bg-black/85 p-4 overflow-y-auto z-30 backdrop-blur-lg border-l border-cyan-700">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">{selectedCountry.name}</h2>
          {selectedCountry.channels?.length > 0 ? (
            selectedCountry.channels.map((ch, i) => (
              <div
                key={i}
                className="p-2 border-b border-gray-700 hover:bg-cyan-800 cursor-pointer transition"
                onClick={() => setSelectedChannel(ch)}
              >
                <div className="font-semibold">{ch.name}</div>
                <div className="text-sm opacity-70">{ch.type}</div>
              </div>
            ))
          ) : (
            <p className="opacity-70">No channels available.</p>
          )}
        </div>
      )}

      {/* Player */}
      {selectedChannel && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-black/90 rounded-xl shadow-lg p-4 w-[640px]">
          <h3 className="text-lg font-bold mb-2 text-cyan-400">{selectedChannel.name}</h3>
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
