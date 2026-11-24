// Ember Coast 3D renderer (three.js, vendored UMD under game/vendor/). Sunset
// over the sea to the west, a beach, palms along the coast road, a downtown
// grid to the east, the player's Vulcan GT-R, ECPD pursuit cars, the EMBER-1
// helicopter with a visible spotlight cone, and a burning wreck. The camera
// rides third-person behind the car; shot mode locks it to a cinematic angle.

import { DISTRICTS, PALETTE, WORLD } from './config.js';

const THREE = window.THREE;

function box(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.position.set(x, y, z);
  return mesh;
}

function carMesh(color, police) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  if (!police) bodyMat.emissive = new THREE.Color(0x571a00);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 4.6), bodyMat);
  body.position.set(0, 0.55, 0);
  group.add(body);
  const cabin = box(1.8, 0.55, 2.2, police ? 0x0d1622 : 0x14181f, 0, 1.1, -0.2);
  group.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  for (const [wx, wz] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.42, wz);
    group.add(wheel);
  }
  if (police) {
    const bar = box(1.5, 0.18, 0.5, 0xffffff, 0, 1.5, -0.2);
    bar.material = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    group.add(bar);
    const stripe = box(2.24, 0.2, 4.0, 0xffffff, 0, 0.62, 0);
    group.add(stripe);
  } else {
    const spoiler = box(2.0, 0.1, 0.4, 0x1a1a1a, 0, 1.0, -2.2);
    group.add(spoiler);
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.16, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }),
    );
    light.position.set(0, 0.72, 2.32);
    group.add(light);
  }
  return group;
}

function palmTree(random) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, 7, 7),
    new THREE.MeshLambertMaterial({ color: PALETTE.trunk }),
  );
  trunk.position.y = 3.5;
  trunk.rotation.z = random.range(-0.08, 0.08);
  group.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: PALETTE.palm });
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.4, 4), leafMat);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 1.4, 7.2, Math.sin(a) * 1.4);
    leaf.rotation.z = Math.cos(a) * 1.1;
    leaf.rotation.x = -Math.sin(a) * 1.1;
    group.add(leaf);
  }
  return group;
}

export function createRenderer(canvas, random) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(1280, 720, false);

  const scene = new THREE.Scene();
  // Golden-hour sky: warm horizon haze fading to dusk violet above.
  scene.background = new THREE.Color(0x8a3d5c);
  scene.fog = new THREE.Fog(0xc96a3a, 160, 720);

  const camera = new THREE.PerspectiveCamera(62, 1280 / 720, 0.1, 1200);

  // Sun low over the sea, west.
  const sunLight = new THREE.DirectionalLight(0xffb060, 2.1);
  sunLight.position.set(-220, 42, 60);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x9a6a72, 1.35));
  const hemi = new THREE.HemisphereLight(0xffb347, 0x3a2a3a, 0.9);
  scene.add(hemi);
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(20, 24, 16),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false }),
  );
  sun.position.set(-360, 48, -80);
  scene.add(sun);
  // Sky gradient band: three stacked translucent planes high above the city.
  const bandColors = [0xffb347, 0xe85d3d, 0x6b2d5e];
  bandColors.forEach((c, i) => {
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(1400, 90),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, fog: false }),
    );
    band.position.set(0, 60 + i * 55, -560);
    scene.add(band);
  });

  // Ground: sea west, sand beach, asphalt city east.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 1200),
    new THREE.MeshLambertMaterial({ color: PALETTE.sea }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-460, 0.1, 0);
  scene.add(sea);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 1200),
    new THREE.MeshLambertMaterial({ color: PALETTE.sand }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-255, 0.15, 0);
  scene.add(sand);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshLambertMaterial({ color: PALETTE.asphalt }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(90, 0, 0);
  scene.add(ground);

  // Coastal highway (north-south) + cross streets, with centre dashes.
  const highway = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 1200),
    new THREE.MeshLambertMaterial({ color: 0x1e2126 }),
  );
  highway.rotation.x = -Math.PI / 2;
  highway.position.set(WORLD.highwayX, 0.2, 0);
  scene.add(highway);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffc21c });
  for (let z = -580; z < 580; z += 24) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 8), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(WORLD.highwayX, 0.25, z);
    scene.add(dash);
  }
  for (const z of [-260, -80, 100, 280]) {
    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(780, 12),
      new THREE.MeshLambertMaterial({ color: 0x1e2126 }),
    );
    street.rotation.x = -Math.PI / 2;
    street.position.set(210, 0.2, z);
    scene.add(street);
  }

  // Downtown: two rows of towers east of the highway, heights vary by seed.
  const buildingColors = [PALETTE.buildingA, PALETTE.buildingB, PALETTE.buildingC];
  for (let gx = 0; gx < 6; gx += 1) {
    for (let gz = 0; gz < 6; gz += 1) {
      if (gx === 0 && gz % 2 === 0) continue; // keep some streets open
      const w = random.range(18, 30);
      const d = random.range(18, 30);
      const h = random.range(14, 64);
      const b = box(w, h, d, buildingColors[(gx + gz) % 3], -120 + gx * 95, h / 2, -420 + gz * 150);
      scene.add(b);
      // Lit windows: a warm emissive strip near the top.
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.8, 2),
        new THREE.MeshBasicMaterial({ color: 0xffc978 }),
      );
      win.position.set(-120 + gx * 95, h - 4, -420 + gz * 150 + d / 2 + 0.1);
      scene.add(win);
    }
  }

  // Palms along the beach and the coast road.
  for (let i = 0; i < 42; i += 1) {
    const tree = palmTree(random);
    const side = i % 2 === 0 ? -268 : -196;
    tree.position.set(side + random.range(-4, 4), 0, -560 + i * 27 + random.range(-6, 6));
    scene.add(tree);
  }

  // Player car, police cars, helicopter, explosion.
  const playerCar = carMesh(PALETTE.carPlayer, false);
  scene.add(playerCar);
  const policeCars = [];
  for (let i = 0; i < 3; i += 1) {
    const pc = carMesh(PALETTE.carPolice, true);
    scene.add(pc);
    policeCars.push(pc);
  }
  // Traffic: a few civilian cars parked and cruising on the grid.
  const traffic = [];
  const trafficColors = [0x27b6c9, 0xffc21c, 0xe8e8e8, 0x9a4fd0];
  for (let i = 0; i < 8; i += 1) {
    const t = carMesh(trafficColors[i % trafficColors.length], false);
    t.position.set(-120 + (i % 4) * 110, 0, -380 + Math.floor(i / 4) * 420 + i * 30);
    t.rotation.y = random.range(0, Math.PI * 2);
    scene.add(t);
    traffic.push(t);
  }

  // On-foot player: a simple figure so the mode reads on screen.
  const figure = new THREE.Group();
  const torso = box(1.0, 1.3, 0.55, 0xff5a1f, 0, 1.25, 0);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 12, 10),
    new THREE.MeshLambertMaterial({ color: 0xe8b98a }),
  );
  head.position.y = 2.25;
  const legs = box(0.85, 1.0, 0.5, 0x22303f, 0, 0.5, 0);
  figure.add(torso, head, legs);
  scene.add(figure);

  // Helicopter with a visible spotlight cone and a light pool on the road.
  const heli = new THREE.Group();
  const heliBody = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 12, 10),
    new THREE.MeshLambertMaterial({ color: PALETTE.heli }),
  );
  heliBody.scale.set(1.4, 0.8, 1);
  const heliTail = box(0.5, 0.5, 5.5, PALETTE.heli, 0, 0.4, -3.4);
  const rotor = box(9, 0.12, 0.5, 0x111111, 0, 1.6, 0);
  const spot = new THREE.Mesh(
    new THREE.ConeGeometry(7, 44, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff2b0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  spot.position.y = -23;
  spot.rotation.x = Math.PI;
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(7, 20),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -44;
  heli.add(heliBody, heliTail, rotor, spot, pool);
  scene.add(heli);
  const heliLight = new THREE.PointLight(0xfff2b0, 1.2, 90);
  scene.add(heliLight);

  // Explosion: fireball + smoke + point light, scaled by age.
  const explosion = new THREE.Group();
  const fire = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 14, 12),
    new THREE.MeshBasicMaterial({ color: PALETTE.fire, transparent: true, opacity: 0.95 }),
  );
  const fireCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe27a }),
  );
  const smoke = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 10, 8),
    new THREE.MeshLambertMaterial({ color: PALETTE.smoke, transparent: true, opacity: 0.75 }),
  );
  smoke.position.y = 5;
  const fireLight = new THREE.PointLight(0xff7a1a, 2.4, 70);
  fireLight.position.y = 3;
  explosion.add(fire, fireCore, smoke, fireLight);
  scene.add(explosion);

  // Waypoint beacon: a tall golden column of light.
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc21c, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  );
  scene.add(beacon);

  // Resize to the window; the canvas backing store stays 1280x720 for shots.
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let rotorAngle = 0;
  return {
    resize,
    draw(state, mode, shotCamera) {
      const car = state.car;
      const px = state.mode === 'drive' ? car.x : state.player.x;
      const pz = state.mode === 'drive' ? car.z : state.player.z;
      const heading = state.mode === 'drive' ? car.heading : state.player.heading;

      // Player car.
      playerCar.position.set(car.x, 0, car.z);
      playerCar.rotation.y = car.heading;
      playerCar.visible = true;
      figure.visible = state.mode === 'foot';
      if (state.mode === 'foot') {
        figure.position.set(state.player.x, 0, state.player.z);
        figure.rotation.y = state.player.heading;
      }

      // Police cars trail the player in formation.
      state.units.slice(0, 3).forEach((u, i) => {
        const pc = policeCars[i];
        pc.position.set(px + u.ox, 0, pz + u.oz);
        pc.rotation.y = heading + (u.tactic === 'RAMMING' ? 0.15 : 0);
        pc.visible = true;
      });

      // Helicopter circles overhead; the cone always points at the player.
      heli.position.set(state.heli.x, state.heli.height, state.heli.z);
      rotorAngle += 0.5;
      rotor.rotation.y = rotorAngle;
      heliLight.position.set(state.heli.x, state.heli.height - 6, state.heli.z);

      // Explosion at its world spot, pulsing with age.
      if (state.explosions.length > 0) {
        const e = state.explosions[0];
        const scale = e.age < 0.5 ? 0.6 + e.age * 1.6 : 1.4 - (e.age - 0.5) * 0.25;
        explosion.visible = true;
        explosion.position.set(e.x, 1.5, e.z);
        explosion.scale.setScalar(Math.max(0.4, scale));
        fireLight.intensity = Math.max(0.4, 2.4 - e.age * 0.7);
      } else {
        explosion.visible = false;
      }

      beacon.position.set(state.waypoint.x, 30, state.waypoint.z);

      // Camera.
      if (shotCamera) {
        camera.position.set(shotCamera.x, shotCamera.y, shotCamera.z);
        camera.lookAt(shotCamera.tx, shotCamera.ty, shotCamera.tz);
      } else if (state.mode === 'drive') {
        const back = 13;
        const up = 5.2;
        const cx = px - Math.sin(heading) * back;
        const cz = pz - Math.cos(heading) * back;
        camera.position.set(cx, up, cz);
        camera.lookAt(px + Math.sin(heading) * 14, 1.6, pz + Math.cos(heading) * 14);
      } else {
        const back = 8;
        const up = 4;
        const cx = px - Math.sin(heading) * back;
        const cz = pz - Math.cos(heading) * back;
        camera.position.set(cx, up, cz);
        camera.lookAt(px + Math.sin(heading) * 10, 1.4, pz + Math.cos(heading) * 10);
      }

      renderer.render(scene, camera);
    },
  };
}
