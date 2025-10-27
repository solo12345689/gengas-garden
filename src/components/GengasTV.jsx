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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load world and channels
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
        console.error("Failed to load world map:", err);
      }

      const ch = await loadChannels();
      if (ch) setChannels(ch);
      setIsLoading(false);
    })();
  }, []);

  // Configure globe after data load
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = false;
      controls.enableZoom = true;
      controls.enablePan = false;
      globeEl.current.pointOfView({ altitude: 2.2 }); // 100% zoom out
    }
  }, [countries]);

  // Handle clicking a country
  const handleClick = (country) => {
    if (!country?.properties?.name) return;
    const name = country.properties.name.trim();
    selectCountry(name);
  };

  // Select by name (used by click or search)
  const selectCountry = (name) => {
    setSelectedCountry(name);
    const normalizedKeys = Object.keys(channels);
    const direct = channels[name];
    const partialKey = normalizedKeys.find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    const fallback = normalizedKeys.find((k) =>
      k.toLowerCase().includes(name.toLowerCase())
    );

    const data =
      direct ||
      (partialKey ? channels[partialKey] : null) ||
      (fallback ? channels[fallback] : null);

    if (data?.channels?.length) {
      setCountryChannels(data.channels);
      console.log(`Loaded ${data.channels.length} channels for ${name}`);
    } else {
      setCountryChannels([]);
      console.warn(`No channels for ${name}`);
    }

    // Auto focus globe on selected country
    if (globeEl.current && countries.length > 0) {
      const found = countries.find(
        (c) => c.properties.name.toLowerCase() === name.toLowerCase()
      );
      if (found) {
        const centroid = globeEl.current.getCoords(found);
        globeEl.current.pointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 1.3 }, 1000);
      }
    }
  };

  // Color generation (unique per country)
  const getCountryColor = (d) => {
    const hash = d.properties.name
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 55%)`;
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
          color: "#fff",
          fontSize: "24px",
          fontWeight: "bold",
          textShadow: "0 0 10px #00ffff",
          zIndex: 20,
        }}
      >
        🌍 Genga Garden TV
      </div>

      {/* Search bar */}
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
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && selectCountry(searchTerm)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #0ff",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontSize: "14px",
            width: "200px",
          }}
        />
        <button
          onClick={() => selectCountry(searchTerm)}
          style={{
            marginLeft: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "#0ff",
            border: "none",
            cursor: "pointer",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          🔍
        </button>
      </div>

      {/* Globe */}
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="#000"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0,0,0,0.2)"}
        polygonStrokeColor={() => "#111"}
        polygonAltitude={0.015}
        onPolygonClick={handleClick}
      />

      {/* Sidebar for country */}
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
          }}
        >
          <h2 style={{ color: "#0ff", marginTop: 0 }}>{selectedCountry}</h2>

          {countryChannels.length > 0 ? (
            countryChannels.map((ch, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "18px",
                  borderBottom: "1px solid #333",
                  paddingBottom: "10px",
                }}
              >
                <b>{ch.name}</b>
                <br />
                <small>{ch.language?.toUpperCase() || "N/A"}</small>
                <br />
                {ch.type === "youtube" ? (
                  <iframe
                    width="100%"
                    height="200"
                    src={ch.url}
                    title={ch.name}
                    allow="autoplay; encrypted-media"
                    style={{ borderRadius: "6px", marginTop: "6px" }}
                  ></iframe>
                ) : (
                  <video
                    width="100%"
                    height="200"
                    controls
                    muted
                    style={{ borderRadius: "6px", marginTop: "6px" }}
                    ref={(el) => {
                      if (el && Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(ch.url);
                        hls.attachMedia(el);
                      } else if (el) {
                        el.src = ch.url;
                      }
                    }}
                  />
                )}
              </div>
            ))
          ) : (
            <p style={{ color: "#888" }}>No channels available</p>
          )}
        </div>
      )}
    </div>
  );
}
