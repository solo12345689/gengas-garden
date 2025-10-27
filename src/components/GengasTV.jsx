import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import Hls from "hls.js";
import { loadChannels } from "../utils/fetchChannels";

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Safe color generator for colorful map
  const getColorSafe = (id) => {
    const n = Number(id) || (id && id.toString().charCodeAt(0)) || 1;
    const hue = (n * 47) % 360;
    return `hsl(${hue},70%,55%)`;
  };

  useEffect(() => {
    (async () => {
      try {
        // Load world map
        const r = await fetch("/world-110m.json");
        const topo = await r.json();
        const features = topojson.feature(topo, topo.objects.countries).features;
        setCountries(features);

        // Load channels
        const ch = await loadChannels();
        if (ch) setChannels(ch);
      } catch (err) {
        console.error("Error loading world/channels:", err);
      }
      setLoading(false);
    })();
  }, []);
// Click handler (ignore duplicate selections)
const handleClick = (feat) => {
  if (!feat || !channels) return;

  const name = feat.properties?.name?.trim();
  if (!name) return;

  // 👇 prevent re-triggering same country during globe moves
  if (selectedCountry && selectedCountry.name === name) {
    return; // ignore duplicate clicks or zoom triggers
  }

  const iso_a2 = feat.properties?.iso_a2 || "";
  const iso_a3 = feat.properties?.iso_a3 || "";
  const id = feat.id?.toString() || "";

  const keysToTry = [name, iso_a2, iso_a3, id].filter(Boolean);
  let matched = null;

  for (const k of keysToTry) {
    const match = Object.keys(channels).find(
      (x) => x.toLowerCase() === k.toLowerCase()
    );
    if (match) {
      matched = channels[match];
      break;
    }
  }

  // fallback partial match
  if (!matched) {
    matched = Object.entries(channels).find(([k]) =>
      name.toLowerCase().includes(k.toLowerCase())
    )?.[1];
  }

  if (matched && matched.channels?.length) {
    setSelectedCountry({ name, channels: matched.channels });
    setCurrentChannel(matched.channels[0]);
  } else {
    setSelectedCountry({ name, channels: [] });
    setCurrentChannel(null);
  }
};
  };

  // HLS player setup
  useEffect(() => {
    if (!currentChannel) return;
    if (currentChannel.type === "iptv" && currentChannel.url?.endsWith(".m3u8")) {
      const video = document.getElementById("livePlayer");
      if (!video) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(currentChannel.url);
        hls.attachMedia(video);
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = currentChannel.url;
      }
    }
  }, [currentChannel]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#0ff",
          fontSize: "1.5em",
        }}
      >
        Loading Genga Garden TV...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#000",
        color: "#fff",
      }}
    >
      {/* Globe Section */}
      <div style={{ flex: 1 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          polygonsData={countries}
          polygonCapColor={(d) => getColorSafe(d.id)}
          polygonSideColor={() => "rgba(0,0,0,0.15)"}
          polygonStrokeColor={() => "#111"}
          polygonLabel={(d) => d.properties?.name || ""}
          onPolygonClick={handleClick}
          polygonsTransitionDuration={300}
          atmosphereColor="deepskyblue"
          atmosphereAltitude={0.25}
        />
      </div>

      {/* Sidebar */}
      <div
        style={{
          width: 360,
          background: "#071018",
          borderLeft: "2px solid #00ffcc",
          padding: 20,
          overflowY: "auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#00ffcc",
            fontSize: "1.4em",
            marginBottom: 16,
          }}
        >
          🌍 Genga Garden TV
        </h1>

        {selectedCountry ? (
          <>
            <h2 style={{ color: "#0ff", marginBottom: 8 }}>
              {selectedCountry.name}
            </h2>
            {selectedCountry.channels.length > 0 ? (
              <>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {selectedCountry.channels.map((ch, i) => (
                    <li
                      key={i}
                      style={{
                        background:
                          currentChannel?.name === ch.name
                            ? "#00ffcc33"
                            : "#111",
                        margin: "8px 0",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      onClick={() => setCurrentChannel(ch)}
                    >
                      <strong>{ch.name}</strong>
                      <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                        {ch.language?.toUpperCase() || ""}
                      </div>
                    </li>
                  ))}
                </ul>

                {currentChannel && (
                  <div style={{ marginTop: "12px" }}>
                    {currentChannel.type === "youtube" ? (
                      <iframe
                        src={currentChannel.url}
                        width="100%"
                        height="200"
                        title={currentChannel.name}
                        allowFullScreen
                        style={{ borderRadius: "8px" }}
                      ></iframe>
                    ) : (
                      <video
                        id="livePlayer"
                        controls
                        autoPlay
                        width="100%"
                        height="200"
                        style={{ borderRadius: "8px", background: "#000" }}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ opacity: 0.7 }}>No channels available</p>
            )}
          </>
        ) : (
          <p style={{ opacity: 0.7 }}>Select a country to view channels</p>
        )}
            </div>
    </div>
  );
} // ✅ this closes the function
export default GengasTV; // ✅ final line
