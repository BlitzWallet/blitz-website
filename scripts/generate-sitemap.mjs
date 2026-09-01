// Generates sitemap.xml from the real page set + blogContentList.js, with
// accurate <lastmod> from git. Runs at build time so the sitemap can't drift.
// noindex pages (terms, privacy, child) and utility pages are intentionally omitted.
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { postList } from "../pages/blog/blogContentList.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const ORIGIN = "https://blitzwalletapp.com";
const today = new Date().toISOString().slice(0, 10);

function gitLastmod(relPath, fallback) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${relPath}"`, {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : fallback;
  } catch {
    return fallback;
  }
}

// Static, indexable pages. Add a feature/learn page here when it ships.
const staticPages = [
  { loc: "/", file: "index.html", priority: "1.00" },
  { loc: "/pages/about/", file: "pages/about/index.html", priority: "0.80" },
  { loc: "/pages/blog/", file: "pages/blog/index.html", priority: "0.80" },
  { loc: "/pages/contact/", file: "pages/contact/index.html", priority: "0.70" },
  { loc: "/pages/brand/", file: "pages/brand/index.html", priority: "0.60" },
];

const blogPages = postList.map((p) => {
  const link = p.htmlPageLink.replace(/\/$/, "");
  const file = `${link.replace(/^\//, "")}/index.html`;
  const fallback = p.time
    ? new Date(parseInt(p.time)).toISOString().slice(0, 10)
    : today;
  return { loc: `${link}/`, file, priority: "0.70", fallback };
});

const urls = [
  ...staticPages.map((p) => ({ ...p, lastmod: gitLastmod(p.file, today) })),
  ...blogPages.map((p) => ({ ...p, lastmod: gitLastmod(p.file, p.fallback) })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${ORIGIN}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(path.join(root, "sitemap.xml"), xml);
console.log(`sitemap.xml written with ${urls.length} URLs`);
