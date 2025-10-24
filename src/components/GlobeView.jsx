import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Globe from "react-globe.gl";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [globeData, setGlobeData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [channels, setChannels] = useState({});
  const [hoverCountry, setHoverCountry] = useState(null);
  const [themeColor, setThemeColor] = useState("#00ffff");

  // region-based theme color map
  const regionColors = {
    AS: "#ff007f", // Asia
    EU: "#00ccff", // Europe
    AF: "#ffcc00", // Africa
    NA: "#00ff88", // North America
    SA: "#ff5500", // South America
    OC: "#cc00ff", // Oceania
    AN: "#ffffff", // Antarctica
    default: "#00ffff",
  };

  // smooth background color animation
  useEffect(() => {
    document.body.style.transition = "background 3s ease";
    document.body.style.background = `radial-gradient(circle at 30% 30%, ${themeColor}22, #000)`;
  }, [themeColor]);

  useEffect(() => {
    async function loadData() {
      try {
        const worldRes = await fetch("/world-110m.json");
        const worldData = await worldRes.json();
        setGlobeData(worldData);

        const channelData = await loadChannels();
        setChannels(channelData || {});
      } catch (err) {
        console.error("Failed to load globe or channels:", err);
      }
    }
    loadData();
  }, []);

  const handleCountryClick = (country) => {
    if (!country || !country.properties) return;
    const iso = country.properties.ISO_A2;
    const data = channels[iso];
    setSelectedCountry({
      name: country.properties.ADMIN,
      code: iso,
      region: country.properties.REGION_UN || "default",
      channels: data?.channels || [],
    });

    // change theme color based on region
    const regionKey =
      country.properties.CONTINENT || country.properties.REGION_UN || "default";
    const newColor = regionColors[regionKey.substring(0, 2)] || regionColors.default;
    setThemeColor(newColor);
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      {/* Gradient overlay background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${themeColor}33, transparent 70%)`,
          zIndex: 0,
        }}
      ></div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 25,
          fontSize: "1.6rem",
          fontWeight: "bold",
          textShadow: `0 0 10px ${themeColor}`,
          color: themeColor,
          zIndex: 2,
          letterSpacing: "1px",
        }}
      >
        🌐 Gengas TV
      </div>

      {!globeData ? (
        <div
          style={{
            color: "#fff",
            textAlign: "center",
            marginTop: "50vh",
            fontSize: "1.2rem",
            textShadow: "0 0 10px #00ffff",
          }}
        >
          Loading Gengas TV Globe...
        </div>
      ) : (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          backgroundColor="rgba(0,0,0,0)"
          polygonsData={globeData.features}
          polygonAltitude={(d) => (hoverCountry === d ? 0.03 : 0.015)}
          polygonCapColor={(d) =>
            selectedCountry?.code === d.properties.ISO_A2
              ? `${themeColor}aa`
              : hoverCountry === d
              ? `${themeColor}55`
              : "rgba(80,80,80,0.25)"
          }
          polygonSideColor={() => "rgba(30,30,30,0.2)"}
          onPolygonHover={setHoverCountry}
          onPolygonClick={handleCountryClick}
          polygonsTransitionDuration={200}
          atmosphereColor={themeColor}
          atmosphereAltitude={0.18}
          enablePointerInteraction
          showGlobe={true}
          showAtmosphere={true}
        />
      )}

      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "340px",
            background: "rgba(0,0,0,0.85)",
            padding: "1.2rem",
            overflowY: "auto",
            borderLeft: `2px solid ${themeColor}`,
            zIndex: 5,
            boxShadow: `0 0 20px ${themeColor}44`,
            transition: "border 0.3s ease",
          }}
        >
          <h2
            style={{
              color: themeColor,
              textShadow: `0 0 8px ${themeColor}`,
              marginBottom: "0.5rem",
            }}
          >
            {selectedCountry.name}
          </h2>
          <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
            Code: {selectedCountry.code} | Region: {selectedCountry.region}
          </p>
          <hr style={{ borderColor: `${themeColor}33`, margin: "0.5rem 0" }} />

          {selectedCountry.channels.length > 0 ? (
            selectedCountry.channels.map((ch, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "1rem",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  padding: "0.6rem",
                  border: `1px solid ${themeColor}33`,
                }}
              >
                <strong style={{ color: themeColor }}>{ch.name}</strong>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                  {ch.language?.toUpperCase() || "Unknown"} | {ch.type}
                </div>
                {ch.type === "youtube" ? (
                  <iframe
                    src={ch.url}
                    width="100%"
                    height="160"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={ch.name}
                    style={{
                      border: "none",
                      marginTop: "0.5rem",
                      borderRadius: "8px",
                    }}
                  ></iframe>
                ) : (
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: themeColor,
                      fontSize: "0.9rem",
                      display: "inline-block",
                      marginTop: "0.5rem",
                    }}
                  >
                    ▶ Watch Stream
                  </a>
                )}
              </div>
            ))
          ) : (
            <p>No channels found for this country.</p>
          )}
        </div>
      )}
    </div>
  );
}
