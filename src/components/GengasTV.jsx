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

  // Load world and channels
  useEffect(() => {
    (async () => {
      try {
        // Load world topology (political borders)
        const worldData = await fetch("/world-110m.json").then((res) =>
          res.json()
        );
        const countriesData = topojson.feature(
          worldData,
          worldData.objects.countries
        ).features;
        setCountries(countriesData);
        console.log(`Parsed ${countriesData.length} country features`);
      } catch (err) {
        console.error("Failed to load world JSON", err);
      }

      // Load channel data
      const ch = await loadChannels();
      if (ch) {
        setChannels(ch);
        console.log(
          `Channels loaded (keys: ${Object.keys(ch).slice(0, 10).join(", ")} ...)`
        );
      } else {
        console.error("Failed to load channels");
      }
    })();
  }, []);

  // Handle click on a country
  const handleClick = (country) => {
    const countryName = country?.properties?.name;
    if (!countryName) return;

    console.log(`Clicked country: ${countryName}`);

    setSelectedCountry(countryName);

    // Match by direct or partial key
    const directMatch = channels[countryName];
    const altMatch =
      Object.keys(channels).find(
        (key) => key.toLowerCase().includes(countryName.toLowerCase())
      ) || null;

    const matchedData = directMatch || (altMatch ? channels[altMatch] : null);

    if (matchedData && matchedData.channels?.length) {
      setCountryChannels(matchedData.channels);
    } else {
      setCountryChannels([]);
      console.warn(`No match for ${countryName}`);
    }
  };

  // Colorful countries
  const getCountryColor = (d) => {
    const seed = d.properties.name.length;
    const hue = (seed * 47) % 360;
    return `hsl(${hue}, 80%, 55%)`;
  };

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000" }}>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold",
          zIndex: 10,
        }}
      >
        🌍 Genga Garden TV
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="#000"
        polygonsData={countries}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => "rgba(0, 100, 200, 0.15)"}
        polygonStrokeColor={() => "#111"}
        onPolygonClick={handleClick}
        polygonAltitude={0.02}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {selectedCountry && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            right: "0",
            width: "320px",
            height: "calc(100vh - 70px)",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            overflowY: "auto",
            padding: "15px",
            borderLeft: "2px solid #0ff",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{selectedCountry}</h2>
          {countryChannels.length > 0 ? (
            countryChannels.map((ch, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #333",
                }}
              >
                <strong>{ch.name}</strong>
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
                  ></iframe>
                ) : (
                  <video
                    width="100%"
                    height="200"
                    controls
                    autoPlay
                    muted
                    onError={() =>
                      console.error(`Failed to load video: ${ch.url}`)
                    }
                    ref={(el) => {
                      if (el && Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(ch.url);
                        hls.attachMedia(el);
                      }
                    }}
                  />
                )}
              </div>
            ))
          ) : (
            <p>No channels available</p>
          )}
        </div>
      )}
    </div>
  );
}
