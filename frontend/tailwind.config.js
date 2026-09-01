/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#122820',      // deep emerald-black — text & dark sections
        paper: '#FBF7EE',    // warm ivory background
        wine: '#7C2B3B',     // deep maroon — primary CTA / accent
        wineDark: '#5E1F2C',
        gold: '#B98B3E',     // antique brass/gold — stars, highlights
        charcoal: '#2B2A24',
        mist: '#F1EADA',     // warm sand
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
    },
  },
  plugins: [],
};
