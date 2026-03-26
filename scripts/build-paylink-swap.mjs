import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

await build({
  entryPoints: [path.join(root, "src", "paylink-flashnet.ts")],
  outfile: path.join(root, "public", "paylink-swap.js"),
  bundle: true,
  format: "iife",
  globalName: "PaylinkSwap",
  platform: "browser",
  target: ["es2020"],
  sourcemap: true,
  minify: false,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
