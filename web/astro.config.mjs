import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// SSR on Cloudflare Pages: the page is rendered server-side on every request,
// reading the latest catalog straight from the bound KV namespace (the daily
// cron keeps it fresh), so the site is "dynamic" with no rebuild/redeploy.
//
// The HTML-first rule is preserved: SSR emits the full data table + KPIs as
// static HTML, so it still works with JS disabled / extensions / translate.
// `platformProxy` lets `astro dev` reach the local KV emulation via wrangler.
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [react()],
  vite: {
    resolve: {
      // React 19's react-dom/server.browser (used to SSR our React components)
      // needs MessageChannel, which workerd doesn't expose. The edge build uses
      // web streams instead. Required for SSR on Cloudflare. (Astro CF docs.)
      alias: {
        ...(import.meta.env.PROD && { "react-dom/server": "react-dom/server.edge" }),
      },
    },
  },
});

