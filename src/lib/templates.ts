export type ProfileTemplate = {
  id: string;
  name: string;
  description: string;
  preview: { bg: string; accent: string };
  values: {
    accent_color: string;
    background_color: string;
    text_color: string;
    icon_color: string;
    font: string;
    monochrome_icons: boolean;
    swap_box_colors: boolean;
    layout_style: string;
    no_glow: boolean;
  };
};

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    id: "classic",
    name: "classic",
    description: "clean dark theme with a violet accent — the pews default.",
    preview: { bg: "#0a0a0f", accent: "#8b5cf6" },
    values: { accent_color: "#8b5cf6", background_color: "#0a0a0f", text_color: "#ffffff", icon_color: "#ffffff", font: "Space Grotesk", monochrome_icons: false, swap_box_colors: false, layout_style: "default", no_glow: false },
  },
  {
    id: "neon",
    name: "neon",
    description: "bright cyan glow on near-black, monochrome icons.",
    preview: { bg: "#05080a", accent: "#22d3ee" },
    values: { accent_color: "#22d3ee", background_color: "#05080a", text_color: "#e6feff", icon_color: "#22d3ee", font: "JetBrains Mono", monochrome_icons: true, swap_box_colors: false, layout_style: "default", no_glow: false },
  },
  {
    id: "minimal",
    name: "minimal",
    description: "soft grey, no glow, boxed card layout — quiet and professional.",
    preview: { bg: "#18181b", accent: "#a1a1aa" },
    values: { accent_color: "#a1a1aa", background_color: "#18181b", text_color: "#f4f4f5", icon_color: "#a1a1aa", font: "Inter", monochrome_icons: true, swap_box_colors: false, layout_style: "card", no_glow: true },
  },
  {
    id: "sunset",
    name: "sunset",
    description: "warm orange/pink accent, banner layout.",
    preview: { bg: "#1a0f0a", accent: "#fb923c" },
    values: { accent_color: "#fb923c", background_color: "#1a0f0a", text_color: "#fff7ed", icon_color: "#fb923c", font: "Poppins", monochrome_icons: false, swap_box_colors: true, layout_style: "banner", no_glow: false },
  },
  {
    id: "mono",
    name: "mono",
    description: "pure black and white, typewriter mono font.",
    preview: { bg: "#000000", accent: "#ffffff" },
    values: { accent_color: "#ffffff", background_color: "#000000", text_color: "#ffffff", icon_color: "#ffffff", font: "Roboto Mono", monochrome_icons: true, swap_box_colors: false, layout_style: "default", no_glow: true },
  },
];
