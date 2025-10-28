import React, { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaGlobe, FaArrowLeft } from "react-icons/fa";
import fetchChannels from "../utils/fetchChannels";

const GengasTV = () => {
  const globeRef = useRef();
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [showBackButton, setShowBackButton] = useState(false);

  // 🌍 Load countries and channels
  useEffect(() => {
    fetch("/countries.geojson")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.features);
        console.log("🌍 Loaded", data.features.length, "countries");
      });

    fetchChannels().then((data) => {
      setChannels(data);
      console.log("✅ Channels loaded:", data.length);
    });
  }, []);

  // 🌐 Initialize Globe
  useEffect(() => {
    if (globeRef.current && !globeReady && countries.length > 0) {
      const globe = Globe()(globeRef.current);
      globe
        .globeImageUrl(
          "//unpkg.com/three-globe/example/img/earth-dark.jpg"
        )
        .backgroundColor("#000")
        .showAtmosphere(true)
        .atmosphereColor("cyan")
        .atmosphereAltitude(0.25)
        .polygonsData(countries)
        .polygonCapColor(() => `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.9)`)
        .polygonSideColor(() => "rgba(0,100,255,0.15)")
        .polygonStrokeColor(() => "#111")
        .onPolygonClick((polygon) => {
          const country = polygon.properties.ADMIN;
          console.log("🌍 Clicked:", country);
          setSelectedCountry(country);
          setShowSearch(false);
          setShowBackButton(true);
        })
        .polygonsTransitionDuration(300);

      setGlobeReady(true);
    }
  }, [countries, globeReady]);

  // 🎬 Select Channel
  const openChannel = (ch) => {
    setSelectedChannel(ch);
    setShowSearch(false);
    setShowBackButton(false);
  };

  // ❌ Close Player → back to search
  const closePlayer = () => {
    setSelectedChannel(null);
    setShowSearch(true);
    setShowBackButton(false);
  };

  // 🔙 Back to Globe
  const handleBack = () => {
    setSelectedCountry(null);
    setShowSearch(true);
    setShowBackButton(false);
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        background: "radial-gradient(circle at center, #000 60%, #001019 100%)",
        overflow: "hidden",
      }}
    >
      {/* 🌐 Header */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          display: "flex",
          alignItems: "center",
          color: "#19e6d1",
          fontWeight: "bold",
          fontSize: 22,
          zIndex: 10,
        }}
      >
        <FaGlobe style={{ marginRight: 10 }} />
        Genga TV
      </div>

      {/* 🔙 Back Button */}
      {showBackButton && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBack}
          style={{
            position: "absolute",
            top: 10,
            right: 20,
            background: "#8FE360",
            color: "#000",
            border: "none",
            borderRadius: 10,
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FaArrowLeft /> Back
        </motion.button>
      )}

      {/* 🌎 Globe */}
      <div
        ref={globeRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* 🔍 Channel List (Search Section) */}
      <AnimatePresence>
        {showSearch && selectedCountry && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: 300,
              background: "rgba(0,0,0,0.85)",
              borderLeft: "1px solid #19e6d1",
              color: "white",
              overflowY: "auto",
              padding: "20px 12px",
              zIndex: 5,
            }}
          >
            <h2 style={{ color: "#19e6d1" }}>{selectedCountry}</h2>
            <input
              type="text"
              placeholder={`Search in ${selectedCountry}`}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 8,
                marginBottom: 12,
                border: "1px solid #19e6d1",
                background: "#000",
                color: "#19e6d1",
              }}
            />
            {channels
              .filter(
                (ch) =>
                  ch.country?.toLowerCase() ===
                  selectedCountry.toLowerCase()
              )
              .map((ch, i) => (
                <div
                  key={i}
                  onClick={() => openChannel(ch)}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{ch.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {ch.type}
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 Player (Centered) */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 120 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(90vw, 960px)",
              height: "min(80vh, 540px)",
              background: "#090f13",
              borderRadius: 12,
              boxShadow: "0 0 40px rgba(0,255,255,0.25)",
              padding: "12px 16px",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              overflow: "hidden",
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#ff6666")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#ff4c4c")
                }
              />
            </div>

            {/* Video Area */}
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
};

export default GengasTV;
