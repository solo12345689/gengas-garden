\
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";

export default function App() {
  const globeRef = useRef();
  const [countries, setCountries] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [channels, setChannels] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [pip, setPip] = useState(null);
  const [pipExpanded, setPipExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    fetch("/public/countries.json")
      .then((r) => r.json())
      .then((data) => setCountries(data));
  }, []);

  useEffect(() => {
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topology) => {
        const world = topojson.feature(topology, topology.objects.countries).features;
        setGeoData(world);
      });
  }, []);

  useEffect(() => {
    let raf;
    function rotate() {
      if (globeRef.current && !selectedCountry) {
        setAngle((a) => a + 0.2);
        globeRef.current.pointOfView({ lat: 20, lng: angle, altitude: 2.2 }, 50);
      }
      raf = requestAnimationFrame(rotate);
    }
    raf = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(raf);
  }, [selectedCountry, geoData, angle]);

  useEffect(() => {
    if (!selectedCountry) return;
    const code = selectedCountry.toLowerCase();
    fetch(`/public/channels/${code}.json`)
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then(setChannels)
      .catch(() => setChannels([]));
  }, [selectedCountry]);

  function handlePolygonClick(d) {
    const iso = (d.properties && (d.properties.iso_a2 || d.properties.ISO_A2 || d.properties.iso_a3 || d.id)) || null;
    const code = iso ? String(iso).toLowerCase() : null;
    const found = countries.find(c => c.code === code || c.code === code?.toLowerCase() || c.code === code?.toUpperCase());
    if (found) {
      setSelectedCountry(found.code);
      const centroid = getFeatureCentroid(d);
      if (centroid && globeRef.current) {
        globeRef.current.pointOfView({ lat: centroid[1], lng: centroid[0], altitude: 1.6 }, 1200);
      }
    }
  }

  function getFeatureCentroid(feature) {
    if (!feature) return null;
    if (feature.bbox) {
      const [minX, minY, maxX, maxY] = feature.bbox;
      return [(minX + maxX) / 2, (minY + maxY) / 2];
    }
    try {
      const coords = feature.geometry.coordinates;
      const first = coords && coords[0] && coords[0][0] && coords[0][0][0];
      if (first) return first;
    } catch (e) {}
    return null;
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-64 bg-gray-900 p-3 flex flex-col z-20">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-green-600 px-2 py-1 rounded text-black font-bold">TV</div>
          <div className="text-xl font-bold">Gengas Garden</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {countries.map((c) => (
            <div
              key={c.code}
              className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-800 ${selectedCountry === c.code ? 'bg-gray-800' : ''}`}
              onClick={() => { setSelectedCountry(c.code); }}
            >
              {c.name}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-3">Right-click a channel to open mini player (PIP)</div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {geoData && (
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            polygonsData={geoData}
            polygonCapColor={(d) => (selectedCountry && String(d.id).toLowerCase() === String(selectedCountry).toLowerCase() ? "rgba(0,200,0,0.8)" : "rgba(100,100,100,0.15)")}
            polygonAltitude={(d) => (selectedCountry && String(d.id).toLowerCase() === String(selectedCountry).toLowerCase() ? 0.12 : 0.06)}
            polygonSideColor={() => "rgba(0,100,0,0.15)"}
            polygonStrokeColor={() => "#111"}
            onPolygonClick={handlePolygonClick}
            width={window.innerWidth - 256}
            height={window.innerHeight}
          />
        )}

        {selectedCountry && (
          <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg p-4 max-h-[75vh] w-96 overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">Channels in {countries.find(c=>c.code===selectedCountry)?.name || selectedCountry}</div>
              <button className="text-red-400" onClick={() => { setSelectedCountry(null); setChannels([]); }}>✕</button>
            </div>

            {channels.length === 0 ? (
              <div className="text-gray-400">No channels available for this country.</div>
            ) : (
              channels.map((ch, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer" onClick={() => setPlaying(ch)} onContextMenu={(e)=>{ e.preventDefault(); setPip(ch); setPipExpanded(false); }}>
                  {ch.logo ? <img src={ch.logo} alt="" className="w-8 h-5 object-cover rounded" /> : <div className="w-8 h-5 bg-gray-700 rounded" />}
                  <div className="flex-1">{ch.name}</div>
                  {ch.language && <div className="text-xs text-gray-400">{ch.language}</div>}
                </div>
              ))
            )}
          </div>
        )}

        <div className={`absolute bottom-0 right-0 transition-all ${playing ? 'w-1/3' : 'w-0'} h-64 bg-black border-l border-gray-800`}>
          {playing && (
            <div className="h-full flex flex-col">
              <div className="p-2 bg-gray-900 flex items-center justify-between">
                <div className="font-bold">Now Playing: {playing.name}</div>
                <div className="flex items-center gap-2">
                  <button className="text-yellow-400" onClick={() => { setPip(playing); setPlaying(null); }}>➖</button>
                  <button className="text-red-400" onClick={() => setPlaying(null)}>✕</button>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black p-2">
                <video key={playing.url} src={playing.url} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        {pip && (
          <div className="fixed bottom-5 right-5 z-50">
            {pipExpanded ? (
              <div className="w-72 h-40 bg-black border border-gray-700 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out">
                <div className="flex justify-between items-center bg-gray-900 px-2 py-1 text-sm">
                  <span className="truncate">{pip.name}</span>
                  <div className="flex gap-2">
                    <button className="text-green-400 hover:text-green-600" onClick={() => { setPlaying(pip); setPip(null); }}>⬆</button>
                    <button className="text-yellow-400 hover:text-yellow-500" onClick={() => setPipExpanded(false)}>➖</button>
                    <button className="text-red-400 hover:text-red-600" onClick={() => setPip(null)}>✕</button>
                  </div>
                </div>
                <video ref={(el)=>{ if(el && !el.src) el.src = pip.url; }} src={pip.url} controls autoPlay className="w-full h-full object-contain"
                  onDoubleClick={(e)=>{ const v=e.currentTarget; if(v.requestFullscreen) v.requestFullscreen(); else if(v.webkitRequestFullscreen) v.webkitRequestFullscreen(); }}
                  onTouchStart={(e)=> setTouchStartY(e.touches[0].clientY)}
                  onTouchEnd={(e)=>{ const touchEndY = e.changedTouches[0].clientY; const diffY = touchEndY - touchStartY; if(diffY>80) setPip(null); else if(diffY<-80){ const v=e.currentTarget; if(v.requestFullscreen) v.requestFullscreen(); else if(v.webkitRequestFullscreen) v.webkitRequestFullscreen(); } }}
                />
              </div>
            ) : (
              <div className="w-32 h-20 bg-black border border-gray-700 rounded shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ease-in-out" onClick={()=>setPipExpanded(true)}>
                <video src={pip.url} muted autoPlay loop className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
