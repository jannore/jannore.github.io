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
  return name.replace(/\.[^/.]+$/, ""); // remove extension
}

function main() {
  if (!fs.existsSync(MEDIA_DIR)) {
    console.error("No media/ directory found.");
    process.exit(1);
  }

  const files = fs.readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name)
    .filter(name => allowed.has(path.extname(name).toLowerCase()));

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
  }).map(({ order, ...rest }) => rest); // drop order in output

  const out = { version: 1, items };

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT_FILE} with ${items.length} items`);
}

main();
