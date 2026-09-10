// Picks up every photo dropped into src/assets/Aminities-optimized/
// automatically — nothing to maintain by hand when images are added or
// removed. These are web-sized copies (resized to max 2560px wide, webp
// quality 78) of the originals in src/assets/Aminities/, which were
// multi-megapixel exports up to ~17MB each — far too large to load
// quickly. The originals are kept untouched; only this optimized copy is
// referenced by the app.
const modules = import.meta.glob(
  "../assets/Aminities-optimized/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
  { eager: true, import: "default" }
);

export const AMENITIES = Object.keys(modules)
  .sort()
  .map((key) => {
    const file = key.split("/").pop().replace(/\.[^.]+$/, "");
    const name = file
      .replace(/\s*\(\d+\)\s*$/, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // `id` keeps the raw filename so two photos of the same room (e.g.
    // "Gymnasium.webp" and "Gymnasium (2).webp") stay unique React keys
    // even though their cleaned-up `name` is identical.
    return { image: modules[key], name, id: file };
  });
