import React, { useEffect, useState } from "react";
import GengasTV from "./components/GengasTV";
import ChannelsPanel from "./components/ChannelsPanel";

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [channels, setChannels] = useState([]);

  const handleSelectCountry = (name, iso) => {
    setSelectedCountry(name);
    // Load from your existing public/channels.json
    fetch("/channels.json")
      .then((r) => r.json())
      .then((data) => {
        const list =
          data[iso?.toUpperCase()] ||
          Object.values(data).find((v) =>
            Array.isArray(v) &&
            v.some((c) =>
              (c.country || "").toLowerCase().includes(name.toLowerCase())
            )
          ) ||
          [];
        setChannels(list);
      });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1 }}>
        <GlobeView onCountrySelect={handleSelectCountry} />
      </div>
      <ChannelsPanel country={selectedCountry} channels={channels} />
    </div>
  );
}
