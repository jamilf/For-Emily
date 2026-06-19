// Pure-CSS pixel-art sprite data. Each sprite is an array of equal-width rows;
// every character maps to a color in PAL (space = transparent).

export const PAL = {
  // greens
  G: '#A7C080',
  g: '#6f8c4f',
  k: '#4f6a3a',
  H: '#A7C080',
  h: '#4f6a3a',
  // warm accents
  Y: '#DBBC7F',
  P: '#D699B6',
  R: '#E67E80',
  O: '#E69875',
  A: '#83C092',
  B: '#7FBBB3',
  o: '#DBBC7F', // moon
  // neutrals / wood
  w: '#FDF6E3',
  u: '#EFEBD4',
  m: '#8F5E36',
  d: '#6E4527',
  s: '#5e4327',
  S: '#7a5638',
  p: '#8F5E36',
  // night / soot
  n: '#3A4750',
  N: '#4a5a64',
  b: '#20272b',
  '.': '#7FBBB3', // rain / stars
}

// --- Garden plants (7 wide) --------------------------------------------------
export const PLANTS = [
  // sprout
  ['  G G  ', ' GGGGG ', 'G GGG G', '  GGG  ', '   k   ', '   k   ', '  kkk  '],
  // fern
  ['G     G', ' G   G ', 'G G G G', ' GGGGG ', 'G G G G', ' GGkGG ', '   k   ', '  kkk  '],
  // flower
  ['  PPP  ', ' PPYPP ', '  PPP  ', '   k   ', ' G k   ', '  Gk G ', '   kG  ', '  kkk  '],
  // mushroom
  ['  RRR  ', ' RwRwR ', 'RRRRRRR', 'RwRRRwR', '  www  ', '  www  ', '  www  '],
  // sunflower
  [' Y Y Y ', 'YYYYYYY', 'YYmmmYY', 'YYmmmYY', ' YYYYY ', '   k   ', ' G k G ', '  GkG  ', '  kkk  '],
]

// --- Soot sprite (12 wide) ---------------------------------------------------
export const SOOT_AWAKE = [
  '   b    b   ',
  '  b bb bb b ',
  '   bbbbbb   ',
  '  bbbbbbbb  ',
  ' bbbbbbbbbb ',
  ' bbwwbbwwbb ',
  ' bbwwbbwwbb ',
  ' bbbbbbbbbb ',
  ' bbbbbbbbbb ',
  '  bbbbbbbb  ',
  '   bbbbbb   ',
  '   b  b b   ',
]

export const SOOT_NAP = [
  '   b    b   ',
  '  b bb bb b ',
  '   bbbbbb   ',
  '  bbbbbbbb  ',
  ' bbbbbbbbbb ',
  ' bbbbbbbbbb ',
  ' bbwwbbwwbb ',
  ' bbbbbbbbbb ',
  ' bbbbbbbbbb ',
  '  bbbbbbbb  ',
  '   bbbbbb   ',
  '   b  b b   ',
]

// --- Hero scene: a framed rainy window with moon, hills and a windowsill ------
export const STUDY_ROOM = [
  'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
  'mddddddddddddddddddddddddddddm',
  'mdnn.nnnnnnnnnnnnnnoooonnnnndm',
  'mdnnnnnnnnnnnnnnnnnoooon.nnndm',
  'mdnnnnn.nnnnnnnnnnnoooonnnnndm',
  'mdnnnnnnnnnnnnnnnnnnoonnnnnndm',
  'mdn.nnnnnnnnnnnnnnnnnnn.nnnndm',
  'mdnnnnnnnnn.nnnnnnnnnnnnnnnndm',
  'mdNNNNNNNNNNNNNNNNNNNNNNNNNNdm',
  'mdnnnHHHnnnnnnnnnnnHHHHHnnnndm',
  'mdnHHHHHHHnnnnnnHHHHHHHHnnnndm',
  'mdhhhhhhhhhhhhhhhhhhhhhhhhhhdm',
  'mddddddddddddddddddddddddddddm',
  'mddddGGGGdddddddddddddwddddddm',
  'mddddGkkGdddddddddddduuuuddddm',
  'mddddppppdddddddddddduuuuddddm',
  'mSSSSSSSSSSSSSSSSSSSSSSSSSSSSm',
  'mssssssssssssssssssssssssssssm',
  'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
]
