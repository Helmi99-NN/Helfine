/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed-variant": "#2f2ebe",
        "inverse-primary": "#006c49",
        "secondary": "#c0c1ff",
        "surface-variant": "#2d3449",
        "background": "#0b1326",
        "on-primary": "#003824",
        "primary-fixed": "#6ffbbe",
        "surface-dim": "#0b1326",
        "secondary-fixed": "#e1e0ff",
        "outline": "#86948a",
        "inverse-on-surface": "#283044",
        "tertiary-container": "#ff7a73",
        "surface": "#0b1326",
        "on-primary-container": "#00422b",
        "surface-container-low": "#131b2e",
        "surface-container-high": "#222a3d",
        "surface-container": "#171f33",
        "on-surface": "#dae2fd",
        "on-secondary-container": "#b0b2ff",
        "on-primary-fixed-variant": "#005236",
        "surface-container-lowest": "#060e20",
        "tertiary-fixed": "#ffdad7",
        "on-secondary": "#1000a9",
        "surface-bright": "#31394d",
        "primary": "#4edea3",
        "surface-tint": "#4edea3",
        "outline-variant": "#3c4a42",
        "error-container": "#93000a",
        "on-secondary-fixed": "#07006c",
        "on-tertiary-fixed": "#410004",
        "primary-fixed-dim": "#4edea3",
        "tertiary-fixed-dim": "#ffb3ad",
        "on-background": "#dae2fd",
        "tertiary": "#ffb3ad",
        "on-error-container": "#ffdad6",
        "primary-container": "#10b981",
        "on-tertiary-fixed-variant": "#930013",
        "secondary-container": "#3131c0",
        "on-tertiary": "#68000a",
        "on-surface-variant": "#bbcabf",
        "secondary-fixed-dim": "#c0c1ff",
        "inverse-surface": "#dae2fd",
        "on-tertiary-container": "#79000e",
        "on-primary-fixed": "#002113",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "surface-container-highest": "#2d3449"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "stack-lg": "32px",
        "gutter": "16px",
        "margin-page": "40px",
        "container-padding": "24px",
        "stack-md": "16px",
        "stack-sm": "8px",
        "unit": "8px"
      },
      fontFamily: {
        "label-sm": ["Plus Jakarta Sans"],
        "body-base": ["Plus Jakarta Sans"],
        "display-lg": ["Plus Jakarta Sans"],
        "data-mono": ["Plus Jakarta Sans"],
        "headline-md": ["Plus Jakarta Sans"]
      },
      fontSize: {
        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500" }],
        "body-base": ["16px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
        "display-lg": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "data-mono": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "600" }],
        "headline-md": ["24px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
