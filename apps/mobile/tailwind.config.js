// NativeWind v4 config generated from the design tokens (KAN-105).
const { createTailwindConfig } = require("@moments/ui/dist/tailwind");

const config = createTailwindConfig(["./src/**/*.{ts,tsx}"]);
config.presets = [require("nativewind/preset")];

module.exports = config;
