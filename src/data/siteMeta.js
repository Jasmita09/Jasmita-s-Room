export const SITE = {
  title: "Cherri-Picked Notes 🍒",
  eyebrow: "A notebook by Jasmita Iragam",
  description: "My perspective on data science research, mathematical models, and developing technical craft.",
  bio: "Jasmita Iragam is a Computer Science Honors student at Georgia State University focusing on Data Science, ML, and resilient systems.",
  affiliation: "Georgia State University · Honors College · Atlanta, GA · Copyright © 2026 Jasmita Iragam.",
  contact: {
    email: "jasmita.i1109@gmail.com",
    linkedin: "https://www.linkedin.com/in/jasmita-i-4946a0419/",
    portfolio: "https://jasmita09.github.io/personal-website-v1/"
  },
  projects: ["Project Tara v2", "Cryptanalysis Engine", "Aegis Flow Cooling"],
  newsletter: {
    heading: "Receive updates, data science research, and notes from Jasmita.",
    subtext: "Direct dispatches from my desk at GSU on machine learning models, research papers, and navigating college."
  },
  witchMessage: "Happy Halloween from Jasmita! You brewed something magical today ✨🎃"
};

const has = (d, tag) => (d.category || "").split(" ").includes(tag);
export const FILTERS = [
  { id: "all", label: "All Dispatches", match: () => true },
  { id: "college", label: "College & Growth", match: (d) => has(d, "college") },
  { id: "data-science", label: "Data Science", match: (d) => has(d, "data-science") },
  { id: "essays", label: "Reflections", match: (d) => has(d, "essays") }
];
