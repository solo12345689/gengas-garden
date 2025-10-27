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

  // Load world map + channel data
  useEffect(() => {
    (async () => {
      try {
        console.log("Loading world data...");
        const world = await fetch("/world-110m.json").then((res) => res.json());
        const features = topojson.feature(
          world,
          world.objects.countries
        ).features;
        setCountries(features);
        console.log("Loaded", features.length, "countries");
      } catch (err) {
        console.error("Failed to load world JSON:", err);
      }

      const ch = await loadChannels();
      if (ch) {
        setChannels(ch);
        console.log("Loaded channels:", Object.keys(ch).length);
      }
      setIsLoading(false);
    })();
  }, []);

  // Fix auto black globe — ensure material applied immediately
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      globeEl.current.controls().enableZoom = true;
      globeEl.current.controls().enablePan = false;
    }
  }, [countries]);

  const handleClick = (country) => {
    if (!country?.properties?.name) return;
    const name = country.properties.name.trim();
    console.log("Clicked:", name);

    setSelectedCountry(name);

    // Match country name by exact key or close match
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
      console.log(`Found ${data.channels.length} channels for ${name}`);
    } else {
      setCountryChannels([]);
      console.warn(`No channels found for ${name}`);
    }
  };

  // Distinct colors per country
  const getCountryColor = (d) => {
    const hash = d.properties.name
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
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
          fontSize: "22px",
          fontWeight: "bold",
          zIndex: 10,
          textShadow: "0 0 8px #0ff",
        }}
      >
        🌍 Genga Garden TV
      </div>

      {/* Globe */}
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="#000"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0,0,0,0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonAltitude={0.015}
        onPolygonClick={handleClick}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* Sidebar */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100vh",
            width: "340px",
            background: "rgba(0,0,0,0.9)",
            color: "#fff",
            overflowY: "auto",
            padding: "20px",
            borderLeft: "2px solid #0ff",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#0ff" }}>{selectedCountry}</h2>

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
