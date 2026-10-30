// The project's site, from the client's verified coordinates table. After changing it,
// re-fetch the driving routes so they start here: node scripts/fetch-routes.mjs
export const PROJECT = { name: 'Codename Endgame', lngLat: [72.868, 19.2875] }

// Travel-time bands, as on the client's "Centre of Convenience" chart. lngLat is
// [longitude, latitude] from the client's verified coordinates table; the few places the
// table doesn't cover keep an earlier OpenStreetMap position (marked "OSM") or have none
// (null: listed without a pin — add coordinates to pin them).
export const BANDS = [
  {
    id: '2',
    label: '2 Min',
    places: [
      { name: 'Bhaktivedanta Wellness Centre', lngLat: [72.870533, 19.270015] },
      { name: 'Western Express Highway', lngLat: [72.8691, 19.2634] },
      { name: 'Kamats Legacy', lngLat: null },
      { name: 'Euro Kids', lngLat: [72.886232, 19.28241] },
      { name: 'Podar International School', lngLat: [72.8711, 19.2867] },
      { name: 'Shree Ganesha Temple', lngLat: [72.8689, 19.2792] },
    ],
  },
  {
    id: '5',
    label: '5 Min',
    places: [
      { name: 'Miragaon Metro Station', lngLat: [72.8816, 19.2715] },
      { name: 'Sai Palace Hotel & Gardens Restaurant', lngLat: [72.866, 19.2721] },
      { name: 'A.D. Int. School', lngLat: [72.8682, 19.2798] },
      { name: 'Delhi Darbar Inn', lngLat: [72.818975, 19.184003] },
      { name: 'GCC Hotel & Club', lngLat: [72.8735, 19.2912] },
      { name: 'The Fern Residency', lngLat: [72.892702, 19.276266] },
      { name: 'GCC International School (ICSE)', lngLat: [72.87777, 19.28379] }, // OSM
      { name: 'Durga Temple', lngLat: [72.86227, 19.27332] }, // OSM
      { name: 'Kashigaon Metro Station', lngLat: [72.8808, 19.2773] },
      { name: 'Ghodbunder Road', lngLat: [72.88984, 19.27794] }, // OSM
      { name: 'Vedant Intl. High School', lngLat: [72.8625, 19.2851] },
      { name: 'Royal Hometel Suites', lngLat: [72.8692, 19.2635] },
      { name: 'Samartha Hospital', lngLat: [72.87477, 19.28126] },
      { name: 'Hotel Western', lngLat: [72.8614, 19.2783] },
      { name: 'Dara’s Dhaba', lngLat: [72.8943, 19.2921] },
      { name: 'Factory Outlets of Retail Brands', lngLat: [72.865, 19.282] },
    ],
  },
  {
    id: '10',
    label: '10 Min',
    places: [
      { name: 'Starbucks Coffee', lngLat: [72.87562, 19.26816] },
      { name: 'PVR Cinemas', lngLat: [72.8606, 19.1738] },
      { name: 'Pandurang Wadi Metro Station', lngLat: [72.869, 19.2612] },
      { name: 'N. L. Dalmia College', lngLat: [72.87113, 19.269] }, // OSM
      { name: 'Fountain Hotel', lngLat: [72.8895, 19.281] },
      { name: 'Singapore Int. School', lngLat: [72.8765, 19.2514] },
      { name: 'St. Joseph Church', lngLat: [72.8623, 19.2801] },
      { name: 'Jain Temple', lngLat: [72.8648, 19.2815] },
      { name: 'Lifecare Hospital', lngLat: [72.865718, 19.284228] },
      { name: 'TRC The Boat Club', lngLat: [72.812, 19.225] },
      { name: 'Holy Cross Convent School', lngLat: [72.861, 19.275] },
      { name: 'RBK School', lngLat: [72.8732, 19.2905] },
      { name: 'ISKCON Temple', lngLat: [72.8672, 19.2835] },
      { name: 'Thakur Mall', lngLat: [72.8642, 19.2275] },
      { name: 'Ghodbunder Fort', lngLat: [72.9094, 19.2863] },
      { name: 'Inox', lngLat: [72.855, 19.2289] },
      { name: 'Fountain City Mall', lngLat: [72.8912, 19.2789] },
      { name: 'Wockhardt Hospital', lngLat: [72.8712, 19.2758] },
      { name: "St. Xavier's High School Kashigaon", lngLat: [72.8789, 19.2824] },
      { name: 'Decathlon Sports', lngLat: [72.878156, 19.264385] },
      { name: "McDonald's", lngLat: [72.8665, 19.2891] },
      { name: 'D-Mart', lngLat: [72.87637, 19.2814] }, // OSM
      { name: 'Vijay Sales', lngLat: [72.8632, 19.2745] },
    ],
  },
  {
    id: '15',
    label: '15 Min',
    places: [
      { name: 'Dahisar East Metro Station', lngLat: [72.8622, 19.2505] },
      { name: 'Lotus Multispeciality Hospital', lngLat: [72.844999, 19.241552] },
      { name: 'Diamond Industrial Estate', lngLat: [72.8612, 19.2831] },
      { name: 'Rassaz Multiplex', lngLat: [72.863026, 19.284063] },
      { name: 'Galaxy Hospital', lngLat: [72.8645, 19.2821] },
      { name: 'Dahisar Mangroves', lngLat: [72.8512, 19.2554] },
      { name: 'Vardhman Fantasy Amusement Park', lngLat: [72.866886, 19.289413] },
      { name: 'Oberoi Sky City Mall', lngLat: [72.863985, 19.223424] },
      { name: 'Mira Road Railway Station', lngLat: [72.85857, 19.2814] },
      { name: 'Seven Eleven Hospital', lngLat: null },
      { name: 'Dahisar Railway Station', lngLat: [72.8573, 19.2518] },
    ],
  },
  {
    id: '20',
    label: '20 Min',
    places: [
      { name: 'MovieMax Cinema', lngLat: [72.8694, 19.2828] },
      { name: 'Borivali Railway Station', lngLat: [72.8567, 19.231] },
      { name: 'Maxus Mall', lngLat: [72.8519, 19.2974] },
      { name: 'Pragati Multispeciality Hospital', lngLat: [72.8641, 19.2765] },
      { name: 'Nakoda Hospital', lngLat: [72.8698, 19.281] },
      { name: 'Thakur College', lngLat: [72.874534, 19.206476] },
      { name: 'Carnival Cinemas Borivali', lngLat: [72.8542, 19.2324] },
    ],
  },
  {
    id: '30',
    label: '30 Min',
    places: [
      { name: 'Infiniti Mall 2', lngLat: [72.8383, 19.1856] },
      { name: 'Mindspace', lngLat: [72.8391, 19.1852] },
      { name: 'Thakur Ramnarayan College of Law', lngLat: [72.8645, 19.2221] },
      { name: 'Hub Mall', lngLat: [72.8447, 19.1795] },
      { name: 'Inorbit Mall', lngLat: [72.8378, 19.1834] },
      { name: 'Goregaon Sports Club', lngLat: [72.8431, 19.1824] },
      { name: 'NESCO', lngLat: [72.85491, 19.15224] },
      { name: 'Dongri Fort', lngLat: [72.7842, 19.2481] },
      { name: 'Suraj Water Park', lngLat: [72.9781, 19.2562] },
      { name: 'G. Corp Tech Park', lngLat: [72.851, 19.2312] },
      { name: 'Raghuleela Mall', lngLat: [72.848775, 19.219543] },
      { name: 'Oberoi Mall', lngLat: [72.860521, 19.173711] },
      { name: 'Metro Wholesale Mall', lngLat: [72.866628, 19.225342] },
      { name: 'Sanjay Gandhi National Park', lngLat: [72.912425, 19.221863] },
      { name: 'The Byke Select', lngLat: [72.854588, 19.232496] },
      { name: 'Hindu Hriday Samrat Shri Balasaheb Thackeray Dream Park', lngLat: [72.8598, 19.2642] },
    ],
  },
]
