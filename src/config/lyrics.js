// Maldita — "Porque"
//
// Timings synced from a timestamped (LRC) lyric sheet. Accurate to the song.
// Format consumed by the app: { text, start, end } in seconds.
//
// RAW entries are [text, start] — each line's end is auto-set to the next
// line's start. A 3rd value [text, start, end] forces an explicit end so the
// screen clears to the ♪ rest indicator during an instrumental break.
const RAW = [
  // [Verse 1]
  ["Tulala lang sa 'king kuwarto", 19.56],
  ["At nagmumuni-muni", 24.36],
  ["Ang tanong sa 'king sarili", 29.03],
  ['"Sa\'n ako nagkamali?"', 34.04],

  // [Pre-Chorus]
  ["Bakit sa iyo pa nagkagusto?", 40.65],
  ["Parang bula, ika'y naglaho", 50.22],

  // [Chorus]
  ["Por que contigo yo ya escogi?", 57.97],
  ["Ahora, mi corazon ta sufri", 62.68],
  ["Bien simple lang yo ta pedi", 67.6],
  ["Era senti tu el cosa yo ya senti", 72.45],
  ["Ta pedi milagro, vira'l tiempo", 78.5],
  ["El mali hace derecho", 84.57],
  ["Na de mio rezo ta pedi yo", 88.26],
  ["Era olvida yo contigo", 94.17, 98.26], // instrumental break after

  // [Verse 2]
  ["Ang lahat ay binigay ko", 105.97],
  ["Ngayon ay sising-sisi", 110.73],
  ["Sobra-sobra ang parusa", 115.4],
  ["'Di alam kung kaya pa", 120.33],

  // [Pre-Chorus]
  ["Bakit sa iyo pa nagkagusto?", 126.9],
  ["Parang bula, ika'y naglaho", 136.52],

  // [Chorus]
  ["Por que contigo yo ya escogi?", 144.33],
  ["Ahora, mi corazon ta sufri", 149.14],
  ["Bien simple lang yo ta pedi", 153.94],
  ["Era senti tu el cosa yo ya senti", 158.62],
  ["Ta pedi milagro, vira'l tiempo", 165.16],
  ["El mali hace derecho", 170.88],
  ["Na de mio rezo ta pedi yo", 174.76],
  ["Era olvida yo contigo", 180.39],

  // [Bridge]
  ["'Wag nang lumapit o tumawag pa", 184.57],
  ["At baka masampal lang kita", 188.75],
  ["'Di babalikan ('di babalikan), magsisi ka man", 194.18],
  ["Ako ay lisanin", 198.44],

  // [Chorus]
  ["Por que contigo yo ya escogi?", 205.02],
  ["Ahora, mi corazon ta sufri", 210.72],
  ["Bien simple lang yo ta pedi", 216.38],
  ["Era senti tu el cosa yo ya senti", 222.17],

  // [Outro]
  ["Bakit ikaw pa ang napili?", 233.14],
  ["Ngayon, ang puso ko ay sawi", 239.06],
  ["Kay simple lang ng aking hiling", 244.55],
  ["Na madama mo rin ang pait at pighati", 250.24],
  ["Sana'y magmilagro, mabalik ko", 257.5],
  ["Mali ay maideretso", 264.26],
  ["'Pinagdarasal ko sa 'king puso", 269.01],
  ["Na mabura na sa isip ko", 275.67, 282.14], // ends; outro instrumental
];

// Global timing nudge in seconds. Positive = lyrics appear LATER.
// Tweak this one number to shift the whole song's sync.
const OFFSET = 1;

// Auto-fill each line's end with the next line's start, unless an explicit
// end was provided as the 3rd RAW value. OFFSET is applied to everything.
function buildLyrics(raw) {
  return raw.map(([text, start, end], i) => ({
    text,
    start: start + OFFSET,
    end: (end != null ? end : i < raw.length - 1 ? raw[i + 1][1] : start + 5) + OFFSET,
  }));
}

// The site plays only this slice of the song (true-audio seconds):
//   [02:24.33] second "Por que" chorus  ->  [04:42.14] after the final line.
const SLICE_START = 144.33; // [02:24.33]
const SLICE_END = 282.14; //   [04:42.14]

const sliced = RAW.filter(([, start]) => start >= SLICE_START - 0.01 && start < SLICE_END);
export const lyrics = buildLyrics(sliced);

// Audio seek (start) + stop (end) points — RAW/true-audio seconds, NO display
// OFFSET, so the chorus vocal isn't clipped and we stop right after the song.
export const SONG_START = Math.max(0, SLICE_START - 0.4);
export const SONG_END = SLICE_END;
