// Turns an image filename (without extension) into the name shown on screen:
//   "KIDS'-POOL"              → "Kids' Pool"        (all-caps exports: words split on - / _)
//   "Toddlers_ Bay & Play"    → "Toddlers' Bay & Play" ("_" stood in for an apostrophe)
//   "Gymnasium (2)"           → "Gymnasium"         (duplicate-copy suffix dropped)
//   "queens1"                 → "Queens 1"
//   "Futsal  Court"           → "Futsal Court"
export function imageName(file) {
  let name = file.replace(/\s*\(\d+\)\s*$/, "");
  if (/[a-z]/.test(name)) {
    name = name.replace(/_\s/g, "' ").replace(/_/g, " ");
  } else {
    name = name
      .replace(/[-_]+/g, " ")
      .toLowerCase()
      .replace(/(^|\s)(\S)/g, (_, gap, ch) => gap + ch.toUpperCase());
  }
  return name
    .replace(/([a-zA-Z])(\d+)$/, "$1 $2")
    .replace(/^\w/, (ch) => ch.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

// Sorts image entries by their display name, so differently-named exports of
// the same place ("SWIMMING-POOL.jpg", "Swimming Pool.webp") sit together.
export const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || a.id.localeCompare(b.id);
