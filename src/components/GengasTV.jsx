import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { geoCentroid } from "d3-geo";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryChannels, setCountryChannels] = useState([]);

  // 🎨 Random color map cache
  const colorMap = useRef({});

  // 🛰 Load world data
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topology) => {
        const features = topojson.feature(topology, topology.objects.countries).features;
        setCountries(features);
      });
  }, []);

  // 📡 Load channels
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      setChannels(data || {});
      console.log("Channels loaded (keys):", Object.keys(data || {}));
    })();
  }, []);

  // 🎯 Match clicked country → channel
  function findChannelsForFeature(feature) {
    if (!feature || !channels) return null;
    const p = feature.properties || {};
    const names = [
      p.name, p.admin, p.NAME, p.NAME_LONG, p.name_long,
      p.sovereignt, p.formal_en, feature.id, p.iso_a2, p.iso_a3
    ].filter(Boolean);

    for (const k of Object.keys(channels)) {
      for (const n of names) {
        if (k.toLowerCase() === n.toLowerCase()) return channels[k];
      }
    }
    for (const k of Object.keys(channels)) {
      for (const n of names) {
        if (k.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(k.toLowerCase()))
          return channels[k];
      }
    }
    return null;
  }

  // 🪐 Handle click
  function handleCountryClick(feature) {
    const match = findChannelsForFeature(feature);
    const name = feature.properties?.name || feature.properties?.admin || "Unknown";

    if (match) {
      setSelectedCountry(name);
      setCountryChannels(match.channels || []);
      console.log(`✅ Selected ${name} — ${match.channels?.length || 0} channels`);
    } else {
      setSelectedCountry(name);
      setCountryChannels([]);
      console.warn(`⚠️ No channels found for ${name}`);
    }

    // Center globe
    try {
      const [lon, lat] = geoCentroid(feature);
      if (globeRef.current && lat && lon) {
        globeRef.current.pointOfView({ lat, lng: lon, altitude: 1.6 }, 1000);
      }
    } catch (e) {
      console.warn("Centering failed:", e);
    }
  }

  // 🎨 Color each country randomly
  function getCountryColor(feature) {
    const id = feature.id;
    if (!colorMap.current[id]) {
      const hue = Math.floor(Math.random() * 360);
      colorMap.current[id] = `hsl(${hue}, 70%, 55%)`;
    }
    return colorMap.current[id];
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "radial-gradient(circle at center, #000010, #000)" }}>
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,1)"
        globeMaterial={
          new THREE.MeshPhongMaterial({
            color: 0x111111,
            emissive: 0x0,
            shininess: 0.7,
            transparent: true,
            opacity: 1
          })
        }
        polygonsData={countries}
        polygonCapColor={(d) => getCountryColor(d)}
        polygonSideColor={() => "rgba(0,0,0,0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonClick={handleCountryClick}
        onPolygonHover={(hoverD) =>
          (document.body.style.cursor = hoverD ? "pointer" : "default")
        }
        polygonLabel={(d) => `<b>${d.properties.name}</b>`}
        autoRotate={true}
        autoRotateSpeed={0.6}
      />

      {/* 🧠 Sidebar (only when country selected) */}
      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "2%",
            transform: "translateY(-50%)",
            width: "320px",
            maxHeight: "85vh",
            background: "rgba(0,0,0,0.85)",
            color: "white",
            border: "1px solid cyan",
            borderRadius: "12px",
            padding: "12px",
            overflowY: "auto",
            boxShadow: "0 0 20px cyan",
            transition: "0.3s ease-in-out",
          }}
        >
          <h2 style={{ color: "cyan", marginBottom: "10px" }}>{selectedCountry}</h2>
          {countryChannels.length === 0 ? (
            <p>No channels available</p>
          ) : (
            countryChannels.map((ch, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "12px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: "6px",
                }}
              >
                <b>{ch.name}</b>
                <p style={{ fontSize: "12px", opacity: 0.8 }}>{ch.language?.toUpperCase()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
