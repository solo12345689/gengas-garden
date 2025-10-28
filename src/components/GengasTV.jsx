// src/components/GengasTV.jsx
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { geoCentroid } from "d3-geo";
import * as THREE from "three";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaArrowLeft } from "react-icons/fa";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldFeatures, setWorldFeatures] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🌍 Load globe data
  useEffect(() => {
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((world) => {
        setWorldFeatures(topojson.feature(world, world.objects.countries).features);
      });
  }, []);

  // 📺 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      setChannels(data || {});
      console.log("✅ Channels loaded:", Object.keys(data).length);
    })();
  }, []);

  // 💡 Add ambient light to globe
  useEffect(() => {
    if (globeRef.current) {
      const scene = globeRef.current.scene();
      if (!scene.getObjectByName("ambient")) {
        const light = new THREE.AmbientLight(0xffffff, 0.9);
        light.name = "ambient";
        scene.add(light);
      }
    }
  }, []);

  const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

  // 🖱 Handle country click
  const handleCountryClick = (feature) => {
    const name = feature?.properties?.name;
    if (!name) return;

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

    const centroid = geoCentroid(feature);
    if (globeRef.current && centroid.length === 2) {
      globeRef.current.pointOfView(
        { lat: centroid[1], lng: centroid[0], altitude: 1.3 },
        1000
      );
    }
  };

  // 🎬 Handle HLS and YouTube playback
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

  // 🌈 Random color palette for countries
  const polygonColor = (f) => {
    const n = normalize(f.properties.name);
    const hue = (n.charCodeAt(0) * 53) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // 🔙 Return to main globe
  const backToMain = () => {
    setSelectedCountry(null);
    setSelectedChannel(null);
    setSidebarOpen(false);
    if (globeRef.current)
      globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2.2 }, 800);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "radial-gradient(circle at 50% 50%, #000010, #000)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* --- Top Navigation Bar --- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.55)",
          borderBottom: "1px solid rgba(0,255,255,0.05)",
          padding: "10px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, color: "#19e6d1" }}>🌐</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#19e6d1" }}>
            Genga TV
          </span>
        </div>

        {selectedCountry ? (
          <button
            onClick={backToMain}
            style={{
              background: "#7ac943",
              border: "none",
              color: "#000",
              padding: "8px 14px",
              borderRadius: "0 12px 12px 0",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <FaArrowLeft /> Back
          </button>
        ) : (
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            style={{
              background: "transparent",
              border: "none",
              color: "#19e6d1",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            <FaBars />
          </button>
        )}
      </div>

      {/* --- Globe --- */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="rgba(0,0,0,0)"
          polygonsData={worldFeatures}
          polygonCapColor={polygonColor}
          polygonSideColor={() => "rgba(0,0,0,0.3)"}
          polygonStrokeColor={() => "#000"}
          polygonAltitude={0.01}
          onPolygonClick={handleCountryClick}
          atmosphereColor="#18e0c0"
          atmosphereAltitude={0.25}
          showAtmosphere
        />
      </div>

      {/* --- Sidebar --- */}
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
              borderLeft: "1px solid rgba(25,230,210,0.1)",
              overflowY: "auto",
              zIndex: 20,
              padding: 12,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#19e6d1",
                marginBottom: 12,
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
                  setSidebarOpen(false); // auto-hide sidebar
                }}
                style={{
                  padding: "10px 12px",
                  marginBottom: 6,
                  background:
                    selectedChannel?.name === ch.name
                      ? "#0e2f2f"
                      : "#0a0a0a",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700 }}>{ch.name}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{ch.type}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Player (Centered) --- */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 100 }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(1000px, 90%)",
              background: "#080f13",
              borderRadius: 10,
              boxShadow: "0 0 40px rgba(0,0,0,0.6)",
              padding: 10,
              zIndex: 50,
            }}
          >
            <div
              style={{
                color: "#19e6d1",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {selectedChannel.name}
            </div>
            {selectedChannel.type === "youtube" ? (
              <iframe
                src={selectedChannel.url}
                title="player"
                style={{ width: "100%", height: "60vh", border: 0 }}
                allowFullScreen
              />
            ) : (
              <video
                id="genga-hls"
                controls
                style={{ width: "100%", height: "60vh" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

