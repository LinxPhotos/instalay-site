/**
 * Build /updates/latest.json from the latest GitHub Release of LinxPhotos/InstaLay.
 * Prefer setup EXE on Windows and .zip on macOS. Signature stays null until signing exists.
 *
 * Writes into:
 *  - public/updates/latest.json (source tree, when --commit-public)
 *  - .output/public/updates/latest.json (postbuild Pages output)
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "LinxPhotos";
const REPO = "InstaLay";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function preferWindows(assets, arch) {
  const reArch = arch === "arm64" ? /arm64|aarch64/i : /x64|amd64|x86_64|win64/i;
  const list = assets.filter((a) => /windows/i.test(a.name) && reArch.test(a.name));
  const setup = list.find((a) => /setup/i.test(a.name) && /\.exe$/i.test(a.name));
  return setup ?? null;
}

function preferMac(assets, arch) {
  const reArch = arch === "arm64" ? /arm64|aarch64/i : /x64|amd64|x86_64/i;
  const list = assets.filter((a) => /macos|darwin|osx/i.test(a.name) && reArch.test(a.name));
  const zip = list.find((a) => /\.zip$/i.test(a.name));
  return zip ?? null;
}

function digestSha(asset) {
  // GitHub API may expose digest as "sha256:hex"
  const d = asset.digest;
  if (typeof d === "string" && d.toLowerCase().startsWith("sha256:")) {
    return d.slice("sha256:".length).toLowerCase();
  }
  return null;
}

async function sha256FromSums(assets) {
  const sums = assets.find((a) => a.name === "SHA256SUMS");
  if (!sums) return new Map();
  const res = await fetch(sums.browser_download_url);
  if (!res.ok) return new Map();
  const text = await res.text();
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Fa-f0-9]{64})\s+\*?(.+)$/);
    if (m) map.set(m[2].trim(), m[1].toLowerCase());
  }
  return map;
}

function entry(asset, kind, sums) {
  if (!asset) return null;
  const sha = digestSha(asset) ?? sums.get(asset.name) ?? "";
  return {
    url: asset.browser_download_url,
    sha256: sha,
    signature: null,
    installerKind: kind,
    size: asset.size ?? null,
  };
}

export async function buildUpdateFeed() {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "instalay-site-update-feed",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub releases/latest HTTP ${res.status}`);
  }
  const body = await res.json();
  const tag = String(body.tag_name ?? "").replace(/^v/i, "");
  const assets = Array.isArray(body.assets) ? body.assets : [];
  const sums = await sha256FromSums(assets);

  const platforms = {};
  const wx = entry(preferWindows(assets, "x64"), "exe-setup", sums);
  const wa = entry(preferWindows(assets, "arm64"), "exe-setup", sums);
  const ma = entry(preferMac(assets, "arm64"), "zip-app", sums);
  const mx = entry(preferMac(assets, "x64"), "zip-app", sums);
  if (wx) platforms["windows-x64"] = wx;
  if (wa) platforms["windows-arm64"] = wa;
  if (ma) platforms["macos-arm64"] = ma;
  if (mx) platforms["macos-x64"] = mx;

  return {
    schemaVersion: 1,
    version: tag,
    channel: "stable",
    publishedAt: body.published_at ?? new Date().toISOString(),
    notes: `InstaLay v${tag}`,
    notesUrl: body.html_url ?? `https://github.com/${OWNER}/${REPO}/releases/tag/v${tag}`,
    mandatory: false,
    platforms,
  };
}

function writeFeed(feed, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(feed, null, 2)}\n`);
  console.log(`Wrote ${dest} (version ${feed.version})`);
}

const args = new Set(process.argv.slice(2));
const feed = await buildUpdateFeed().catch((err) => {
  console.warn(`update feed fetch failed: ${err}`);
  const fallback = join(root, "public", "updates", "latest.json");
  if (existsSync(fallback)) {
    console.warn(`Using checked-in fallback ${fallback}`);
    return JSON.parse(readFileSync(fallback, "utf8"));
  }
  throw err;
});

if (args.has("--commit-public") || args.has("--public")) {
  writeFeed(feed, join(root, "public", "updates", "latest.json"));
}

const outPublic = existsSync(join(root, ".output", "public"))
  ? join(root, ".output", "public")
  : existsSync(join(root, "dist"))
    ? join(root, "dist")
    : null;

if (outPublic) {
  writeFeed(feed, join(outPublic, "updates", "latest.json"));
} else if (!args.has("--commit-public") && !args.has("--public")) {
  // Local / CI without build output: still refresh public/
  writeFeed(feed, join(root, "public", "updates", "latest.json"));
}
