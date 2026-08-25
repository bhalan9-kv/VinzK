// Visual accents per case category — used for card borders, chips, and highlights.
export const CATEGORY_ACCENTS = {
  "Profitability":        { hue: "#d4af37", label: "Profit tree" },
  "Revenues":             { hue: "#f39c6b", label: "Revenue drivers" },
  "Cost Reduction":       { hue: "#e63946", label: "Cost tree" },
  "Growth":               { hue: "#7cf3c8", label: "Growth arc" },
  "Pricing":              { hue: "#f5c14e", label: "Pricing lenses" },
  "Go-to-market":         { hue: "#ff7f6b", label: "Segments" },
  "Market Entry":         { hue: "#8ab6ff", label: "Attractiveness" },
  "Market entry":         { hue: "#8ab6ff", label: "Attractiveness" },
  "Due diligence":        { hue: "#b48cff", label: "Diligence" },
  "Due Diligence":        { hue: "#b48cff", label: "Diligence" },
  "M&A":                  { hue: "#b48cff", label: "M&A" },
  "Unconventional":       { hue: "#ff8fb1", label: "Ambiguity" },
  "Guesstimate":          { hue: "#7ec8f3", label: "Bottom-up" },
  "Customer Satisfaction":{ hue: "#68c39a", label: "Journey" },
};

export const accentFor = (type) => CATEGORY_ACCENTS[type] || { hue: "#d4af37", label: type || "Case" };
