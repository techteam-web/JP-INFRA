// The full amenities list (from the client's amenities sheet), by category, in their
// order. `photo` is the on-screen name of the matching photo in
// src/assets/Amenities final webp/ (see amenities.js) — clicking the amenity opens it.
// Amenities without a photo yet are commented out ("// no photo yet") so they don't show;
// to add one, put its photo in the folder, uncomment its line and add `photo: '<name>'`.
// (An uncommented amenity without a photo still shows, dimmed and not clickable.)
export const AMENITY_CATEGORIES = [
  {
    id: "health",
    title: "Health",
    items: [
      { label: 'Gymnasium', photo: 'Gymnasium' },
      { label: 'Aqua Gym', photo: 'Aqua Gym' },
      { label: 'Steam & Sauna', photo: 'Steam & Sauna' },
      { label: 'Jogging Track', photo: 'Jogging Track' },
      { label: 'Therapy Room', photo: 'Therapy Room' },
      { label: 'Bhaktivedanta Wellness Centre', photo: 'Wellness Centre' },
      { label: 'Yoga & Meditation Lawn', photo: 'Yoga & Meditation Lawn' },
      // { label: "Reflexology Path" }, // no photo yet
      { label: 'Spinning Studio', photo: 'Spinning Studio' },
      { label: 'Activity Studio', photo: 'Activity Studio' },
      // { label: "Cycling Track" }, // no photo yet
      { label: 'Swimming Pool', photo: 'Swimming Pool' },
      { label: "Women's Indoor Swimming Pool", photo: "Women's Indoor Swimming Pool" },
      { label: "Kids' Pool", photo: "Kids' Pool" },
      // { label: "Wading Pool" }, // no photo yet
      // { label: "Walking Track" }, // no photo yet
    ],
  },
  {
    id: "nature",
    title: "Nature",
    items: [
      // { label: "Open Lawn Area" }, // no photo yet
      { label: 'Terrace Garden', photo: 'Terrace Garden' },
      { label: 'Sculpture Garden', photo: 'Sculpture Garden' },
      { label: 'Butterfly Garden', photo: 'Butterfly Garden' },
      // { label: "Leisure Lawn" }, // no photo yet
      // { label: "Green Lounge" }, // no photo yet
      // { label: "Spice & Herb Garden" }, // no photo yet
      // { label: "Community Garden" }, // no photo yet
      { label: 'Maze Garden', photo: 'Maze Garden' },
      // { label: "Zen Garden" }, // no photo yet
      // { label: "Fruit Orchard" }, // no photo yet
      { label: 'Urban Forest', photo: 'Urban Forest' },
    ],
  },
  {
    id: "sports",
    title: "Sports",
    items: [
      { label: 'Multipurpose Court', photo: 'Multipurpose Court' },
      { label: 'Squash Court', photo: 'Squash Court' },
      { label: 'Golf Simulator', photo: 'Golf Simulator' },
      { label: 'Pickleball Court', photo: 'Pickleball Court' },
      { label: 'Tennis Court', photo: 'Lawn Tennis Court' },
      // { label: 'Indoor Badminton Courts' }, // no photo yet
      { label: 'Padel Tennis Court', photo: 'Padel Tennis Court' },
      // { label: 'Skating Rink' }, // removed on the client's feedback (its photo is hidden in amenities.js)
      { label: 'Cricket Turf', photo: 'Cricket Turf' },
      { label: 'Futsal Court', photo: 'Futsal Court' },
      { label: 'Lawn Tennis Court', photo: 'Lawn Tennis Court' },
    ],
  },
  {
    id: "recreation",
    title: "Recreation",
    items: [
      { label: 'Mini Theatre', photo: 'Mini Theatre' },
      { label: 'Library', photo: 'Library' },
      // { label: "Salon" }, // no photo yet
      { label: 'Banquet Hall', photo: 'Banquet Hall' },
      { label: 'Multipurpose Studio', photo: 'Multipurpose Studio' },
      // { label: "Prefunction Rooms" }, // no photo yet
      { label: 'Jacuzzi', photo: 'Jacuzzi' },
      // { label: "Pool Deck" }, // no photo yet
      { label: 'Amphitheatre', photo: 'Amphitheatre' },
      // { label: "Performance Deck" }, // no photo yet
      // { label: "Amphitheatre Seating" }, // no photo yet
      // { label: "Cabana" }, // no photo yet
      { label: 'Rooftop Lawn', photo: 'Rooftop Lawn' },
      // { label: "Walkway" }, // no photo yet
      // { label: "Gazing Bench" }, // no photo yet
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    items: [
      // { label: "Café" }, // no photo yet
      { label: 'Indoor Games Studio', photo: 'Indoor Games Studio' },
      // { label: "Kids' Play Area" }, // no photo yet
      { label: 'Crèche & Play School', photo: 'Crèche & Play School' },
      { label: 'Co-Working Spaces', photo: 'Co-Working Spaces' },
      { label: 'Meeting Rooms', photo: 'Meeting Room' },
      { label: 'Guest Rooms', photo: 'Guest Room' },
      { label: 'Marvel Lounge', photo: 'Guest Room Lounge' },
      // { label: "Culinary Utilities" }, // no photo yet
      // { label: "Chess" }, // no photo yet
      // { label: "Foosball" }, // no photo yet
      // { label: "Air Hockey" }, // no photo yet
      // { label: "Pool Table" }, // no photo yet
      // { label: "Table Tennis" }, // no photo yet
      // { label: "Carrom" }, // no photo yet
      { label: 'Kamats Restaurant', photo: 'Restaurant' },
      // { label: "Lounge Deck" }, // no photo yet
      { label: 'Shree Vijayvinayak Ganesha Temple', photo: 'Temple' },
      // { label: "EV Charging Station" }, // no photo yet
      { label: "Rooftop Kids' Play Area", photo: "Rooftop Kids' Play Area" },
      // { label: "Senior Citizens' Game Studio" }, // no photo yet
      // { label: "Senior Citizens' Seateria" }, // no photo yet
      { label: "Senior Citizens' Lounge", photo: "Senior Citizens' Lounge" },
      // { label: "Senior Citizens' Library" }, // no photo yet
      // { label: 'Entertainment Suite' }, // no photo yet
      // { label: "Sky Deck" }, // no photo yet
    ],
  },
];
