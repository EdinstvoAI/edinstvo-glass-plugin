---
name: edinstvo-glass-figma
description: Turn Figma's built-in Glass effect into @edinstvo/glass code, or the other way round. Use when a Figma design has Glass effects and the task is to implement it with Edinstvo Glass, or to match package settings in Figma.
---

# Figma Glass to @edinstvo/glass

Designers use the Glass effect built into Figma. Code uses `<edinstvo-glass>`. Read the effect from the Figma MCP server, for example with `get_design_context` or, if the values are missing, with `use_figma` reading `node.effects`.

In the plugin API a glass effect has `type: "GLASS"` with `lightIntensity`, `refraction`, `dispersion` from 0 to 1, `depth` from 1 and `radius` for frost in pixels. The API is in beta, so check the fields you get. Light angle and splay may be missing there. If so, say so and keep the defaults.

## Table

| Figma | Package | Convert |
|---|---|---|
| Light | `light` | Same fraction |
| Light angle | `light-angle` | Same degrees, check the direction |
| Refraction | `refraction` | Same fraction |
| Depth | `depth` | Same pixels, clamp to 96 |
| Dispersion | `dispersion` | Same fraction |
| Frost (`radius`) | `frost` | Pixels / 16, clamp to 1 |
| Splay | `splay` | Scale to 0..1 |
| Fill colour | `tint` | Fill colour |
| Fill opacity | `transparency` | 1 - opacity |
| Corner radius | `--glass-radius` | Same pixels |

The numbers are starting values, not exact matches. Tell the person to compare on the real backdrop.

Figma has no match for `bloom`, `rim`, `glint`, `lift` or motion settings. Leave them out.

## Output

```html
<edinstvo-glass refraction="0.3" depth="6" frost="0.5" style="--glass-radius: 24px">Hello</edinstvo-glass>
```

Write only attributes that differ from the defaults. Glass needs an image, video or canvas behind it. Import `@edinstvo/glass/define` once. Full settings: https://edinstvoai.github.io/edinstvo-glass-site/docs/
