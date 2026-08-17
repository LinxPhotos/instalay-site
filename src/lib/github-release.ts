import type { DistroId } from "./detect-platform";

export type ReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

export type LatestRelease = {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
};

type GithubAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GithubRelease = {
  tag_name: string;
  html_url: string;
  assets?: GithubAsset[];
};

export async function fetchLatestRelease(owner: string, repo: string): Promise<LatestRelease | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub releases: HTTP ${res.status}`);
  const body = (await res.json()) as GithubRelease;
  return {
    tag_name: body.tag_name,
    html_url: body.html_url,
    assets: (body.assets ?? []).map((a) => ({
      name: a.name,
      browser_download_url: a.browser_download_url,
      size: a.size,
    })),
  };
}

function osTokens(os: "windows" | "macos" | "linux"): RegExp {
  switch (os) {
    case "windows":
      return /windows|\bwin(64|32)?\b/;
    case "macos":
      return /macos|darwin|osx|mac[-_]?os/;
    default:
      return /linux/;
  }
}

function parseDistro(id: DistroId): { os: "windows" | "macos" | "linux"; arch: "x64" | "arm64" } {
  const [os, arch] = id.split("-") as ["windows" | "macos" | "linux", "x64" | "arm64"];
  return { os, arch };
}

function matchesDistro(name: string, distro: DistroId): boolean {
  const n = name.toLowerCase();
  if (n === "sha256sums" || n.includes("sha256")) return false;
  const { os, arch } = parseDistro(distro);
  if (!osTokens(os).test(n)) return false;
  const arm = /arm64|aarch64/.test(n);
  if (arch === "arm64") return arm;
  if (arm) return false;
  return /x64|amd64|x86_64|win64/.test(n) || os === "windows";
}

function assetRank(name: string, os: "windows" | "macos" | "linux"): number {
  const n = name.toLowerCase();
  if (os === "windows") {
    if (n.includes("store")) return 15;
    if (n.includes("setup") && n.endsWith(".exe")) return 100;
    if (n.endsWith(".exe")) return 80;
    if (n.endsWith(".msi")) return 70;
    if (n.endsWith(".zip")) return 60;
    if (n.endsWith(".msix")) return 40;
  }
  if (os === "macos") {
    if (n.endsWith(".dmg")) return 100;
    if (n.endsWith(".pkg")) return 80;
    if (n.endsWith(".zip")) return 60;
  }
  if (os === "linux") {
    if (n.endsWith(".appimage")) return 100;
    if (n.endsWith(".deb")) return 80;
    if (n.endsWith(".rpm")) return 70;
    if (n.endsWith(".tar.gz") || n.endsWith(".tgz")) return 60;
  }
  return 1;
}

export function pickAsset(release: LatestRelease | null | undefined, distro: DistroId): ReleaseAsset | null {
  if (!release?.assets.length) return null;
  const { os } = parseDistro(distro);
  const hits = release.assets.filter((a) => matchesDistro(a.name, distro));
  if (!hits.length) return null;
  return hits.slice().sort((a, b) => assetRank(b.name, os) - assetRank(a.name, os))[0] ?? null;
}
