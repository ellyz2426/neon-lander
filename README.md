# Neon Lander VR

A retro-futuristic lunar lander physics game built with [IWSDK](https://iwsdk.dev). Control a spacecraft, manage thrust and fuel, and land on platforms across increasingly challenging terrain — in immersive VR or your browser.

**[Play Now](https://ellyz2426.github.io/neon-lander/)**

## Gameplay

- Control a lander with thrust and rotation to navigate terrain
- Land on designated pads — narrower pads score higher
- Manage fuel carefully — run out and you crash
- Land gently: speed and angle must be within safe limits
- Wind, gravity, and terrain complexity increase with level

## Features

- **6 Game Modes**: Classic (10 levels), Time Attack, Precision, Endless, Zen (unlimited fuel), Daily Challenge
- **3 Difficulty Levels**: Easy, Normal, Hard — affects gravity, fuel, wind, landing tolerances
- **55 Achievements** with persistent unlock tracking across 8 categories
- **5 Lander Skins**: Neon Blue, Crimson, Emerald, Gold, Phantom
- **5 Arena Themes**: Deep Space, Lunar, Mars, Ice Moon, Neon City
- **Procedural Terrain**: Every level generates unique terrain with seeded RNG for daily challenges
- **Physics Simulation**: Gravity, thrust vectors, angular momentum, wind forces
- **Fuel Management**: Thrust burns fuel; fuel economy affects score
- **Landing Scoring**: Base score x pad multiplier + fuel bonus + precision bonus + speed bonus
- **Particle Effects**: Thrust flames, crash explosions with value-colored particles
- **Procedural Audio**: Thrust rumble, landing chime, crash explosion, wind gusts, achievement fanfare
- **Statistics Tracking**: Games played, landings, crashes, perfect streaks, best score, fastest landing
- **Local Leaderboard**: Top 20 scores with date, mode, and difficulty

## Controls

### VR (Quest / WebXR)
| Input | Action |
|-------|--------|
| Right Trigger | Thrust |
| Left Thumbstick | Rotate Left/Right |
| Right Thumbstick Down | Thrust (alt) |
| B / Y Button | Pause |
| Laser Pointer | Select menu items |

### Browser
| Input | Action |
|-------|--------|
| W / Up Arrow | Thrust |
| A / Left Arrow | Rotate Left |
| D / Right Arrow | Rotate Right |
| ESC / P | Pause |

## Tech

- Built with [IWSDK](https://iwsdk.dev) 0.4.x (Immersive Web SDK)
- 11 PanelUI spatial panels — zero HTML DOM UI
- ECS architecture with GameSystem, UISystem, ParticleSystem
- Dual runtime: full VR + browser-first
- Procedural audio via Web Audio API
- Custom 2.5D physics engine

## Development

```bash
npm install
npx iwsdk dev
```

## License

MIT
