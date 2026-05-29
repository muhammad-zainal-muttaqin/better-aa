import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Static site for Cloudflare Pages. The interactive dashboard runs as a React
// island that fetches the snapshot from the Worker (PUBLIC_API_BASE).
export default defineConfig({
  integrations: [react()],
});
