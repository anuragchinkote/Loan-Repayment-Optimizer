import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

function seoFilesPlugin(): Plugin {
  const routes = [
    "/",
    "/privacy",
    "/terms",
    "/assumptions",
    "/disclaimer",
    "/education-loan-prepayment",
    "/extra-monthly-loan-payment",
    "/lump-sum-loan-prepayment",
  ];
  const lastmod = new Date().toISOString().slice(0, 10);
  return {
    name: "loanpilot-seo-files",
    generateBundle() {
      const base = (process.env.VITE_PUBLIC_URL || "http://localhost:5173").replace(/\/+$/, "");
      const urls = [...new Set(routes)].map(
        (r) => `  <url><loc>${base}${r}</loc><lastmod>${lastmod}</lastmod></url>`,
      );
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
      const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
    },
  };
}

export default defineConfig({
  plugins: [react(), seoFilesPlugin()],
  server: { port: 5173 },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});