import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import Hls from "hls.js";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeEl = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryChannels, setCountryChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Load map + channels
  useEffect(() => {
    (async () => {
      try {
        const world = await fetch("/world-110m.json").then((res) => res.json());
        const features = topojson.feature(
          world,
          world.objects.countries
        ).features;
        setCountries(features);
      } catch (err) {
        console.error("World load failed", err);
      }

      const ch = await loadChannels();
      if (ch) setChannels(ch);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = false;
      controls.enableZoom = true;
      controls.enablePan = false;
      globeEl.current.pointOfView({ altitude: 2.2 });
    }
  }, [countries]);

  const handleClick = (country) => {
    if (!country?.properties?.name) return;
    selectCountry(country.properties.name.trim());
  };

  const selectCountry = (name) => {
    setSelectedCountry(name);
    const key = Object.keys(channels).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    const fallback = Object.keys(channels).find((k) =>
      k.toLowerCase().includes(name.toLowerCase())
    );
    const data = channels[key] || channels[fallback];
    setCountryChannels(data?.channels || []);
    setActiveChannel(null);

    if (globeEl.current && countries.length > 0) {
      const found = countries.find(
        (c) => c.properties.name.toLowerCase() === name.toLowerCase()
      );
      if (found) {
        const centroid = globeEl.current.getCoords(found);
        globeEl.current.pointOfView(
          { lat: centroid.lat, lng: centroid.lng, altitude: 1.3 },
          1000
        );
      }
    }
  };

  const getCountryColor = (d) => {
    const hash = d.properties.name
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (!value) return setSuggestions([]);
    const lower = value.toLowerCase();
    const matched = Object.keys(channels)
      .filter((k) => k.toLowerCase().startsWith(lower))
      .slice(0, 8);
    setSuggestions(matched);
  };

  if (isLoading)
    return (
      <div
        style={{
          color: "#0ff",
          background: "#000",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.5rem",
          fontFamily: "sans-serif",
        }}
      >
        🌍 Loading Genga Garden TV...
      </div>
    );

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "#0ff",
          fontSize: "24px",
          fontWeight: "bold",
          textShadow: "0 0 15px #00ffff",
          zIndex: 20,
        }}
      >
        🌐 Genga Garden TV
      </div>

      {/* Search */}
      <div
        style={{
          position: "absolute",
          top: "50px",
          left: "10px",
          zIndex: 20,
        }}
      >
        <input
          type="text"
          placeholder="Search country..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && selectCountry(searchTerm)}
          style={{
            padding: "10px 12px",
            borderRadius: "10px",
            border: "2px solid #0ff",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontSize: "14px",
            width: "200px",
          }}
        />
        <button
          onClick={() => selectCountry(searchTerm)}
          style={{
            marginLeft: "6px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "#0ff",
            border: "none",
            cursor: "pointer",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          🔍
        </button>

        {/* Suggestion dropdown */}
        {suggestions.length > 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              borderRadius: "6px",
              border: "1px solid #0ff",
              marginTop: "5px",
              width: "240px",
              maxHeight: "160px",
              overflowY: "auto",
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #222",
                }}
                onClick={() => {
                  setSearchTerm(s);
                  setSuggestions([]);
                  selectCountry(s);
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Globe */}
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="#000"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0,0,0,0.3)"}
        polygonStrokeColor={() => "#222"}
        polygonAltitude={0.015}
        onPolygonClick={handleClick}
      />

      {/* Sidebar */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "340px",
            background: "rgba(0,0,0,0.92)",
            color: "#fff",
            overflowY: "auto",
            padding: "20px",
            borderLeft: "2px solid #0ff",
            zIndex: 25,
          }}
        >
          <h2 style={{ color: "#0ff", marginTop: 0 }}>{selectedCountry}</h2>

          {countryChannels.length > 0 ? (
            countryChannels.map((ch, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "15px",
                  borderBottom: "1px solid #333",
                  paddingBottom: "10px",
                  cursor: "pointer",
                }}
                onClick={() => setActiveChannel(ch)}
              >
                <b>{ch.name}</b>
                <br />
                <small>{ch.language?.toUpperCase() || "N/A"}</small>
              </div>
            ))
          ) : (
            <p style={{ color: "#888" }}>No channels available</p>
          )}
        </div>
      )}

      {/* Floating Player */}
      {activeChannel && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            background: "#000",
            border: "2px solid #0ff",
            borderRadius: "10px",
            padding: "10px",
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#0ff",
              marginBottom: "5px",
            }}
          >
            <span>{activeChannel.name}</span>
            <button
              onClick={() => setActiveChannel(null)}
              style={{
                background: "none",
                color: "#0ff",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ✖
            </button>
          </div>

          {activeChannel.type === "youtube" ? (
            <iframe
              width="100%"
              height="320"
              src={activeChannel.url}
              allow="autoplay; encrypted-media"
              title={activeChannel.name}
            ></iframe>
          ) : (
            <video
              width="100%"
              height="320"
              controls
              autoPlay
              style={{ borderRadius: "6px" }}
              ref={(el) => {
                if (el && Hls.isSupported()) {
                  const hls = new Hls();
                  hls.loadSource(activeChannel.url);
                  hls.attachMedia(el);
                } else if (el) {
                  el.src = activeChannel.url;
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
