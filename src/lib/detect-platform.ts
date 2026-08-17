export type DistroId =
  | "windows-x64"
  | "windows-arm64"
  | "macos-x64"
  | "macos-arm64"
  | "linux-x64"
  | "linux-arm64";

export type DetectedKind = DistroId | "android" | "ios" | "unknown";

export const DISTROS: { id: DistroId; label: string }[] = [
  { id: "windows-x64", label: "Windows x64" },
  { id: "windows-arm64", label: "Windows ARM64" },
  { id: "macos-arm64", label: "macOS Apple Silicon" },
  { id: "macos-x64", label: "macOS Intel" },
  { id: "linux-x64", label: "Linux x64" },
  { id: "linux-arm64", label: "Linux ARM64" },
];

export function distroLabel(id: DistroId): string {
  return DISTROS.find((d) => d.id === id)?.label ?? id;
}

export function detectedLabel(kind: DetectedKind): string {
  if (kind === "android") return "Android";
  if (kind === "ios") return "iOS";
  if (kind === "unknown") return "Unknown platform";
  return distroLabel(kind);
}

function uaLooksArm(ua: string): boolean {
  return /arm64|aarch64|apple silicon/i.test(ua);
}

function uaLooksX64(ua: string): boolean {
  return /Win64|WOW64|x64|amd64|x86_64|Intel Mac/i.test(ua);
}

export async function detectKind(): Promise<DetectedKind> {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent;
  let platform = "";
  let architecture = "";
  let bitness = "";

  const uaData = navigator.userAgentData;
  if (uaData) {
    platform = uaData.platform ?? "";
    try {
      const hi = await uaData.getHighEntropyValues(["architecture", "bitness", "platform"]);
      platform = hi.platform || platform;
      architecture = (hi.architecture ?? "").toLowerCase();
      bitness = hi.bitness ?? "";
    } catch {
      /* Brave and some locked-down Chromium builds refuse high-entropy hints. */
    }
  }

  const plat = `${platform} ${ua}`.toLowerCase();
  if (/android/.test(plat)) return "android";
  if (/\biphone\b|\bipad\b|\bios\b/.test(plat)) return "ios";

  const os: "windows" | "macos" | "linux" | null = /windows/.test(plat)
    ? "windows"
    : /mac/.test(plat)
    ? "macos"
    : /linux|cros|\bx11\b/.test(plat)
    ? "linux"
    : null;

  if (!os) return "unknown";

  const archIsArm =
    architecture === "arm" ||
    architecture.includes("aarch") ||
    uaLooksArm(ua) ||
    (os === "windows" && /arm64|aarch64/i.test(ua));

  const archIsX64 =
    (architecture === "x86" && bitness === "64") ||
    architecture === "x86_64" ||
    (!archIsArm && (uaLooksX64(ua) || bitness === "64"));

  let arch: "x64" | "arm64";
  if (archIsArm) arch = "arm64";
  else if (archIsX64) arch = "x64";
  else if (os === "macos") arch = "arm64";
  else arch = "x64";

  return `${os}-${arch}`;
}

export function desktopDefault(kind: DetectedKind): DistroId | null {
  if (kind === "android" || kind === "ios" || kind === "unknown") return null;
  return kind;
}
