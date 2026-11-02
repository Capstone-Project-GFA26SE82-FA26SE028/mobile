/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{ts,tsx}',
    './src/features/auth/**/*.{ts,tsx}',
    './src/features/profile/**/*.{ts,tsx}',
    './src/features/waiter/**/*.{ts,tsx}',
    './src/layouts/waiter/**/*.{ts,tsx}',
    './src/layouts/inventory/**/*.{ts,tsx}',
    './src/features/inventory/stock/**/*.{ts,tsx}',
    './src/features/inventory/receipts/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Preserve the existing defaults of the app and its other workspaces.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
