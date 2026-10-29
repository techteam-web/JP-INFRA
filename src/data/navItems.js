// trackingName is the value stored for real-time Button Analytics
// (heatmap_events.button_name, via data-button-name) — kept separate from
// label (the visible nav text) so "360 View" can be the analytics name
// without changing the on-screen "360°" caption.
// caption is the longer text shown in the desktop bottom bar only.
export const NAV_ITEMS = [
  { n: "01", label: "360°", caption: "360° View", trackingName: "360 View" },
  { n: "02", label: "About Us", trackingName: "About Us" },
  { n: "03", label: "Gallery", trackingName: "Gallery" },
  { n: "04", label: "Amenities", trackingName: "Amenities" },
  { n: "05", label: "Floor Plans", trackingName: "Floor Plans" },
  { n: "06", label: "Location", trackingName: "Location" },
  { n: "07", label: "Contact", trackingName: "Contact" },
];
