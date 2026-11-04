import { defineProperties } from "figma:shaders"

export default function Effect() {}

export function setup(device, frame) {
  var vertex = `
struct VsIn { @location(0) pos: vec2f, @location(1) uv: vec2f };
struct VsOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@vertex fn vs_main(v: VsIn) -> VsOut {
  var o: VsOut;
  o.position = vec4f(v.pos, 0.0, 1.0);
  o.uv = v.uv;
  return o;
}
`
  var blur = `diagnostic(off,derivative_uniformity);
struct Blur { step: vec4f };
@group(0) @binding(0) var<uniform> u: Blur;
@group(0) @binding(1) var smp: sampler;
@group(0) @binding(2) var src: texture_2d<f32>;
` + vertex + `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var sum = vec4f(0.0);
  var total = 0.0;
  for (var i = -16; i <= 16; i = i + 1) {
    let x = f32(i) / 16.0 * 3.0;
    let w = exp(-0.5 * x * x);
    sum = sum + textureSampleLevel(src, smp, uv + u.step.xy * x, 0.0) * w;
    total = total + w;
  }
  return sum / total;
}
`
  var lens = `diagnostic(off,derivative_uniformity);
struct Lens { a: vec4f, b: vec4f, c: vec4f, d: vec4f, f: vec4f };
@group(0) @binding(0) var<uniform> u: Lens;
@group(0) @binding(1) var smp: sampler;
@group(0) @binding(2) var src: texture_2d<f32>;
@group(0) @binding(3) var frosted: texture_2d<f32>;
@group(0) @binding(4) var haze: texture_2d<f32>;
` + vertex + `
fn rbox(p: vec2f, b: vec2f, r: f32) -> f32 {
  let q = abs(p) - b + r;
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}
fn soft(a: f32, b: f32) -> f32 {
  let lo = min(a, b);
  return lo * pow(1.0 + pow(lo / max(a, b), 2.7), -1.0 / 2.7);
}
fn field(p: vec2f) -> vec2f {
  let c = p - u.a.xy;
  let b = u.a.zw;
  let r = u.b.x;
  let own = rbox(c, b, r);
  var inset = -100000.0;
  if (own < 0.0) {
    let edges = max(b - abs(c), vec2f(0.0)) + r + 0.001;
    inset = mix(soft(edges.x, edges.y) - r, -own, r / min(b.x, b.y));
  }
  return vec2f(own, max(inset, -own));
}
fn pick(px: vec2f) -> vec4f {
  return textureSampleLevel(frosted, smp, px / u.f.xy, 0.0);
}
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let base = textureSampleLevel(src, smp, uv, 0.0);
  let halo = textureSampleLevel(haze, smp, uv, 0.0);
  let px = uv * u.f.xy;
  let f = field(px);
  let d = f.x;
  let peak = max(field(u.a.xy).y, 1.0);
  let band = min(mix(max(u.b.y, 1.0), peak, u.d.w * u.d.w), peak);
  let s = 1.0 - clamp(f.y / band, 0.0, 1.0);
  let height = sqrt(max(1.0 - s * s, 0.0));
  let ex = vec2f(1.0, 0.0);
  let ey = vec2f(0.0, 1.0);
  let slope = vec2f(field(px - ex).y - field(px + ex).y, field(px - ey).y - field(px + ey).y);
  let g = slope / max(length(slope), 0.0001);
  let n = normalize(vec3f(g * s * s / sqrt(1.02 - s * s), 1.0));
  let ray = refract(vec3f(0.0, 0.0, -1.0), n, 1.0 / 1.5);
  let shift = ray.xy / max(-ray.z, 0.5) * band * (0.35 + height) * u.b.z * 1.2;
  let at = px + shift;
  let k = 0.04 + u.b.w * 0.3;
  let mid = pick(at);
  let alpha = mid.a;
  var col = vec3f(pick(at - shift * k).r, mid.g, pick(at + shift * k).b);
  col = mix(vec3f(dot(col, vec3f(0.2126, 0.7152, 0.0722))), col, 1.08);
  let lift = u.d.z;
  col = col * (1.0 + lift) + lift * 0.12 * alpha;
  col = col + halo.rgb * u.c.x * 0.22 * s;
  let light = u.d.xy;
  let facing = dot(n.xy, light);
  let centered = (px - u.f.xy * 0.5) / (u.f.xy * 0.5);
  col = col + u.c.y * (max(facing, 0.0) * 0.3 + dot(centered, light) * 0.03) * alpha;
  col = col * (1.0 - u.c.y * max(-facing, 0.0) * 0.2);
  let toward = dot(g, light);
  col = col + u.c.w * pow(s, 5.0) * (pow(max(toward, 0.0), 6.0) + pow(max(-toward, 0.0), 6.0) * 0.4) * alpha;
  let line = smoothstep(-1.6, -0.6, d);
  col = col + u.c.z * line * (0.18 + 0.82 * toward * toward) * alpha;
  let mask = 1.0 - smoothstep(-0.75, 0.75, d);
  let spill = exp(-max(d, 0.0) / 10.0) * u.c.x * 0.4 * u.c.y * (1.0 - mask);
  let outside = mix(base, mix(halo, vec4f(halo.a), 0.6), spill);
  return mix(outside, vec4f(clamp(col, vec3f(0.0), vec3f(alpha)), alpha), mask);
}
`
  frame.state.blur = device.createShaderModule({ code: blur })
  frame.state.lens = device.createShaderModule({ code: lens })
  frame.state.format = null
  frame.state.quad = device.createBuffer({ size: 96, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true })
  new Float32Array(frame.state.quad.getMappedRange()).set([
    -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0,
    -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0,
  ])
  frame.state.quad.unmap()
  frame.state.uniforms = device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  frame.state.steps = [0, 1, 2, 3].map(function () {
    return device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  })
  frame.state.sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })
  frame.state.placeholder = device.createTexture({
    size: [1, 1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  })
  device.queue.writeTexture(
    { texture: frame.state.placeholder },
    new Uint8Array([0, 0, 0, 0]),
    { bytesPerRow: 4 },
    { width: 1, height: 1, depthOrArrayLayers: 1 },
  )
}

export function render(device, frame) {
  var state = frame.state
  var params = frame.params || {}
  var num = function (key, fallback) {
    var value = Number(params[key])
    return Number.isFinite(value) ? value : fallback
  }
  var width = frame.output.width
  var height = frame.output.height
  var format = frame.output.format

  if (state.format !== format) {
    var pipeline = function (module) {
      return device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: module,
          entryPoint: 'vs_main',
          buffers: [{
            arrayStride: 16,
            attributes: [
              { shaderLocation: 0, format: 'float32x2', offset: 0 },
              { shaderLocation: 1, format: 'float32x2', offset: 8 },
            ],
          }],
        },
        fragment: { module: module, entryPoint: 'fs_main', targets: [{ format: format }] },
        primitive: { topology: 'triangle-list' },
      })
    }
    state.blurPipeline = pipeline(state.blur)
    state.lensPipeline = pipeline(state.lens)
    state.format = format
    state.sizeKey = null
  }

  var sizeKey = width + 'x' + height
  if (state.sizeKey !== sizeKey) {
    if (state.textures) state.textures.forEach(function (texture) { texture.destroy() })
    state.textures = [0, 1, 2, 3].map(function () {
      return device.createTexture({
        size: [width, height, 1],
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      })
    })
    state.sizeKey = sizeKey
  }

  var center = params.center || {}
  var cx = Number.isFinite(Number(center.x)) ? Number(center.x) : 50
  var cy = Number.isFinite(Number(center.y)) ? Number(center.y) : 50
  var halfW = Math.max(num('width', 40) / 200 * width, 1)
  var halfH = Math.max(num('height', 25) / 200 * height, 1)
  var radius = num('radius', 100) / 100 * Math.min(halfW, halfH)
  var angle = num('lightAngle', -45) * Math.PI / 180
  device.queue.writeBuffer(state.uniforms, 0, new Float32Array([
    cx / 100 * width, cy / 100 * height, halfW, halfH,
    radius, num('depth', 6), num('refraction', 0.3), num('dispersion', 0.2),
    num('bloom', 0.2), num('light', 0.3), num('rim', 0.35), num('glint', 0),
    Math.cos(angle), Math.sin(angle), num('lift', 0.15), num('splay', 0),
    width, height, 0, 0,
  ]))
  var sigma = num('frost', 0.7) * 8
  var wide = 28
  device.queue.writeBuffer(state.steps[0], 0, new Float32Array([sigma / width, 0, 0, 0]))
  device.queue.writeBuffer(state.steps[1], 0, new Float32Array([0, sigma / height, 0, 0]))
  device.queue.writeBuffer(state.steps[2], 0, new Float32Array([wide / width, 0, 0, 0]))
  device.queue.writeBuffer(state.steps[3], 0, new Float32Array([0, wide / height, 0, 0]))

  var input = frame.input != null ? frame.input.createView() : state.placeholder.createView()
  var views = state.textures.map(function (texture) { return texture.createView() })
  var encoder = device.createCommandEncoder()
  var draw = function (pipeline, target, entries) {
    var group = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: entries })
    var pass = encoder.beginRenderPass({
      colorAttachments: [{ view: target, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' }],
    })
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, group)
    pass.setVertexBuffer(0, state.quad)
    pass.draw(6)
    pass.end()
  }
  var blurInto = function (target, step, from) {
    draw(state.blurPipeline, target, [
      { binding: 0, resource: { buffer: state.steps[step] } },
      { binding: 1, resource: state.sampler },
      { binding: 2, resource: from },
    ])
  }
  blurInto(views[0], 0, input)
  blurInto(views[1], 1, views[0])
  blurInto(views[2], 2, input)
  blurInto(views[3], 3, views[2])
  draw(state.lensPipeline, frame.output.createView(), [
    { binding: 0, resource: { buffer: state.uniforms } },
    { binding: 1, resource: state.sampler },
    { binding: 2, resource: input },
    { binding: 3, resource: views[1] },
    { binding: 4, resource: views[3] },
  ])
  device.queue.submit([encoder.finish()])
}

defineProperties(Effect, {
  center: { type: 'point', label: 'Center', mode: 'canvas_and_ui', unit: '%', defaultValue: { x: 50, y: 50 } },
  width: { type: 'number', label: 'Width', defaultValue: 40, control: 'slider', min: 1, max: 100, step: 0.5 },
  height: { type: 'number', label: 'Height', defaultValue: 25, control: 'slider', min: 1, max: 100, step: 0.5 },
  radius: { type: 'number', label: 'Radius', defaultValue: 100, control: 'slider', min: 0, max: 100, step: 1 },
  refraction: { type: 'number', label: 'Refraction', defaultValue: 0.3, control: 'slider', min: 0, max: 1, step: 0.01 },
  depth: { type: 'number', label: 'Depth', defaultValue: 6, control: 'slider', min: 0, max: 96, step: 1 },
  dispersion: { type: 'number', label: 'Dispersion', defaultValue: 0.2, control: 'slider', min: 0, max: 1, step: 0.01 },
  frost: { type: 'number', label: 'Frost', defaultValue: 0.7, control: 'slider', min: 0, max: 1, step: 0.01 },
  splay: { type: 'number', label: 'Splay', defaultValue: 0, control: 'slider', min: 0, max: 1, step: 0.01 },
  light: { type: 'number', label: 'Light', defaultValue: 0.3, control: 'slider', min: 0, max: 1, step: 0.01 },
  lightAngle: { type: 'number', label: 'Light angle', defaultValue: -45, control: 'slider', min: -180, max: 180, step: 1 },
  bloom: { type: 'number', label: 'Bloom', defaultValue: 0.2, control: 'slider', min: 0, max: 1, step: 0.01 },
  rim: { type: 'number', label: 'Rim', defaultValue: 0.35, control: 'slider', min: 0, max: 1, step: 0.01 },
  glint: { type: 'number', label: 'Glint', defaultValue: 0, control: 'slider', min: 0, max: 1, step: 0.01 },
  lift: { type: 'number', label: 'Lift', defaultValue: 0.15, control: 'slider', min: 0, max: 1, step: 0.01 },
})
