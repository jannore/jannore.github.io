const fs = require("fs");
const path = require("path");

const MEDIA_DIR = path.join(process.cwd(), "media");
const OUT_FILE = path.join(process.cwd(), "media_index.json");

const allowed = new Set([".jpg", ".jpeg", ".png", ".gif", ".mp4", ".webm", ".mov"]);

function leadingNumber(name) {
  const m = String(name).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
}

function guessType(ext) {
  ext = ext.toLowerCase();
  if (ext === ".mp4" || ext === ".webm" || ext === ".mov") return "video";
  return "image";
}

function titleFromName(name) {
  return name.replace(/\.[^/.]+$/, "");
}

function main() {
  if (!fs.existsSync(MEDIA_DIR)) {
    console.error("No media/ directory found at:", MEDIA_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name)
    .filter(name => allowed.has(path.extname(name).toLowerCase()));

  if (files.length === 0) {
    console.error("media/ exists but contains no supported files.");
    process.exit(1);
  }

  const items = files.map(name => {
    const ext = path.extname(name);
    return {
      type: guessType(ext),
      src: "media/" + name,
      title: titleFromName(name),
      order: leadingNumber(name)
    };
  }).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  }).map(({ order, ...rest }) => rest);

  fs.writeFileSync(OUT_FILE, JSON.stringify({ version: 1, items }, null, 2) + "\n", "utf8");
  console.log(`Wrote media_index.json with ${items.length} items`);
}

main();
