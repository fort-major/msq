module.exports = {
  content: [
    "./apps/landing/**/*.html",
    "./apps/landing/**/*.js",
    "./apps/landing/**/*.ts",
    "./apps/landing/**/*.jsx",
    "./apps/landing/**/*.tsx",
  ],
  theme: {
    extend: {
      animation: {
        textrun: "textrun 10s linear infinite",
      },
      keyframes: {
        textrun: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      fontFamily: {
        unique: ["Unique", "sans-serif"],
      },
    },
  },
  plugins: [],
};
