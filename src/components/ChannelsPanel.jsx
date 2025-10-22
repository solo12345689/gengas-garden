import React from "react";

export default function ChannelsPanel({ country, channels }) {
  return (
    <div style={{
      width: 350,
      background: "#0f1724",
      color: "#fff",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        padding: 16,
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h3 style={{ margin: 0 }}>Select a Country</h3>
        <small style={{ opacity: 0.7 }}>
          {country || "Click on the globe to select"}
        </small>
      </div>
      {channels?.length ? (
        channels.map((ch, i) => (
          <div key={i} style={{
            padding: 12,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer"
          }}>
            <strong>{ch.name || ch.title}</strong>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {ch.type || ch.url}
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: 16, opacity: 0.6 }}>No channels available</div>
      )}
    </div>
  );
}
