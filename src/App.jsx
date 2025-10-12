import React, { useEffect, useState } from "react";
import Player from "./Player";

const CHANNELS_URL =
  "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";

export default function App() {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load all channels remotely
  useEffect(() => {
    fetch(CHANNELS_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch channels");
        return res.json();
      })
      .then((data) => {
        setChannels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading channels:", err);
        setLoading(false);
      });
  }, []);

  const handleChannelClick = (channel) => {
    setCurrentChannel(channel);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Loading channels...
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-red-400">
        No channels available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-semibold text-white">Gengas Garden</h1>
        <p className="text-sm text-gray-400">Live IPTV + YouTube</p>
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row">
        {/* Sidebar channel list */}
        <aside className="w-full md:w-1/3 border-r border-gray-800 overflow-y-auto h-[calc(100vh-4rem)]">
          {channels.map((channel, i) => (
            <div
              key={i}
              onClick={() => handleChannelClick(channel)}
              className={`cursor-pointer px-4 py-3 hover:bg-gray-800 transition ${
                currentChannel?.name === channel.name ? "bg-gray-800" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                {channel.logo && (
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-10 h-10 rounded-md"
                  />
                )}
                <div>
                  <h2 className="text-lg font-medium">{channel.name}</h2>
                  <p className="text-xs text-gray-400">
                    {channel.country} • {channel.genre || channel.language}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </aside>

        {/* Player section */}
        <section className="flex-1 flex justify-center items-center bg-black">
          {currentChannel ? (
            <Player key={currentChannel.name} channel={currentChannel} />
          ) : (
            <p className="text-gray-400">Select a channel to start watching</p>
          )}
        </section>
      </main>
    </div>
  );
}
