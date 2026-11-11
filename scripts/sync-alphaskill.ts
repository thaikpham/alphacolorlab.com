import { readdirSync, statSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const alphaskillDir = join(projectRoot, "alphaskill");
const sourceDir = process.env.ALPHASKILL_DIR ?? resolve(projectRoot, "..", "alphaskill");

// Delete existing alphaskill and recreate
console.log("Clearing alphaskill...");
try {
  rmSync(alphaskillDir, { recursive: true, force: true });
} catch {}

// Copy skill and portable from source
console.log(`Copying from ${sourceDir}...`);
execSync(`mkdir -p "${alphaskillDir}/skill" "${alphaskillDir}/portable"`, { stdio: "inherit" });
execSync(`cp -r "${join(sourceDir, "skills", "sony-alpha-viet")}"/* "${join(alphaskillDir, "skill")}/"`, { stdio: "inherit" });
execSync(`cp -r "${join(sourceDir, "portable")}"/* "${join(alphaskillDir, "portable")}/"`, { stdio: "inherit" });

// Generate san-pham-sony.md from products.json
console.log("Generating san-pham-sony.md...");
const productsPath = join(projectRoot, "data", "products.json");
const products = JSON.parse(readFileSync(productsPath, "utf-8"));

// Import helpers dynamically
const { specRows, productDetail, productChips } = await import(`${join(projectRoot, "lib", "productSpecs.ts")}`);

// Build markdown content
const helpGuideUrls = {
  "ZV-E10": "https://helpguide.sony.net/ilc/2070/v1/en/index.html",
  "A6400": "https://helpguide.sony.net/ilc/1810/v1/en/index.html",
  "ILCE-7CM2": "https://helpguide.sony.net/ilc/2360/v1/en/index.html",
};

let mdContent = `# Sản phẩm Sony

Thông số máy ảnh và ống kính Sony, lấy từ bảng thông số chính thức trên sony.jp. Dùng khi viết bài cần số liệu sản phẩm; không có giá.

## Máy ảnh

`;

// Group cameras and include them
const cameras = products.filter((p: any) => p.kind === "camera");
for (const camera of cameras) {
  const rows = specRows(camera);
  const detail = productDetail(camera);

  mdContent += `### ${camera.name}\n`;
  mdContent += `**Mã:** ${camera.code}\n`;
  if (detail) mdContent += `${detail}\n`;
  mdContent += `\n`;

  for (const row of rows) {
    mdContent += `- **${row.label}:** ${row.value}\n`;
  }
  mdContent += `\n`;
}

// Lenses: one compact table (82 rows), enough for focal length, aperture and series
mdContent += `## Ống kính\n\n| Tên | Mã | Tiêu cự · khẩu độ · dòng |\n| --- | --- | --- |\n`;
for (const lens of products.filter((p: any) => p.kind === "lens")) {
  mdContent += `| ${lens.name} | ${lens.code} | ${productChips(lens).join(" · ")} |\n`;
}
mdContent += `\n`;

// Add Help Guide URLs
mdContent += `## Hướng dẫn chính thức\n\n`;
for (const [model, url] of Object.entries(helpGuideUrls)) {
  mdContent += `- [${model} Help Guide](${url})\n`;
}

// Write the file to both locations
const skillPath = join(alphaskillDir, "skill", "references", "san-pham-sony.md");
const portablePath = join(alphaskillDir, "portable", "knowledge", "san-pham-sony.md");

writeFileSync(skillPath, mdContent, "utf-8");
writeFileSync(portablePath, mdContent, "utf-8");

// List files with sizes
console.log("\n📦 Alphaskill files:");
function listFiles(dir: string, prefix = ""): [string, number][] {
  const files: [string, number][] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isFile()) {
        const size = statSync(path).size;
        files.push([prefix + entry.name, size]);
      } else if (entry.isDirectory()) {
        files.push(...listFiles(path, prefix + entry.name + "/"));
      }
    }
  } catch {}
  return files;
}

const allFiles = listFiles(alphaskillDir).sort((a, b) => a[0].localeCompare(b[0]));
let totalSize = 0;
for (const [path, size] of allFiles) {
  console.log(`  ${path.padEnd(50)} ${(size / 1024).toFixed(1).padStart(6)} KB`);
  totalSize += size;
}

console.log(`\n✓ Total: ${(totalSize / 1024).toFixed(1)} KB (${allFiles.length} files)`);
console.log(`✓ san-pham-sony.md generated at:`);
console.log(`  - ${skillPath}`);
console.log(`  - ${portablePath}`);
