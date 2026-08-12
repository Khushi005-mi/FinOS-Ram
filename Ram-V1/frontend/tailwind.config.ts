/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./modules/**/*.{js,ts,jsx,tsx,mdx}",
      "./providers/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          apple: {
            bg: "#000000",
            surface: "#09090b",
            card: "rgba(18, 18, 20, 0.75)",
            border: "rgba(255, 255, 255, 0.08)",
            accent: "#6366f1",
            emerald: "#10b981",
            rose: "#f43f5e",
          },
        },
      },
    },
    plugins: [],
  };