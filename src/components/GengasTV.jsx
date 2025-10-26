import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import Hls from "hls.js";
import { loadChannels } from "../utils/fetchChannels";

/**
 * Diagnostic GengasTV.jsx
 * - Logs loads and matching steps to console
 * - Shows errors in UI
 * - Tries many matching strategies
 */

export default function GengasTV() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [channels, setChannels] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [statusMessages, setStatusMessages] = useState([]); // shown in UI
  const [loading, setLoading] = useState(true);

  const addStatus = (m) => {
    console.log(m);
    setStatusMessages((s) => [m, ...s].slice(0, 20));
  };

  // safe color generator (no null)
  const getColorSafe = (id) => {
    const n = Number(id) || (id && id.toString().charCodeAt(0)) || 1;
    const hue = (n * 47) % 360;
    return `hsl(${hue},70%,55%)`;
  };

  useEffect(() => {
    (async () => {
      addStatus("Starting load: world map + channels");

      // 1) Load world JSON (local first, else fallback to CDN)
      try {
        addStatus("Fetching /world-110m.json (local public)");
        const r = await fetch("/world-110m.json", { cache: "no-store" });
        if (!r.ok) throw new Error(`local world fetch failed: ${r.status}`);
        const topo = await r.json();
        addStatus("Local world JSON fetched (OK)");
        try {
          const features = topojson.feature(topo, topo.objects.countries).features;
          setCountries(features);
          addStatus(`Parsed ${features.length} country features from local world JSON`);
        } catch (e) {
          addStatus("Local world JSON parse failed, will try CDN: " + e.message);
          console.warn("local world parse failed:", e, topo);
          // try CDN fallback
          const cdnUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
          addStatus("Fetching CDN world JSON: " + cdnUrl);
          const r2 = await fetch(cdnUrl);
          if (!r2.ok) throw new Error("CDN world fetch failed: " + r2.status);
          const topo2 = await r2.json();
          const features2 = topojson.feature(topo2, topo2.objects.countries).features;
          setCountries(features2);
          addStatus(`Parsed ${features2.length} country features from CDN`);
        }
      } catch (err) {
        console.error("World load error:", err);
        addStatus("ERROR loading world-110m.json: " + err.message);
      }

      // 2) Load channels (using your helper, which tries remote then /channels.json)
      try {
        addStatus("Loading channels via loadChannels()");
        const ch = await loadChannels();
        if (!ch) {
          addStatus("loadChannels returned null (no data)");
          console.warn("loadChannels returned null");
          setChannels(null);
        } else {
          setChannels(ch);
          addStatus("Channels loaded (keys: " + Object.keys(ch).slice(0,10).join(", ") + (Object.keys(ch).length>10? ", ...":"") + ")");
          // sanity: show first country entry
          const sampleKey = Object.keys(ch)[0];
          addStatus("Channels sample key0: " + sampleKey);
          console.log("channels sample object:", ch[sampleKey]);
        }
      } catch (err) {
        console.error("Channels load error:", err);
        addStatus("ERROR loading channels: " + err.message);
      }

      setLoading(false);
    })();
  }, []);

  // click handler with many matching strategies + diagnostic logs
  const handleClick = (feat) => {
    if (!feat) return;
    const props = feat.properties || {};
    const name = (props.name || "").trim();
    const iso_a2 = (props.iso_a2 || props.ISO_A2 || "").toString().trim();
    const iso_a3 = (props.iso_a3 || props.ADM0_A3 || "").toString().trim();
    addStatus(`Clicked: ${name}  iso_a2="${iso_a2}" iso_a3="${iso_a3}" id=${feat.id}`);

    // Build list of possible keys to check (prefer exact ISO2)
    const keysToTry = [];
    if (iso_a2) keysToTry.push(iso_a2.toUpperCase());
    if (iso_a3) keysToTry.push(iso_a3.toUpperCase());
    if (name) keysToTry.push(name);
    // also try short name variants (without "Republic", dots etc)
    if (name) {
      keysToTry.push(name.replace(/\s*\(.*\)$/, "")); // remove parenthesis
      keysToTry.push(name.split(",")[0]); // part before comma
    }
    // numeric id
    if (feat.id) keysToTry.push(String(feat.id));
    addStatus("Matching keys tried: " + keysToTry.join(", "));

    // if channels not loaded
    if (!channels) {
      addStatus("Channels not loaded (null). Cannot match.");
      setSelectedCountry({ name, channels: [] });
      setCurrentChannel(null);
      return;
    }

    // attempt direct lookup by key
    let matched = null;
    for (const k of keysToTry) {
      if (!k) continue;
      // direct key (case-insensitively)
      const directKey = Object.keys(channels).find(x => x.toLowerCase() === k.toLowerCase());
      if (directKey) {
        matched = channels[directKey];
        addStatus(`Matched by direct key: "${directKey}"`);
        break;
      }
    }

    // attempt fuzzy search by comparing 'name' field inside channel entries
    if (!matched) {
      matched = Object.values(channels).find(c => {
        if (!c) return false;
        if (c.name && name && c.name.toLowerCase() === name.toLowerCase()) return true;
        // sometimes code field equals iso (IN) or full name
        if (c.code && iso_a2 && c.code.toLowerCase() === iso_a2.toLowerCase()) return true;
        return false;
      });
      if (matched) addStatus("Matched by entry.name or entry.code.");
    }

    // final fallback: try partial match of names
    if (!matched && name) {
      matched = Object.values(channels).find(c => {
        if (!c || !c.name) return false;
        const cn = c.name.toLowerCase();
        const pn = name.toLowerCase();
        return cn.includes(pn) || pn.includes(cn);
      });
      if (matched) addStatus("Matched by partial name match.");
    }

    if (matched && matched.channels && matched.channels.length) {
      setSelectedCountry({ name, channels: matched.channels });
      setCurrentChannel(matched.channels[0]);
      addStatus(`Selected ${name} — channels count: ${matched.channels.length}`);
      console.log("Matched channels for", name, matched);
    } else {
      addStatus(`No channels found for ${name}`);
      console.warn("No match for", name, "tried", keysToTry);
      setSelectedCountry({ name, channels: [] });
      setCurrentChannel(null);
    }
  };

  // HLS player initialization for .m3u8
  useEffect(() => {
    if (!currentChannel) return;
    if (currentChannel.type === "iptv" && currentChannel.url && currentChannel.url.endsWith(".m3u8")) {
      const video = document.getElementById("livePlayer");
      if (!video) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(currentChannel.url);
        hls.attachMedia(video);
        return () => hls.destroy();
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentChannel.url;
      } else {
        addStatus("Browser cannot play HLS natively and Hls.js not supported.");
      }
    }
  }, [currentChannel]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#fff" }}>
      <div style={{ flex: 1 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          polygonsData={countries}
          polygonCapColor={(d) => getColorSafe(d.id)}
          polygonSideColor={() => "rgba(0,0,0,0.15)"}
          polygonStrokeColor={() => "#111"}
          onPolygonClick={handleClick}
          polygonLabel={(d) => d.properties?.name || ""}
          polygonsTransitionDuration={300}
          atmosphereColor="deepskyblue"
          atmosphereAltitude={0.25}
        />
      </div>

      <div style={{ width: 360, padding: 16, background: "#071018", borderLeft: "2px solid #00ffcc", overflowY: "auto" }}>
        <h1 style={{ color: "#00ffcc", textAlign: "center" }}>🌍 Genga Garden TV</h1>

        <div style={{ marginTop: 10 }}>
          <strong>Status (latest):</strong>
          <ul style={{ maxHeight: 160, overflowY: "auto", paddingLeft: 12 }}>
            {statusMessages.map((m, i) => <li key={i} style={{ fontSize: 12, opacity: 0.95 }}>{m}</li>)}
          </ul>
        </div>

        <div style={{ marginTop: 14 }}>
          <strong>Selected:</strong>
          {selectedCountry ? (
            <>
              <div style={{ marginTop: 6, fontWeight: "600" }}>{selectedCountry.name}</div>
              {selectedCountry.channels && selectedCountry.channels.length ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.9 }}>{selectedCountry.channels.length} channel(s)</div>
                  <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                    {selectedCountry.channels.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ padding: 8, background: currentChannel?.name === c.name ? "#00ffcc22" : "#0b0b0b", borderRadius: 6, cursor: "pointer" }}
                             onClick={() => setCurrentChannel(c)}>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>{c.type} {c.language ? ' • ' + c.language : ''}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ marginTop: 8, opacity: 0.8 }}>No channels available</div>
              )}
            </>
          ) : (
            <div style={{ marginTop: 6, opacity: 0.8 }}>Click a country on the globe to load channels</div>
          )}
        </div>

        {currentChannel && (
          <div style={{ marginTop: 12 }}>
            <strong>Now Playing</strong>
            <div style={{ marginTop: 8 }}>
              {currentChannel.type === "youtube" ? (
                <iframe src={currentChannel.url} title={currentChannel.name} width="100%" height="200" allowFullScreen style={{ borderRadius: 6 }} />
              ) : (
                <video id="livePlayer" controls width="100%" height="200" style={{ borderRadius: 6, background: "#000" }} />
              )}
              <div style={{ marginTop: 6 }}>{currentChannel.name}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
