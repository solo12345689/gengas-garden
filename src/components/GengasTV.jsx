import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import * as THREE from "three";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [worldData, setWorldData] = useState(null);
  const [channels, setChannels] = useState({});
  const [hoverCountry, setHoverCountry] = useState(null);

  // 🌍 Load world map
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topo) => {
        if (topo.objects && topo.objects.countries) {
          const geoJson = topojson.feature(topo, topo.objects.countries);
          setWorldData(geoJson);
        } else {
          console.error("Invalid world data format", topo);
        }
      })
      .catch((err) => console.error("Failed to load world map:", err));
  }, []);

  // 📺 Load channel list
  useEffect(() => {
    (async () => {
      const data = await loadChannels();
      if (data) setChannels(data);
    })();
  }, []);

  // 🌈 Bright colorful material for countries
  const getCountryColor = (iso) => {
    if (hoverCountry && hoverCountry === iso) return "#ffffff";
    // Assign each country a random bright color for visual variety
    const hue = (iso.charCodeAt(0) * 37) % 360;
    return `hsl(${hue}, 85%, 55%)`;
  };

  return (
    <div style={{ background: "radial-gradient(#0a0015, #000)", height: "100vh" }}>
      {worldData ? (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          polygonsData={worldData.features}
          polygonCapColor={(feat) => getCountryColor(feat.id)}
          polygonSideColor={() => "rgba(0, 0, 0, 0.2)"}
          polygonStrokeColor={() => "#111"}
          onPolygonHover={(feat) => setHoverCountry(feat ? feat.id : null)}
          onPolygonClick={(feat) => {
            const countryCode = feat.id;
            const country = channels[countryCode];
            if (country && country.channels?.length > 0) {
              const ch = country.channels[0];
              window.open(ch.url, "_blank");
            } else {
              alert(`No channels found for ${countryCode}`);
            }
          }}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={false}
          polygonsTransitionDuration={300}
        />
      ) : (
        <div style={{ color: "white", textAlign: "center", paddingTop: "40vh" }}>
          Loading Gengas TV Globe...
        </div>
      )}
    </div>
  );
}
