import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const pnpmDir = path.join(projectRoot, "node_modules", ".pnpm");
const clientPackageDir = path.join(projectRoot, "node_modules", "@prisma", "client");

const prismaClientEntry = fs
  .readdirSync(pnpmDir, { withFileTypes: true })
  .find(
    (entry) =>
      entry.isDirectory() &&
      entry.name.startsWith("@prisma+client@") &&
      fs.existsSync(path.join(pnpmDir, entry.name, "node_modules", ".prisma", "client")),
  );

if (!prismaClientEntry) {
  console.warn("Could not find generated pnpm Prisma client folder to sync.");
  process.exit(0);
}

const sourceDir = path.join(
  pnpmDir,
  prismaClientEntry.name,
  "node_modules",
  ".prisma",
  "client",
);
const targetDir = path.join(clientPackageDir, ".prisma", "client");

fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`Synced Prisma client from ${sourceDir} to ${targetDir}`);
