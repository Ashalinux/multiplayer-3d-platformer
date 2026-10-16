# Multiplayer 3D Platformer

**A multiplayer-first 3D platformer for the browser – Three.js graphics, Rapier physics and real-time networking with Socket.IO.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Status](https://img.shields.io/badge/Status-early%20prototype-FFB020?style=for-the-badge)

<br />

## Architecture

The project is an npm workspace:

| Package | Purpose |
|:--|:--|
| `client` | Vite + Three.js + Rapier physics + Socket.IO client |
| `server` | Express + Socket.IO authoritative tick server *(not included yet)* |
| `shared` | Shared TypeScript protocol types *(not included yet)* |

<br />

## Current state

This repository currently contains the **client**:

- Three.js scene with Rapier physics
- Auto-generated guest names
- Socket.IO connection for joining a world room

<br />

## Development

```bash
npm install
npm run dev -w client
```

<br />

## License

Released under the [MIT License](LICENSE).
