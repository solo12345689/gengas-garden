import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const GengasTV = () => {
  const globeRef = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [channels, setChannels] = useState({});
  const [hoverCountry, setHoverCountry] = useState(null);

  useEffect(() => {
    // Load countries geometry (TopoJSON)
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((worldData) => {
        const countries = window.topojson.feature(
          worldData,
          worldData.objects.countries
        );
        setCountries(countries);
      });

    // Load channels data
    fetch("/channels.json")
      .then((res) => res.json())
      .then((data) => setChannels(data));
  }, []);

  // Random color per country
  const getCountryColor = (country) => {
    if (hoverCountry && hoverCountry.properties.name === country.properties.name)
      return "#ffcc00"; // highlight color
    const rand = Math.floor(Math.random() * 360);
    return `hsl(${rand}, 70%, 50%)`;
  };

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = false; // Manual rotation only
    controls.enableZoom = true;
  }, [countries]);

  return (
    <div style={{ background: "radial-gradient(circle, #00111a, #000)", height: "100vh" }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        polygonsData={countries.features}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0, 100, 255, 0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonHover={setHoverCountry}
        polygonsTransitionDuration={200}
      />

      {hoverCountry && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: "10px 15px",
            borderRadius: "12px",
            width: "250px",
            fontSize: "14px",
          }}
        >
          <h3>{hoverCountry.properties.name}</h3>
          <div>
            {channels[hoverCountry.properties.ISO_A2] ? (
              <ul style={{ paddingLeft: "20px" }}>
                {channels[hoverCountry.properties.ISO_A2].channels.map(
                  (ch, i) => (
                    <li key={i}>
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#00ccff" }}
                      >
                        {ch.name}
                      </a>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>No channels available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GengasTV;
