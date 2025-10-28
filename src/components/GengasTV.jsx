// src/components/GengasTV.jsx
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { geoCentroid } from "d3-geo";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSearch, FaTimes } from "react-icons/fa";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldFeatures, setWorldFeatures] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // 🌍 Load world map
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((world) => {
        setWorldFeatures(topojson.feature(world, world.objects.countries).features);
      });
  }, []);

  // 📡 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      setChannels(data || {});
    })();
  }, []);

  // 💡 Ambient light for globe
  useEffect(() => {
    if (globeRef.current) {
      const scene = globeRef.current.scene();
      if (!scene.getObjectByName("ambient")) {
        const light = new THREE.AmbientLight(0xffffff, 1);
        light.name = "ambient";
        scene.add(light);
      }
    }
  }, []);

  const normalize = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const handleCountryClick = (feature) => {
    const name = feature?.properties?.name;
    if (!name) return;
    showCountry(name);

    const centroid = geoCentroid(feature);
    if (globeRef.current && centroid.length === 2) {
      globeRef.current.pointOfView(
        { lat: centroid[1], lng: centroid[0], altitude: 1.3 },
        1200
      );
    }
  };

  const showCountry = (name) => {
    const keys = Object.keys(channels);
    const match =
      keys.find((k) => normalize(k) === normalize(name)) ||
      keys.find((k) => normalize(k).includes(normalize(name)));

    if (match) {
      setSelectedCountry({ name: match, channels: channels[match].channels });
      setSidebarOpen(true);
      setSelectedChannel(null);
    } else {
      setSelectedCountry({ name, channels: [] });
      setSidebarOpen(true);
      setSelectedChannel(null);
    }
  };

  // 🔎 Search with autosuggest
  useEffect(() => {
    if (!search) return setSuggestions([]);
    const results = Object.keys(channels).filter((c) =>
      c.toLowerCase().includes(search.toLowerCase())
    );
    setSuggestions(results.slice(0, 8));
  }, [search, channels]);

  // 🎬 HLS Player setup
  useEffect(() => {
    if (!selectedChannel || selectedChannel.type !== "iptv") return;
    const video = document.getElementById("genga-hls");
    if (!video) return;

    if (selectedChannel.url.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(selectedChannel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      return () => hls.destroy();
    } else {
      video.src = selectedChannel.url;
      video.play().catch(() => {});
    }
  }, [selectedChannel]);

  const polygonColor = (f) => {
    const n = normalize(f.properties.name);
    const hue = (n.charCodeAt(0) * 45) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const backToMain = () => {
    setSelectedCountry(null);
    setSidebarOpen(false);
    setSearch("");
    if (globeRef.current)
      globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2.4 }, 800);
  };

  const closePlayer = () => {
    setSelectedChannel(null);
    setSelectedCountry(null); // show search instead of back button
    setSidebarOpen(false);
    if (globeRef.current)
      globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2.4 }, 800);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "radial-gradient(circle at 50% 50%, #000010, #000)",
        overflow: "hidden",
      }}
    >
      {/* 🧭 Top Navigation Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: "rgba(0,0,0,0.65)",
          padding: "8px 16px",
          borderBottom: "1px solid rgba(0,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌐</span>
          <span style={{ color: "#19e6d1", fontSize: 20, fontWeight: 700 }}>
            Genga TV
          </span>
        </div>

        {/* 🔍 Search box (only visible in main view) */}
        {!selectedCountry && !selectedChannel && (
          <div style={{ position: "relative", width: "260px" }}>
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #19e6d1",
                background: "#000",
                color: "#19e6d1",
                outline: "none",
              }}
            />
            <FaSearch
              style={{
                position: "absolute",
                top: "8px",
                right: "10px",
                color: "#19e6d1",
              }}
            />
            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  right: 0,
                  background: "#0a0a0a",
                  border: "1px solid #19e6d1",
                  zIndex: 50,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      showCountry(s);
                      setSearch("");
                      setSuggestions([]);
                    }}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: "#19e6d1",
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🔙 Back button (only for sidebar) */}
        {selectedCountry && !selectedChannel && (
          <button
            onClick={backToMain}
            style={{
              background: "#7ac943",
              border: "none",
              color: "#000",
              padding: "8px 14px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FaArrowLeft /> Back
          </button>
        )}
      </div>

      {/* 🌍 Interactive Globe */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        polygonsData={worldFeatures}
        polygonCapColor={polygonColor}
        polygonSideColor={() => "rgba(0,0,0,0.2)"}
        polygonStrokeColor={() => "#000"}
        polygonAltitude={0.01}
        onPolygonClick={handleCountryClick}
        atmosphereColor="#18e0c0"
        atmosphereAltitude={0.25}
        showAtmosphere
      />

      {/* 📜 Sidebar */}
      <AnimatePresence>
        {sidebarOpen && selectedCountry && !selectedChannel && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 120 }}
            style={{
              position: "absolute",
              right: 0,
              top: 60,
              bottom: 0,
              width: 350,
              background: "rgba(12,12,12,0.95)",
              borderLeft: "1px solid rgba(25,230,210,0.2)",
              overflowY: "auto",
              padding: 12,
              zIndex: 20,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#19e6d1",
                marginBottom: 10,
                fontSize: 18,
              }}
            >
              {selectedCountry.name}
            </div>

            {(selectedCountry.channels || []).map((ch, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedChannel(ch);
                  setSidebarOpen(false);
                }}
                style={{
                  padding: "10px 12px",
                  marginBottom: 6,
                  background: "#0a0a0a",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>{ch.name}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{ch.type}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 Centered Player */}
<AnimatePresence>
  {selectedChannel && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 100 }}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(85vw, 960px)",
        height: "min(75vh, 540px)",
        background: "#080f13",
        borderRadius: 12,
        boxShadow: "0 0 40px rgba(0,255,255,0.25)",
        padding: "12px 16px",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ color: "#19e6d1", fontWeight: 700, fontSize: 18 }}>
          {selectedChannel.name}
        </div>
        <FaTimes
          onClick={closePlayer}
          style={{
            color: "#ff4c4c",
            cursor: "pointer",
            fontSize: 22,
            transition: "0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6666")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#ff4c4c")}
        />
      </div>

      {/* Video Container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {selectedChannel.type === "youtube" ? (
          <iframe
            src={selectedChannel.url}
            title="player"
            allowFullScreen
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              borderRadius: 8,
            }}
          />
        ) : (
          <video
            id="genga-hls"
            controls
            autoPlay
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 8,
              objectFit: "cover",
            }}
          />
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
      
    </div>
  );
}
