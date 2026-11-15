# Lunar Outpost: Junior Astronaut Mission Trainer

A browser game for ages 7-12. Run a Moon base for 6 days. You get 20 supply units each day to split across **Life support, Radiation shield, Power and Food**. No choice is free.

**Play:** `<paste your GitHub Pages link>`

## The trade-off (what players learn)
- Starve **Power** and Life support runs at half strength and crops stop growing, so power is linked to everything.
- Skip the **Shield** and a real solar storm hurts the crew.
- A **lunar night** (about 14 Earth days of darkness, shortened to one day here) drains power.
- After each day the game explains *why* things went well or badly.

## NASA data
| Source | Used for | Live or static |
|---|---|---|
| [NASA DONKI](https://api.nasa.gov/) (FLR, CME) | The day's solar flare or CME sets radiation risk | Live fetch (last 30 days); falls back to `data/events.js` |
| [NASA OSDR](https://osdr.nasa.gov/bio/repo/) | Science facts on result screens | Static, in `data/facts.js` |

The badge at the top of the game shows whether data is **LIVE** or a **SAMPLE/ARCHIVED** fallback. Damage numbers are a simplified game model, not real dose values.

## Run locally
Open `index.html` in a browser. No build, no accounts.

## Tune the game
All balance numbers are in `CFG` at the top of `game.js`.

## Credits
Data: NASA DONKI and OSDR. Hackathon: NASA challenge, ages 7-12 outpost trade-off game.
