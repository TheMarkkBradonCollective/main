(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches || ("ontouchstart" in window && window.innerWidth < 900);
  const canvas = document.getElementById("skate-canvas");
  const skate2d = document.getElementById("skate-2d");

  window.RinkSkate = {
    setScene() {},
    progress: 0
  };

  if (reduce || !canvas) return;

  const use2d = isMobile || typeof THREE === "undefined";
  if (use2d) {
    document.body.classList.add("use-2d");
    window.RinkSkate.setScene = function (name) {
      skate2d.dataset.scene = name || "";
    };
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(skate2d, {
        x: () => window.innerWidth * 0.72,
        y: () => window.innerHeight * 0.55,
        rotate: 18,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.6 }
      });
    }
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 1.4, 6.2);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.PointLight(0xff2d8a, 2.2, 20);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0x00e5ff, 1.4, 20);
  fill.position.set(-3, 1.5, 3);
  scene.add(fill);

  const skate = new THREE.Group();
  const bootMat = new THREE.MeshStandardMaterial({ color: 0xff2d8a, metalness: 0.35, roughness: 0.35, emissive: 0x3a0020, emissiveIntensity: 0.25 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.4, roughness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.6, roughness: 0.25, emissive: 0x003344, emissiveIntensity: 0.4 });

  const boot = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.55), bootMat);
  boot.position.set(0.05, 0.55, 0);
  skate.add(boot);
  const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.52), bootMat);
  cuff.position.set(-0.38, 0.85, 0);
  skate.add(cuff);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 0.42), chrome);
  plate.position.set(0.05, 0.24, 0);
  skate.add(plate);

  const wheels = [];
  [[-0.42, -0.14], [-0.08, -0.14], [0.26, -0.14], [0.58, -0.14]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 18), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.08, z);
    skate.add(w);
    wheels.push(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10), accent);
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(w.position);
    skate.add(hub);
  });

  skate.position.set(-2.4, -0.4, 0);
  skate.rotation.y = 0.6;
  scene.add(skate);

  const trail = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.18 })
  );
  trail.rotation.x = -Math.PI / 2;
  trail.position.set(-1.2, -0.02, 0);
  skate.add(trail);

  let sceneName = "welcome";
  window.RinkSkate.setScene = function (name) {
    sceneName = name || sceneName;
  };

  let last = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    const p = window.RinkSkate.progress || 0;
    skate.position.x = -2.6 + p * 5.4;
    skate.position.y = Math.sin(p * Math.PI * 2) * 0.18;
    skate.rotation.z = Math.sin(p * 8) * 0.08;
    skate.rotation.x = 0;

    if (sceneName === "welcome") skate.rotation.y = 1.15;
    else if (sceneName === "public") skate.rotation.y = 0.35;
    else if (sceneName === "events") skate.rotation.y = 0;
    else if (sceneName === "party") skate.rotation.y = -0.4;
    else if (sceneName === "groups") skate.rotation.y += dt * 1.8;
    else if (sceneName === "contact") skate.rotation.y = 0.15;

    wheels.forEach((w) => { w.rotation.x -= 0.25 + p * 0.4; });
    key.intensity = sceneName === "party" ? 3.2 : 2.2;
    fill.intensity = sceneName === "events" ? 2.1 : 1.4;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
