import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://LemonMetrics.github.io",
  output: "static",
  build: {
    assets: "_assets",
  },
});
