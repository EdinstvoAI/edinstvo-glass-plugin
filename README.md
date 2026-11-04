<img src="logo.png" alt="Edinstvo Glass" width="148">

Edinstvo Glass for Figma is real glass in your designs.

It is a live shader effect with the same lens as [`@edinstvo/glass`](https://github.com/EdinstvoAI/edinstvo-glass): light bends at a curved edge, colours split and what is behind frosts. Nothing is baked, so the glass follows your layer as it changes.

## Documentation

See the full documentation of the glass and every setting at [glass.makark.ru/docs](https://glass.makark.ru/docs/).

## Use

Add the Edinstvo Glass effect to the frame that holds your design. The effect sees everything inside that frame. Drag the center handle on the canvas to place the lens, then set its size and material in the effect panel. For a second lens with other settings, wrap the frame in another frame and add the effect there.

## Claude

`skills/edinstvo-glass-figma` teaches Claude to turn Figma's built-in Glass effect into `@edinstvo/glass` code. Connect the Figma MCP server and copy the skill:

```bash
cp -r skills/edinstvo-glass-figma ~/.claude/skills/
```

## Source

`main.ts` is the source of the effect, in WGSL and WebGPU.

## Contributing

Issues and pull requests are welcome at [github.com/EdinstvoAI/edinstvo-glass-plugin](https://github.com/EdinstvoAI/edinstvo-glass-plugin).

## License

MIT
