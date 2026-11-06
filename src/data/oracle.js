// Data Science Oracle — one card per day (same card all day, new card tomorrow).
export const ORACLE = [
  { name: "The Overfitted Tree", glyph: "\u{1F333}", text: "Beware of memorizing the past; leave room for general truths." },
  { name: "The Stochastic Gradient", glyph: "\u{1F3B2}", text: "Progress isn\u2019t always linear; embrace the noisy steps." },
  { name: "The Vanishing Gradient", glyph: "\u{1F32B}\uFE0F", text: "Remember where you started when deep in the layers." },
  { name: "The Learning Rate", glyph: "\u{1F3C3}\u200D\u2640\uFE0F", text: "Too fast and you overshoot; too slow and you never arrive. Find your pace." },
  { name: "The Null Hypothesis", glyph: "\u2696\uFE0F", text: "Not every pattern is a sign. Let the evidence speak first." },
  { name: "The Random Seed", glyph: "\u{1F331}", text: "Fix what you can control, and let the rest be beautifully random." },
  { name: "The Validation Set", glyph: "\u{1FA9E}", text: "Test yourself on what you haven\u2019t seen yet; that is where growth hides." },
  { name: "The Attention Head", glyph: "\u{1F441}\uFE0F", text: "Focus is a choice. Attend to what truly matters today." },
  { name: "The Outlier", glyph: "\u2B50", text: "Being different is not an error; sometimes it is the whole story." },
  { name: "The Regularizer", glyph: "\u{1F9D8}", text: "A little restraint keeps you flexible for whatever comes next." },
  { name: "The Ensemble", glyph: "\u{1F91D}", text: "Many small voices together become wise. Ask your friends." },
  { name: "The Bias\u2013Variance Trade-off", glyph: "\u{1F319}", text: "Balance: neither too rigid nor too restless." }
];
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
export function cardOfDay(d = new Date()) {
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let h = key; h = ((h >>> 16) ^ h) * 0x45d9f3b; h = ((h >>> 16) ^ h) * 0x45d9f3b; h = (h >>> 16) ^ h;
  const i = Math.abs(h) % ORACLE.length;
  return { ...ORACLE[i], num: ROMAN[i] };
}
