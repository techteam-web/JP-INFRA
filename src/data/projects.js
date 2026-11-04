// JP Infra's projects, from the client's list, for About Us → Our Projects and Our Legacy.
// Photos are in src/assets/ongoing project/ and src/assets/Deliver project/.
import icons71 from "../assets/ongoing project/Icons 71 - 1080x1080.jpg";
import jpConnect from "../assets/ongoing project/JP Connect - 1080x1080.jpg";
import matungaOrigins from "../assets/ongoing project/Matunga origins - 1080x1080.jpg";
import imperialGreens from "../assets/ongoing project/NIG - 1080x1080.jpg";
import northWestEnd from "../assets/ongoing project/NWE - 1080x1080.jpg";
import parkway from "../assets/ongoing project/Parkway - 1080x1080.jpg";
import starLife from "../assets/ongoing project/StarLife - 1080x1080.jpg";
import thePalace from "../assets/ongoing project/The Palace - 1080x1080.jpg";
import atria from "../assets/Deliver project/Atria - 1080x1080.jpg";
import celeste from "../assets/Deliver project/Celeste - 1080x1080.jpg";
import chaletAmar from "../assets/Deliver project/CHALET AMAR - 1080x1080.jpg";
import dreamland from "../assets/Deliver project/Dream Land - 1080x1080.jpg";
import elara from "../assets/Deliver project/Elara - 1080x1080.jpg";
import estella from "../assets/Deliver project/Estella - 1080x1080.jpg";
import euphoria from "../assets/Deliver project/Euphoria - 1080x1080.jpg";
import jpDecks from "../assets/Deliver project/JP Decks - 1080x1080.jpg";
import jpEminence from "../assets/Deliver project/JP Eminence - 1080x1080.jpg";
import northAlexa from "../assets/Deliver project/North Alexa - 1080x1080.jpg";
import northAviva from "../assets/Deliver project/North Aviva - 1080x1080.jpg";
import northBarcelona from "../assets/Deliver project/North Barcelona - 1080x1080.jpg";
import northImperia from "../assets/Deliver project/North Imperia - 1080x1080.jpg";
import unityTower from "../assets/Deliver project/Unity Tower - 1080x1080.jpg";

// The map pins are APPROXIMATE: each sits in its area (the Mira Road ones spread around
// JP North), not on the exact plot. Replace `lngLat` ([longitude, latitude]) with each
// project's real location when the client supplies it.
export const APPROX_LOCATIONS = true;

export const STATUS = {
  ongoing: { label: "Ongoing", plural: "Ongoing Projects" },
  delivered: { label: "Delivered", plural: "Delivered Projects" },
};

// in the client's order
export const PROJECTS = [
  { id: "jp-connect", name: "JP Connect", area: "Mira Road", status: "ongoing", image: jpConnect, lngLat: [72.8712, 19.2826] },
  { id: "icons-71", name: "Icons 71", area: "Chembur", status: "ongoing", image: icons71, lngLat: [72.8990, 19.062] },
  { id: "matunga-origins", name: "Codename Matunga Origins", area: "Matunga", status: "ongoing", image: matungaOrigins, lngLat: [72.8553, 19.027] },
  { id: "the-palace", name: "The Palace", area: "Mira Road", status: "ongoing", image: thePalace, lngLat: [72.8668, 19.2878] },
  { id: "starlife", name: "Codename StarLife", area: "Mira Road", status: "ongoing", image: starLife, lngLat: [72.8742, 19.2762] },
  { id: "north-west-end", name: "North West~End", area: "Bhayander", status: "ongoing", image: northWestEnd, lngLat: [72.846, 19.301] },
  { id: "north-imperial-greens", name: "North Imperial Greens", area: "Thane", status: "ongoing", image: imperialGreens, lngLat: [72.97, 19.215] },
  { id: "jp-parkway", name: "JP Parkway", area: "Andheri", status: "ongoing", image: parkway, lngLat: [72.853, 19.119] },

  { id: "north-barcelona", name: "North Barcelona", area: "Mira Road", status: "delivered", image: northBarcelona, lngLat: [72.8868, 19.2792] },
  { id: "north-alexa", name: "North Alexa", area: "Mira Road", status: "delivered", image: northAlexa, lngLat: [72.8861, 19.2807] },
  { id: "north-aviva", name: "North Aviva", area: "Mira Road", status: "delivered", image: northAviva, lngLat: [72.8846, 19.2814] },
  { id: "north-imperia", name: "North Imperia", area: "Mira Road", status: "delivered", image: northImperia, lngLat: [72.8830, 19.2810] },
  { id: "jp-eminence", name: "JP Eminence", area: "Mira Road", status: "delivered", image: jpEminence, lngLat: [72.8806, 19.2836] },
  { id: "north-euphoria", name: "North Euphoria", area: "Mira Road", status: "delivered", image: euphoria, lngLat: [72.8822, 19.2796] },
  { id: "north-elara", name: "North Elara", area: "Mira Road", status: "delivered", image: elara, lngLat: [72.8827, 19.2780] },
  { id: "north-atria", name: "North Atria", area: "Mira Road", status: "delivered", image: atria, lngLat: [72.8842, 19.2770] },
  { id: "north-estella", name: "North Estella", area: "Mira Road", status: "delivered", image: estella, lngLat: [72.8858, 19.2773] },
  { id: "north-celeste", name: "North Celeste", area: "Mira Road", status: "delivered", image: celeste, lngLat: [72.8870, 19.2779] },
  { id: "jp-decks", name: "JP Decks", area: "Goregaon", status: "delivered", image: jpDecks, lngLat: [72.862, 19.166] },
  { id: "unity-tower", name: "Unity Tower", area: "Worli", status: "delivered", image: unityTower, lngLat: [72.818, 19.011] },
  { id: "chalet-amar", name: "Chalet Amar", area: "Juhu", status: "delivered", image: chaletAmar, lngLat: [72.827, 19.103] },
  { id: "dreamland", name: "Dreamland Apartment", area: "Khar", status: "delivered", image: dreamland, lngLat: [72.836, 19.071] },
];

// each status's projects, as fixed lists (the same array every time, so a slideshow of one
// doesn't restart when the page re-renders)
const BY_STATUS = Object.fromEntries(Object.keys(STATUS).map((s) => [s, PROJECTS.filter((p) => p.status === s)]));
export const projectsBy = (status) => BY_STATUS[status];
