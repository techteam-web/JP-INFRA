// The project's site, from the client's coordinates table. After changing it,
// re-fetch the driving routes so they start here: node scripts/fetch-routes.mjs
export const PROJECT = { name: 'Codename Endgame', lngLat: [72.888720, 19.279993] }

// Travel-time bands, as on the client's "Centre of Convenience" chart. Names, bands and
// coordinates are the client's table, as supplied (lngLat is [longitude, latitude]).
export const BANDS = [
  {
    id: '2',
    label: '2 Min',
    places: [
      { name: 'Shree Ganesha Temple (JP North Vinay Nagar)', category: 'Spiritual', lngLat: [72.886149, 19.281889] },
      { name: 'Podar International School (Mira Road)', category: 'Education', lngLat: [ 72.88778556606593,19.28329211047906] },
      { name: 'Euro Kids (Vinay Nagar)', category: 'Education', lngLat: [72.888037, 19.280292] },
      { name: 'Western Express Highway', category: 'Highway', lngLat: [72.88983321835849, 19.277428612169455] },
      { name: 'Bhaktivedanta Wellness Centre', category: 'Hospital', lngLat: [72.888037, 19.280292] },
    ],
  },
  {
    id: '5',
    label: '5 Min',
    places: [
      { name: 'Factory Outlets of Retail Brands', category: 'Shopping', lngLat: [72.881950, 19.270820] },
      { name: "Dara's Dhaba", category: 'Restaurant', lngLat: [72.888984, 19.276775] },
      { name: 'Hotel Western', category: 'Restaurant', lngLat: [72.888085, 19.276216] },
      { name: 'Samartha Hospital', category: 'Hospital', lngLat: [72.874770, 19.281262] },
      { name: 'Royal Hometel Suites', category: 'Restaurant', lngLat: [ 72.87425830388364,19.2629601417641,] },
      { name: 'Vedant Int. High School', category: 'Education', lngLat: [72.878910, 19.281450] },
      { name: 'Ghodbunder Road', category: 'Highway', lngLat: [ 72.90484362328392,19.284826626220195] },
      { name: 'Kashigaon Metro Station', category: 'Metro Station', lngLat: [ 72.88022523920621,19.2778208167561] },
      { name: 'Durga Temple (Kashigaon)', category: 'Spiritual', lngLat: [72.884120, 19.277120] },
      { name: 'Rassaz / N.H. International School (ICSE)', category: 'Education', lngLat: [72.871520, 19.282340] },
      { name: 'The Fern Residency', category: 'Restaurant', lngLat: [ 72.88813148041147 ,19.275464647913033,] },
      { name: 'GCC Hotel & Club', category: 'Restaurant', lngLat: [ 72.87851383495449,19.283342320966813] },
      { name: 'Delhi Darbar Inn', category: 'Restaurant', lngLat: [72.89148550651977,19.27889346150624] },
   
      { name: 'Sai Palace Hotel & Garden Restaurant', category: 'Restaurant', lngLat: [ 72.8897607374267,19.276599070746002] },
      { name: 'Miragaon Metro Station', category: 'Metro Station', lngLat: [72.880420, 19.269850] },
    ],
  },
  {
    id: '10',
    label: '10 Min',
    places: [
      { name: 'Vijay Sales', category: 'Shopping', lngLat: [72.87501773045071,19.281962439076192] },
      { name: 'D-Mart (Mira Road)', category: 'Shopping', lngLat: [ 72.87737508519236,19.269414947073027] },
      { name: "McDonald's (Thakur Mall)", category: 'Restaurant', lngLat: [72.876810, 19.265540] },
      { name: 'Decathlon Sports (Mira Road)', category: 'Shopping', lngLat: [72.876690, 19.265410] },
      { name: "St. Xavier's High School Kashigaon", category: 'Education', lngLat: [ 72.88847748859052,19.268935367592224,] },
      { name: 'Wockhardt Hospital', category: 'Hospital', lngLat: [ 72.86214351687447,19.284582810326363] },
    
    
      { name: 'Ghodbunder Fort', category: 'Fort', lngLat: [72.88820159343713,19.296688693859153, ] },
      { name: 'Thakur Mall', category: 'Shopping', lngLat: [72.876750, 19.265390] },
      { name: 'ISKCON Temple (Mira Road)', category: 'Spiritual', lngLat: [72.877890, 19.270950] },
      { name: 'RBK School', category: 'Education', lngLat: [72.874120, 19.285890] },
      { name: 'Holy Cross Convent School', category: 'Education', lngLat: [72.867450, 19.281920] },
    
      { name: 'Lifecare Hospital', category: 'Hospital', lngLat: [72.869820, 19.280450] },

      { name: 'Singapore Int. School', category: 'Education', lngLat: [72.876150, 19.264120] },
      { name: 'Fountain Hotel', category: 'Restaurant', lngLat: [72.904170, 19.284170] },
      { name: 'N. L. Dalmia College', category: 'Education', lngLat: [72.874210, 19.268450] },
      { name: 'Pandurang Wadi Metro Station', category: 'Metro Station', lngLat: [72.876980, 19.266120] },
      { name: 'PVR Cinemas (Thakur Mall)', category: 'Entertainment', lngLat: [72.876780, 19.265420] },
      { name: 'Starbucks Coffee (Thakur Mall)', category: 'Restaurant', lngLat: [72.876620, 19.265350] },

    ],
  },
  {
    id: '15',
    label: '15 Min',
    places: [
      { name: 'Dahisar Railway Station', category: 'Railway Station', lngLat: [72.859340, 19.250520] },
     
      { name: 'Mira Road Railway Station', category: 'Railway Station', lngLat: [72.856910, 19.281250] },
      { name: 'Oberoi Sky City Mall', category: 'Shopping', lngLat: [72.861420, 19.224850] },
      { name: 'Vardhman Fantasy Amusement Park', category: 'Amusement Park', lngLat: [72.869850, 19.287920] },
      { name: 'Dahisar Mangroves', category: 'Garden', lngLat: [72.845800, 19.261200] },
      { name: 'Galaxy Hospital', category: 'Hospital', lngLat: [ 72.87528533698301,19.296580888187055,] },
      { name: 'Diamond Industrial Estate', category: 'Commercial', lngLat: [ 72.87125580895707,19.25565543000068] },
    
      { name: 'Dahisar East Metro Station', category: 'Metro Station', lngLat: [ 72.86683490995799,19.251759563600405] },
    ],
  },
  {
    id: '20',
    label: '20 Min',
    places: [
      { name: 'Carnival Cinemas Borivali', category: 'Entertainment', lngLat: [72.857410, 19.229850] },
      { name: 'Thakur College', category: 'Education', lngLat: [72.873820, 19.206240] },
      { name: 'Nakoda Hospital', category: 'Hospital', lngLat: [ 72.85045664228488,19.305179323553546] },
     
      { name: 'Maxus Mall', category: 'Shopping', lngLat: [72.845890, 19.295240] },
      { name: 'Borivali Railway Station', category: 'Railway Station', lngLat: [72.857280, 19.229050] },
      { name: 'Movietime Cinema', category: 'Entertainment', lngLat: [72.869120, 19.249810] },
    ],
  },
  {
    id: '30',
    label: '30 Min',
    places: [
      { name: 'Hindu Hrudayasamrat Shri Balasaheb Thackeray Dream Park', category: 'Garden', lngLat: [72.868910, 19.218540] },
      { name: 'The Byke Select', category: 'Restaurant', lngLat: [72.968088, 19.265267] },
      { name: 'Sanjay Gandhi National Park', category: 'Garden', lngLat: [72.864120, 19.228810] },
      { name: 'Metro Wholesale Mall', category: 'Shopping', lngLat: [72.863850, 19.225920] },
      { name: 'Oberoi Mall', category: 'Shopping', lngLat: [72.860650, 19.173820] },
      { name: 'Raghuleela Mall', category: 'Shopping', lngLat: [72.849120, 19.214850] },
      { name: 'G. Corp Tech Park', category: 'Commercial', lngLat: [72.966820, 19.268410] },
      { name: 'Suraj Water Park', category: 'Amusement Park', lngLat: [72.971420, 19.263850] },
      { name: 'Dongri Fort', category: 'Fort', lngLat: [72.796810, 19.305420] },
      { name: 'NESCO', category: 'Commercial', lngLat: [72.853210, 19.150410] },
      { name: 'Goregaon Sports Club', category: 'Sports', lngLat: [72.835920, 19.181240] },
      { name: 'Inorbit Mall', category: 'Shopping', lngLat: [72.835980, 19.176050] },
      { name: 'Hub Mall', category: 'Shopping', lngLat: [72.855910, 19.146280] },
      { name: 'Thakur Ramnarayan College of Law', category: 'Education', lngLat: [72.866950, 19.251240] },
      { name: 'Mindspace Malad', category: 'Commercial', lngLat: [72.833120, 19.179450] },
      { name: 'Infiniti Mall 2', category: 'Shopping', lngLat: [72.834210, 19.184320] },
    ],
  },
]
