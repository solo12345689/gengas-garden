// src/components/GengasTV.jsx
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import { geoCentroid } from "d3-geo";
import * as THREE from "three";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldFeatures, setWorldFeatures] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load world topojson (public/world-110m.json expected)
  useEffect(() => {
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((world) => {
        const features = topojson.feature(world, world.objects.countries).features;
        setWorldFeatures(features);
        console.log("Loaded countries:", features.length);
      })
      .catch((e) => {
        console.error("Failed to load world-110m.json:", e);
      });
  }, []);

  // Load channels (from your fetchChannels util)
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      if (data) {
        setChannels(data);
        console.log("Channels loaded:", Object.keys(data).length);
      } else {
        console.warn("Channels load returned null");
      }
    })();
  }, []);

  // Add simple ambient light when Globe renders (three scene)
  useEffect(() => {
    if (!globeRef.current) return;
    try {
      const scene = globeRef.current.scene();
      if (!scene.getObjectByName("gengaAmbient")) {
        const light = new THREE.AmbientLight(0xffffff, 0.8);
        light.name = "gengaAmbient";
        scene.add(light);
      }
    } catch (e) {
      // ignore while globe not ready
    }
  }, [globeRef.current]);

  // basic normalization for matching names
  const normalize = (s) => (s || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "");

  // polygon color: deterministic by name
  const polygonColor = (feature) => {
    const name = feature?.properties?.name || "";
    const base = normalize(name).charCodeAt(0) || 97;
    const hue = (base * 37) % 360;
    return `hsl(${hue}, 72%, 55%)`;
  };

  // On polygon click: find matching key in channels by name / partial matches
  const handleCountryClick = (feature) => {
    if (!feature || !feature.properties) return;
    const name = feature.properties.name;
    const n = normalize(name);
    const keys = Object.keys(channels || {});
    // try exact match then includes (two ways)
    const match =
      keys.find((k) => normalize(k) === n) ||
      keys.find((k) => normalize(k).includes(n)) ||
      keys.find((k) => n.includes(normalize(k)));
    if (match) {
      setSelectedCountry({ name: match, channels: channels[match].channels || [] });
    } else {
      setSelectedCountry({ name, channels: [] });
    }

    // center/point of view to the country centroid
    try {
      const centroid = geoCentroid(feature);
      if (globeRef.current && centroid && centroid.length === 2) {
        globeRef.current.pointOfView(
          { lat: centroid[1], lng: centroid[0], altitude: 1.5 },
          1000
        );
      }
    } catch (e) {
      // ignore
    }
  };

  // Search / suggestions
  useEffect(() => {
    if (!search) return setSuggestions([]);
    const q = normalize(search);
    const keys = Object.keys(channels || {});
    const filtered = keys.filter((k) => normalize(k).includes(q)).slice(0, 10);
    setSuggestions(filtered);
  }, [search, channels]);

  const chooseSuggestion = (name) => {
    setSearch(name);
    setSuggestions([]);
    if (channels[name]) {
      setSelectedCountry({ name, channels: channels[name].channels || [] });
      // try to find feature to center globe
      const feat = worldFeatures.find((f) => normalize(f.properties.name) === normalize(name));
      if (feat) {
        const c = geoCentroid(feat);
        if (c && globeRef.current) globeRef.current.pointOfView({ lat: c[1], lng: c[0], altitude: 1.5 }, 1000);
      }
    } else {
      setSelectedCountry({ name, channels: [] });
    }
  };

  // HLS handling for iptv streams (single video element)
  useEffect(() => {
    if (!selectedChannel) return;
    if (selectedChannel.type !== "iptv") return;
    const video = document.getElementById("genga-hls");
    if (!video) return;
    if (selectedChannel.url && selectedChannel.url.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(selectedChannel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        // cleanup on change
        return () => {
          try { hls.destroy(); } catch (e) {}
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = selectedChannel.url;
        video.play().catch(() => {});
      }
    } else {
      // non m3u8: set src and play
      video.src = selectedChannel.url || "";
      video.play().catch(() => {});
    }
  }, [selectedChannel]);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative", color: "#fff", overflow: "hidden" }}>
      {/* starry background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 30% 30%, rgba(10,30,40,0.7), #000 60%)",
        zIndex: 0
      }} />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        zIndex: 30, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "10px 18px",
        borderBottom: "2px solid rgba(0,200,200,0.06)", background: "rgba(0,0,0,0.45)"
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20, color: "#19e6d1" }}>🌐</span>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#19e6d1" }}>Genga TV</div>
          </div>
          <button
            title="Toggle sidebar"
            onClick={() => setSidebarOpen((s) => !s)}
            style={{
              border: "none", background: "transparent", color: "#19e6d1",
              cursor: "pointer", padding: 6, marginLeft: 6
            }}
          >
            {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter Countries..."
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(25,230,210,0.16)",
              background: "#0a0a0a", color: "#fff", width: 300
            }}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, width: 300,
              background: "#080808", border: "1px solid rgba(25,230,210,0.12)", borderRadius: 6, zIndex: 40
            }}>
              {suggestions.map((s, i) => (
                <div key={i}
                  onClick={() => chooseSuggestion(s)}
                  style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Globe area */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          width={window.innerWidth}
          height={window.innerHeight}
          polygonsData={worldFeatures}
          polygonCapColor={(d) => polygonColor(d)}
          polygonSideColor={() => "rgba(10,10,10,0.35)"}
          polygonStrokeColor={() => "#000"}
          polygonAltitude={0.01}
          onPolygonClick={handleCountryClick}
          // disable auto-rotate so users control it themselves (you can toggle)
          autoRotate={false}
          // atmosphere for glow
          showAtmosphere
          atmosphereColor={"#18e0c0"}
          atmosphereAltitude={0.25}
        />
      </div>

      {/* Sliding sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: "spring", stiffness: 120 }}
            style={{
              position: "absolute", right: 0, top: 64, bottom: 0, width: 360, zIndex: 60,
              background: "rgba(12,12,12,0.95)", borderLeft: "2px solid rgba(25,230,210,0.08)", overflowY: "auto", padding: 12
            }}
          >
            <div style={{ color: "#19e6d1", fontWeight: 700, fontSize: 20, marginBottom: 12 }}>
              {selectedCountry ? selectedCountry.name : "Select a Country"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(selectedCountry && selectedCountry.channels && selectedCountry.channels.length > 0) ? (
                selectedCountry.channels.map((ch, idx) => (
                  <div key={idx} onClick={() => setSelectedChannel(ch)}
                    style={{
                      padding: 12, borderRadius: 6, background: "#0a0a0a", cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.03)"
                    }}>
                    <div style={{ fontWeight: 700 }}>{ch.name}</div>
                    <div style={{ fontSize: 12, color: "#bbb" }}>{ch.type}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#bbb", padding: 8 }}>No channels available for this country.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered player overlay (single) */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
            style={{
              position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
              zIndex: 80, width: "min(1080px, 90%)", background: "#071017", border: "2px solid rgba(25,230,210,0.12)",
              borderRadius: 12, padding: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.7)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: "#19e6d1", fontWeight: 700 }}>{selectedChannel.name}</div>
              <button onClick={() => setSelectedChannel(null)} style={{ background: "transparent", border: "none", color: "#19e6d1", cursor: "pointer" }}>
                Close
              </button>
            </div>

            <div style={{ background: "#000", borderRadius: 8, overflow: "hidden" }}>
              {selectedChannel.type === "youtube" ? (
                <iframe
                  title="yt"
                  src={selectedChannel.url}
                  style={{ width: "100%", height: "60vh", border: 0 }}
                  allowFullScreen
                />
              ) : (
                <video id="genga-hls" controls style={{ width: "100%", height: "60vh", display: "block" }} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
