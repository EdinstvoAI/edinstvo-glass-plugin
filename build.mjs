import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = "node_modules/@edinstvo/glass/dist";
const seen = new Set();
const modules = [];

function add(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const names = [];
  const source = readFileSync(join(root, file), "utf8")
    .replace(/^\/\/# sourceMappingURL.*$/m, "")
    .replace(/^import \{(.+?)\} from "\.\/(.+?)";$/gm, (_, list, path) => {
      add(join(dirname(file), path));
      return `const {${list}} = modules["${path}"];`;
    })
    .replace(/^export (?:async )?(const|function|class) (\w+)/gm, (line, kind, name) => {
      names.push(name);
      return line.slice(7);
    });
  modules.push(`modules["${file}"] = (() => {\n${source}\nreturn { ${names.join(", ")} };\n})();`);
}

add("element.js");
add("material.js");

const bundle = `const modules = {};\n${modules.join("\n")}\nconst glass = { ...modules["element.js"], ...modules["material.js"] };`;
writeFileSync("ui.html", readFileSync("ui.template.html", "utf8").replace("/*GLASS*/", () => bundle.replaceAll("</script", "<\\/script")));
