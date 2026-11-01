/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/features/waiter/**/*.{ts,tsx}',
    './src/layouts/waiter/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Preserve the existing defaults of the app and its other workspaces.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
