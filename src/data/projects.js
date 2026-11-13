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

// Map pins (`lngLat`, [longitude, latitude]): the ongoing projects are EXACT, from the
// client's Google Maps links (The Palace, Codename StarLife, JP Parkway, Codename Matunga
// Origins, Icons 71, North Imperial Greens, JP Connect). North West~End and the delivered
// projects are still APPROXIMATE — each in its area — until their links come in, EXCEPT the
// North Garden City residences, whose pins come from the listing sites (houssed.com and
// squareyards.com) and are good to roughly a block. JP Eminence is the one still invented:
// no Mira Road listing for it was found (Square Yards puts a JP Eminence in Andheri West).

export const STATUS = {
  ongoing: { label: "Ongoing", plural: "Ongoing Projects" },
  delivered: { label: "Delivered", plural: "Delivered Projects" },
};

// in the client's order
export const PROJECTS = [
  { id: "jp-connect", name: "JP Connect", area: "Mira Road", status: "ongoing", image: jpConnect, lngLat: [72.885713, 19.282896] },
  { id: "icons-71", name: "Icons 71", area: "Chembur", status: "ongoing", image: icons71, lngLat: [72.906086, 19.049311] },
  { id: "matunga-origins", name: "Codename Matunga Origins", area: "Matunga", status: "ongoing", image: matungaOrigins, lngLat: [72.852761, 19.031491] },
  { id: "the-palace", name: "The Palace", area: "Mira Road", status: "ongoing", image: thePalace, lngLat: [72.8875360, 19.2792636] },
  { id: "starlife", name: "Codename StarLife", area: "Mira Road", status: "ongoing", image: starLife, lngLat: [72.886434, 19.280054] },
  { id: "north-west-end", name: "North West~End", area: "Bhayander", status: "ongoing", image: northWestEnd, lngLat: [72.846, 19.301] },
  { id: "north-imperial-greens", name: "North Imperial Greens", area: "Thane", status: "ongoing", image: imperialGreens, lngLat: [72.959040, 19.270215] },
  { id: "jp-parkway", name: "JP Parkway", area: "Andheri", status: "ongoing", image: parkway, lngLat: [72.858019, 19.137503] },

  { id: "north-barcelona", name: "North Barcelona", area: "Mira Road", status: "delivered", image: northBarcelona, lngLat: [72.886370, 19.284069] },
  { id: "north-alexa", name: "North Alexa", area: "Mira Road", status: "delivered", image: northAlexa, lngLat: [72.886230, 19.282859] },
  { id: "north-aviva", name: "North Aviva", area: "Mira Road", status: "delivered", image: northAviva, lngLat: [72.885171, 19.280928] },
  { id: "north-imperia", name: "North Imperia", area: "Mira Road", status: "delivered", image: northImperia, lngLat: [72.883438, 19.279896] },
  { id: "jp-eminence", name: "JP Eminence", area: "Mira Road", status: "delivered", image: jpEminence, lngLat: [72.88350, 19.28250] },
  { id: "north-euphoria", name: "North Euphoria", area: "Mira Road", status: "delivered", image: euphoria, lngLat: [72.8878655227819,19.28039627166924, ] },
  { id: "north-elara", name: "North Elara", area: "Mira Road", status: "delivered", image: elara, lngLat: [ 72.88790049024803,19.282291120947217,] },
  { id: "north-atria", name: "North Atria", area: "Mira Road", status: "delivered", image: atria, lngLat: [72.886807, 19.28198] },
  { id: "north-estella", name: "North Estella", area: "Mira Road", status: "delivered", image: estella, lngLat: [72.887022, 19.282250] },
  { id: "north-celeste", name: "North Celeste", area: "Mira Road", status: "delivered", image: celeste, lngLat: [72.884407, 19.281661] },
  { id: "jp-decks", name: "JP Decks", area: "Goregaon", status: "delivered", image: jpDecks, lngLat: [72.862, 19.166] },
  { id: "unity-tower", name: "Unity Tower", area: "Worli", status: "delivered", image: unityTower, lngLat: [72.818, 19.011] },
  { id: "chalet-amar", name: "Chalet Amar", area: "Juhu", status: "delivered", image: chaletAmar, lngLat: [72.827, 19.103] },
  { id: "dreamland", name: "Dreamland Apartment", area: "Khar", status: "delivered", image: dreamland, lngLat: [72.836, 19.071] },
];

// What the map pins: every project on its own pin, North Garden City's residences included
// (pins close together gather into a numbered circle that opens up on a click)
export const MAP_PLACES = PROJECTS;
// the map place a project is found at (its own pin)
export const placeOf = (id) => MAP_PLACES.find((x) => x.id === id) ?? null;

// each status's projects, as fixed lists (the same array every time, so a slideshow of one
// doesn't restart when the page re-renders)
const BY_STATUS = Object.fromEntries(Object.keys(STATUS).map((s) => [s, PROJECTS.filter((p) => p.status === s)]));
export const projectsBy = (status) => BY_STATUS[status];
