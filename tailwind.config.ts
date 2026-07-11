import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff4ff',
          100: '#dbe4ff',
          500: '#3b7be0',
          600: '#1e5fd9',
          700: '#1a52c0',
          800: '#1642a0',
          900: '#0f2d6e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
