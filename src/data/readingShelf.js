// Reading cards for the golden-banded spines on the 3D shelf.
// Starter notes: rewrite these in your own voice.
export const READING_SHELF = [
  {
    id: "warfield",
    title: "Single-Host Analytics & the Changing Physics of Compute",
    author: "Andy Warfield",
    year: "Currently reading",
    kind: "Paper",
    status: "Reading now",
    color: "#c25934", accent: "#f6c88f", ink: "#fdf7f2",
    tags: ["Data Systems", "DuckDB", "AWS", "Storage"],
    notes: [
      "The argument I keep coming back to: the hardware underneath us quietly changed. One modern host has enough cores, memory, and fast storage that many 'big data' jobs no longer need a 1,000-node cluster.",
      "The 'glibc of structured data' framing stuck with me: an embeddable analytical engine every tool can link against, the way every program links a C standard library.",
      "Question to explore: where is the crossover point where distribution is worth its coordination cost again?"
    ],
    linkedDispatch: "duckdb-analytics"
  },
  {
    id: "duckdb",
    title: "DuckDB: an Embeddable Analytical Database",
    author: "Mark Raasveldt & Hannes Mühleisen",
    year: "SIGMOD 2019",
    kind: "Paper",
    status: "Read",
    color: "#2a3550", accent: "#e9dcc3", ink: "#fdf7f2",
    tags: ["OLAP", "Columnar", "In-Process"],
    notes: [
      "In-process like SQLite, but designed for analytics: columnar storage and vectorized execution instead of row-at-a-time processing.",
      "Running inside the host process removes the client/server transfer step, which is often the real bottleneck in notebook-style data science.",
      "Takeaway for my own projects: reach for one fast local engine before reaching for a cluster."
    ]
  },
  {
    id: "attention",
    title: "Attention Is All You Need",
    author: "Vaswani et al.",
    year: "NeurIPS 2017",
    kind: "Paper",
    status: "Re-reading",
    color: "#6b6b3a", accent: "#f3e2c7", ink: "#fdf7f2",
    tags: ["ML", "Transformers", "NLP"],
    notes: [
      "Replaces recurrence with self-attention so every token can attend to every other token, in parallel.",
      "Multi-head attention = several learned 'views' of the same sequence at once.",
      "Positional encodings are the clever patch that gives order back to an order-agnostic mechanism."
    ]
  },
  {
    id: "mapreduce",
    title: "MapReduce: Simplified Data Processing on Large Clusters",
    author: "Jeffrey Dean & Sanjay Ghemawat",
    year: "OSDI 2004",
    kind: "Paper",
    status: "Read",
    color: "#d97d46", accent: "#2c2024", ink: "#2c2024",
    tags: ["Distributed", "History", "Systems"],
    notes: [
      "Two functions, map and reduce, while the framework handles partitioning, scheduling, and machine failures.",
      "Fascinating to read beside the single-host argument: the right design depends on the hardware physics of its era.",
      "Re-executing failed tasks is a beautifully simple resilience strategy."
    ]
  },
  {
    id: "ai2040",
    title: "AI 2040: Plan A",
    author: "Larsen, Dean, Halstead, Lifland, Greenblatt & Kokotajlo",
    year: "ai-2040.com",
    kind: "Scenario / Report",
    status: "Reading now",
    color: "#1f2a3a", accent: "#9fd3c7", ink: "#eaf6f2",
    tags: ["AI Safety", "Policy", "Forecasting"],
    url: "https://ai-2040.com/",
    notes: [
      "From the AI Futures team behind AI 2027. Unlike that piece, this one is a recommendation, not a prediction: what a good path through superintelligence could actually look like.",
      "The core idea: humanity deliberately delays superintelligence until ~2040 via a US–China deal (2029), total transparency into AI R&D, real verification, and slow, multi-company scaling instead of a race.",
      "Timeline beats I want to remember: AI R&D roughly automated around 2030, a pause at top-human-expert level in 2035, and a careful unpause in 2040.",
      "It lays Plan A next to fallback Plans B, C, D and S, which made the trade-offs between coordination and speed much more concrete for me.",
      "Favorite line, quoting Eisenhower: \u201cPlans are worthless, but planning is everything.\u201d"
    ]
  },
];
