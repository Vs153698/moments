import swc from "unplugin-swc";

export default {
  plugins: [swc.vite()],
  test: {
    include: ["src/**/*.spec.ts"],
  },
};
