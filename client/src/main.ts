import "./style.css";
import * as THREE from "three";
import { io } from "socket.io-client";
import {
  ClientToServerEvents,
  InputState,
  PlayerSnapshot,
  ServerToClientEvents,
  WelcomePayload,
  WorldStatePayload
} from "@game/shared/protocol";
import { generateName } from "./ui/nameGenerator";

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app root element");
}

const hud = document.createElement("div");
hud.className = "hud";
hud.innerHTML = `
  <h1>3D Platformer Multiplayer</h1>
  <p id="playerName">Name: -</p>
  <p id="onlineCount">Players: 0</p>
  <p id="connState">Status: connecting...</p>
  <p class="help">WASD bewegen, Leertaste springen</p>
  <button id="regenName">Random Name</button>
`;
app.appendChild(hud);

const playerNameEl = document.getElementById("playerName") as HTMLParagraphElement;
const onlineCountEl = document.getElementById("onlineCount") as HTMLParagraphElement;
const connStateEl = document.getElementById("connState") as HTMLParagraphElement;
const regenButton = document.getElementById("regenName") as HTMLButtonElement;

let preferredName = generateName();
playerNameEl.textContent = `Name: ${preferredName}`;

regenButton.onclick = () => {
  preferredName = generateName();
  playerNameEl.textContent = `Name: ${preferredName}`;
  socket.emit(ClientToServerEvents.JOIN_WORLD, { preferredName });
};

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x081224, 30, 90);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xb7d4ff, 0x1b2430, 1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(6, 15, 10);
scene.add(dirLight);

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(60, 2, 60),
  new THREE.MeshStandardMaterial({ color: 0x2a3b55, roughness: 0.9 })
);
floor.position.y = 0;
scene.add(floor);

for (let i = 0; i < 8; i += 1) {
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.6, 4),
    new THREE.MeshStandardMaterial({ color: 0x4d78b7, roughness: 0.7 })
  );
  platform.position.set(-14 + i * 4, 2 + (i % 3) * 1.2, -8 + (i % 2) * 8);
  scene.add(platform);
}

const socket = io("http://localhost:3001", {
  transports: ["websocket"]
});

type RemoteVisual = {
  mesh: THREE.Mesh;
  name: string;
};

const remotes = new Map<string, RemoteVisual>();
let myId = "";

const input: InputState = {
  forward: 0,
  right: 0,
  jump: false
};

const keyState = new Set<string>();

window.addEventListener("keydown", (event) => {
  keyState.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keyState.delete(event.code);
});

function updateInputFromKeyboard(): void {
  input.forward = (keyState.has("KeyW") ? 1 : 0) + (keyState.has("KeyS") ? -1 : 0);
  input.right = (keyState.has("KeyD") ? 1 : 0) + (keyState.has("KeyA") ? -1 : 0);
  input.jump = keyState.has("Space");
}

function getOrCreatePlayerVisual(player: PlayerSnapshot): RemoteVisual {
  const existing = remotes.get(player.id);
  if (existing) {
    return existing;
  }

  const color = player.id === myId ? 0x33f18c : 0xffa94d;
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.1, 8, 16),
    new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.45 })
  );
  scene.add(mesh);

  const visual: RemoteVisual = {
    mesh,
    name: player.name
  };
  remotes.set(player.id, visual);
  return visual;
}

function removeMissingVisuals(ids: Set<string>): void {
  for (const [id, visual] of remotes.entries()) {
    if (!ids.has(id)) {
      scene.remove(visual.mesh);
      visual.mesh.geometry.dispose();
      (visual.mesh.material as THREE.Material).dispose();
      remotes.delete(id);
    }
  }
}

socket.on("connect", () => {
  connStateEl.textContent = "Status: connected";
  socket.emit(ClientToServerEvents.JOIN_WORLD, { preferredName });
});

socket.on("disconnect", () => {
  connStateEl.textContent = "Status: disconnected";
});

socket.on(ServerToClientEvents.WELCOME, (payload: WelcomePayload) => {
  myId = payload.yourId;
  playerNameEl.textContent = `Name: ${payload.yourName}`;
});

socket.on(ServerToClientEvents.WORLD_STATE, (payload: WorldStatePayload) => {
  const ids = new Set<string>();

  for (const player of payload.players) {
    ids.add(player.id);
    const visual = getOrCreatePlayerVisual(player);
    visual.mesh.position.set(player.position.x, player.position.y, player.position.z);
  }

  removeMissingVisuals(ids);
  onlineCountEl.textContent = `Players: ${payload.players.length}`;

  const me = payload.players.find((p) => p.id === myId);
  if (me) {
    camera.position.lerp(new THREE.Vector3(me.position.x, me.position.y + 5, me.position.z + 8), 0.12);
    camera.lookAt(me.position.x, me.position.y + 1, me.position.z);
  }
});

function animate(): void {
  updateInputFromKeyboard();
  socket.emit(ClientToServerEvents.INPUT, input);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
