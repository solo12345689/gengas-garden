import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const GlobeView = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let scene, camera, renderer, globe, edges, controls;
    const mount = mountRef.current;

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.3;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // --- LIGHTING ---
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // --- BASE GLOBE ---
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001244,
      emissive: 0x000033,
      shininess: 15,
      transparent: true,
      opacity: 0.95,
    });
    globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // --- CONTROLS ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.6;
    controls.enablePan = false;
    controls.minDistance = 1.3;
    controls.maxDistance = 3.5;

    // --- COUNTRY BORDERS ---
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = feature(data, data.objects.countries);
        edges = new THREE.Group();

        countries.features.forEach((country) => {
          let coords = country.geometry.coordinates;
          if (country.geometry.type === "Polygon") coords = [coords];

          coords.forEach((polygonGroup) => {
            polygonGroup.forEach((polygon) => {
              const safePoly = Array.isArray(polygon[0])
                ? polygon
                : polygonGroup;

              const points = safePoly.map(([lon, lat]) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                const x = -Math.sin(phi) * Math.cos(theta);
                const y = Math.cos(phi);
                const z = Math.sin(phi) * Math.sin(theta);
                return new THREE.Vector3(x, y, z);
              });

              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const color = new THREE.Color(
                `hsl(${Math.random() * 360}, 80%, 60%)`
              );
              const material = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity: 0.8,
              });
              const line = new THREE.Line(geometry, material);
              edges.add(line);
            });
          });
        });

        scene.add(edges);
      })
      .catch((err) => console.error("Failed to load world map:", err));

    // --- ANIMATION LOOP ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // --- CLEANUP ---
    return () => {
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100vh",
        background: "radial-gradient(ellipse at center, #060b1a, #000)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "#fff",
          fontFamily: "Poppins, sans-serif",
          fontSize: "1.2rem",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#4ade80",
            boxShadow: "0 0 6px #4ade80",
          }}
        ></span>
        <b>Gengas TV</b>
      </div>
    </div>
  );
};

export default GlobeView;
