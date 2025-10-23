import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";

export default function GlobeView() {
  const globeRef = useRef();
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let scene, camera, renderer, globe, atmosphere, frameId;
    const container = globeRef.current;

    // === Scene & Camera ===
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.2;

    // === Renderer ===
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // === Lighting ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(ambientLight, directionalLight);

    // === Globe ===
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x0066ff,
      emissive: 0x0a0a2a,
      shininess: 15,
      transparent: true,
      opacity: 0,
    });
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // === Atmosphere Glow ===
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(0.2, 0.5, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.scale.set(1.05, 1.05, 1.05);
    scene.add(atmosphere);

    // === Fade-in Animation ===
    const fadeIn = () => {
      let opacity = 0;
      const fade = () => {
        opacity += 0.02;
        material.opacity = opacity;
        if (opacity < 1) requestAnimationFrame(fade);
      };
      fade();
    };

    // === Load World Data ===
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = feature(data, data.objects.countries);
        const edges = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.4,
        });

        countries.features.forEach((country) => {
          country.geometry.coordinates.forEach((multiPolygon) => {
            multiPolygon.forEach((polygon) => {
              const points = polygon.map(([lon, lat]) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                const x = -Math.sin(phi) * Math.cos(theta);
                const y = Math.cos(phi);
                const z = Math.sin(phi) * Math.sin(theta);
                return new THREE.Vector3(x, y, z);
              });
              const geo = new THREE.BufferGeometry().setFromPoints(points);
              const line = new THREE.Line(geo, lineMaterial);
              edges.add(line);
            });
          });
        });

        scene.add(edges);
        fadeIn();
      })
      .catch((err) => console.error("Failed to load world map:", err));

    // === Animation Loop ===
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      globe.rotation.y += 0.0015;
      atmosphere.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // === Resize ===
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // === Cleanup ===
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Format clock
  const formattedTime = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return (
    <div
      ref={globeRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at 50% 50%, #000022, #000010)",
        overflow: "hidden",
      }}
    >
      {/* Floating Clock Overlay */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          right: "40px",
          color: "#99ccff",
          fontSize: "1.2rem",
          fontFamily: "Orbitron, monospace",
          textShadow: "0 0 8px #00aaff, 0 0 16px #0044ff",
          userSelect: "none",
          textAlign: "right",
          animation: "fadeIn 1.5s ease-in",
        }}
      >
        <div>{formattedDate}</div>
        <div style={{ fontSize: "1.8rem", marginTop: "4px" }}>{formattedTime}</div>
      </div>
    </div>
  );
}
