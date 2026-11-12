const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Id of the hub node for a gamma or color mode value: gamma-cine1, mode-s-gamut3-cine. */
export const hubIdFromValue = (key: "gamma" | "color_mode", value: string) => `${key === "gamma" ? "gamma" : "mode"}-${slug(value)}`;
