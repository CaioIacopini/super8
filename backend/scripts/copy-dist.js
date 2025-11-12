// copia ../frontend/dist -> ./dist (funciona no Windows/macOS/Linux)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, "../../frontend/dist");
const dst = path.resolve(__dirname, "../dist");

function copyDir(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) {
    console.error(
      "✖ Frontend não está buildado. Rode: npm run build na pasta frontend"
    );
    process.exit(1);
  }
  if (fs.existsSync(dstDir))
    fs.rmSync(dstDir, { recursive: true, force: true });
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, entry);
    const d = path.join(dstDir, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(src, dst);
console.log("✔ Copiado frontend/dist -> backend/dist");
