# Neon Lander VR

A retro-futuristic lunar lander physics game built with [IWSDK](https://iwsdk.dev). Control a spacecraft, manage thrust and fuel, and land on platforms across increasingly challenging terrain — in immersive VR or your browser.

**[Play Now](https://ellyz2426.github.io/neon-lander/)**

## Gameplay

- Control a lander with thrust and rotation to navigate terrain
- Land on designated pads — narrower pads score higher
- Manage fuel carefully — run out and you crash
- Land gently: speed and angle must be within safe limits
- Wind, gravity, and terrain complexity increase with level
- Collect power-ups for fuel, shields, slow-mo, score boosts, magnet pull, and extra lives
- Dodge meteors from level 4+ (or face constant barrages in Meteor Storm mode)
- Time your landing on moving pads at level 8+
- Purchase persistent upgrades to improve your lander's capabilities

## Features

### Gameplay
- **9 Game Modes**: Classic (10 levels), Time Attack, Precision, Endless, Zen, Daily Challenge, Gravity Flip, Meteor Storm
- **3 Difficulty Levels**: Easy, Normal, Hard — affects gravity, fuel, wind, landing tolerances, lives
- **145+ Achievements** across 15 categories with persistent unlock tracking
- **6 Power-up Types**: Fuel, Shield, Slow-Mo, Score Boost, Magnet, Extra Life
- **5 Upgrade Types**: Thrust Power, Fuel Efficiency, Rotation Speed, Hull Armor, Landing Gear — persistent between games
- **Meteor Hazard System**: Falling space rocks with collision detection, shield absorption, and near-miss dodging
- **Moving Landing Pads**: Oscillating pads from level 8+ for extra challenge
- **Procedural Terrain**: Seeded RNG for daily challenges, increasing complexity

### Customization
- **6 Lander Skins**: Neon Blue, Crimson, Emerald, Gold, Phantom, Stealth
- **5 Arena Themes**: Deep Space, Lunar, Mars, Ice Moon, Neon City

### Visuals & Audio
- Procedural audio: thrust engine, crashes, proximity beeps, wind gusts, meteor whoosh, level warp, shield break, power-up collection, achievement fanfares
- Particle effects: thrust trails, crash explosions, meteor debris, shield shimmer, landing dust, level warp, wind ambient, confetti
- Dynamic camera with altitude zoom and crash screen shake
- Star twinkle animation, nebula backgrounds, approach guides, landing beams, terrain glow

### UI
- 12 PanelUI spatial panels — zero HTML DOM overlays
- Achievement pagination with category filter
- Star rating on game over
- Auto-save/resume with 24h expiry
- Guided tutorial, leaderboard, detailed statistics

## Controls

### Browser
| Key | Action |
|-----|--------|
| W / Up / Space | Thrust |
| A / Left Arrow | Rotate Left |
| D / Right Arrow | Rotate Right |
| ESC / P | Pause |

### VR (Quest / WebXR)
| Input | Action |
|-------|--------|
| Right Trigger / Right Stick Up | Thrust |
| Left Thumbstick L/R | Rotate |
| B / Y Button | Pause |
| Laser Pointer | Menu Selection |

## Tech

- Built with [IWSDK](https://iwsdk.dev) 0.4.x (Immersive Web SDK)
- ECS architecture: GameSystem, UISystem, ParticleSystem
- 12 PanelUI panels compiled from `.uikitml` templates
- Dual runtime: full VR + browser-first (`browserControls: true`, `xr: { offer: 'once' }`)
- Procedural audio via Web Audio API
- Custom 2.5D physics with upgrade multipliers
- 20 source files, 5,400+ LOC

## Development

```bash
npm install
npm run dev    # Start dev server
npm run build  # Production build
```

Requires Node.js >= 20.19.0.

## License

MIT
