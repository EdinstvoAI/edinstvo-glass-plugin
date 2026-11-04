figma.showUI(__html__, { width: 300, height: 600, themeColors: true });

const radiusOf = (node) => {
  if (node.type === "ELLIPSE") return Math.min(node.width, node.height) / 2;
  return typeof node.cornerRadius === "number" ? node.cornerRadius : node.topLeftRadius || 0;
};

function covering(node, root) {
  const list = [node];
  for (let current = node; current !== root; current = current.parent) {
    const siblings = current.parent.children;
    list.push(...siblings.slice(siblings.indexOf(current) + 1));
  }
  return list.filter((item) => item.visible);
}

async function load() {
  const [node, extra] = figma.currentPage.selection;
  if (!node || extra || !("fills" in node)) return figma.ui.postMessage({ type: "empty", text: "Select one shape." });
  let root = node;
  while (root.parent.type !== "PAGE") root = root.parent;
  if (root === node) return figma.ui.postMessage({ type: "empty", text: "Put the shape inside a frame." });

  const hidden = covering(node, root);
  hidden.forEach((item) => (item.visible = false));
  try {
    const bounds = root.absoluteRenderBounds;
    const box = node.absoluteBoundingBox;
    const scale = Math.min(2, 4096 / Math.max(bounds.width, bounds.height));
    const bytes = await root.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: scale } });
    figma.ui.postMessage({
      type: "load",
      id: node.id,
      bytes,
      frame: { width: bounds.width, height: bounds.height },
      shape: { x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height, radius: radiusOf(node) },
      settings: JSON.parse(node.getPluginData("glass") || "{}"),
    });
  } finally {
    hidden.forEach((item) => (item.visible = true));
  }
}

figma.ui.onmessage = async ({ type, id, bytes, settings }) => {
  if (type === "ready") return load();
  if (type !== "apply") return;
  const node = await figma.getNodeByIdAsync(id);
  if (!node) return figma.notify("The shape is gone.");
  node.fills = [{ type: "IMAGE", imageHash: figma.createImage(bytes).hash, scaleMode: "FILL" }];
  node.setPluginData("glass", JSON.stringify(settings));
  figma.notify("Glass applied.");
};

figma.on("selectionchange", load);
