<img src="logo.png" alt="Edinstvo Glass" width="148">

Edinstvo Glass for Figma is real glass in your designs.

It uses the same lens as [`@edinstvo/glass`](https://github.com/EdinstvoAI/edinstvo-glass): light bends at a curved edge, colours split and the backdrop frosts. There are two ways to use it, a live shader effect and a plugin that bakes glass into a shape.

## Documentation

See the full documentation of the glass and every setting at [edinstvoai.github.io/edinstvo-glass-site/docs](https://edinstvoai.github.io/edinstvo-glass-site/docs/).

## Shader

The shader is a Figma effect, so it stays live. Add it to a frame or an image and the lens bends what the layer shows. Position, size and every material setting are in the effect panel.

## Plugin

The plugin reads what lies under a shape and sets the result as the shape's image fill.

1. Download this repository.
2. In the Figma desktop app open Plugins, Development, Import plugin from manifest and pick `manifest.json`.
3. Put a shape inside a frame, select it and run the plugin.
4. Move the sliders and press Apply.

The result is a picture, so press Apply again when the layers under it change. Settings stay on the shape.

## Build

To rebuild `ui.html` after updating the glass:

```bash
npm install
npm run build
```

## Contributing

Issues and pull requests are welcome at [github.com/EdinstvoAI/edinstvo-glass-plugin](https://github.com/EdinstvoAI/edinstvo-glass-plugin).

## License

MIT
