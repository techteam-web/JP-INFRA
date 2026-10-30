import { byName, imageName } from "./imageName";

// Picks up every photo in src/assets/Amenities final webp/ automatically — the client's
// final amenity renders (src/assets/Amenities final/), converted to WebP (quality 82, full
// 1920 × 1080) and named for display. The JPG originals are kept untouched; only the WebP
// copies are referenced by the app. The on-screen name comes from the filename (see
// imageName.js).
const modules = import.meta.glob("../assets/Amenities final webp/*.webp", {
  eager: true,
  import: "default",
});

export const AMENITIES = Object.keys(modules)
  .map((key) => {
    const file = key.split("/").pop().replace(/\.[^.]+$/, "");
    // `id` keeps the raw filename so two photos of the same room (e.g.
    // "Gymnasium.webp" and "Gymnasium (2).webp") stay unique React keys
    // even though their cleaned-up `name` is identical.
    return { image: modules[key], name: imageName(file), id: file };
  })
  .sort(byName);
