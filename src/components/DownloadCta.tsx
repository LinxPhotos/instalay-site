import { For, Show, createSignal, onMount } from "solid-js";

import {
  DISTROS,
  desktopDefault,
  detectKind,
  detectedLabel,
  type DetectedKind,
  type DistroId,
} from "../lib/detect-platform";
import { fetchLatestRelease, pickAsset, type LatestRelease } from "../lib/github-release";

type Props = {
  owner: string;
  repo: string;
  label: string;
  class?: string;
  /** Anchor for in-page Download links. Omit on secondary copies. */
  anchor?: string;
};

export function DownloadCta(props: Props) {
  const [kind, setKind] = createSignal<DetectedKind | null>(null);
  const [chosen, setChosen] = createSignal<DistroId | null>(null);
  const [release, setRelease] = createSignal<LatestRelease | null | undefined>(undefined);
  const [error, setError] = createSignal<string | null>(null);

  onMount(() => {
    void (async () => {
      try {
        const detected = await detectKind();
        setKind(detected);
        setChosen((c) => c ?? desktopDefault(detected));
      } catch {
        setKind("unknown");
      }
      try {
        setRelease(await fetchLatestRelease(props.owner, props.repo));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load releases");
        setRelease(null);
      }
    })();
  });

  const selected = () => chosen();
  const asset = () => {
    const id = selected();
    const rel = release();
    if (!id || rel === undefined) return undefined;
    return pickAsset(rel ?? null, id);
  };
  const href = () => asset()?.browser_download_url ?? undefined;
  const detectedLine = () => {
    const k = kind();
    if (!k) return "Detecting…";
    return `(Download) ${detectedLabel(k)} detected`;
  };
  const ready = () => release() !== undefined && kind() !== null;
  const missingRelease = () => ready() && release() === null;
  const missingAsset = () => ready() && release() !== null && selected() != null && !asset();

  return (
    <div id={props.anchor} class={`download-cta ${props.class ?? ""}`}>
      <Show
        when={href()}
        fallback={
          <button type="button" class="btn btn-primary" disabled>
            {props.label}
          </button>
        }
      >
        {(url) => (
          <a class="btn btn-primary" href={url()} rel="noopener noreferrer">
            {props.label}
          </a>
        )}
      </Show>

      <p class="download-cta-note">{detectedLine()}</p>

      <label class="download-cta-override">
        <span>Another platform</span>
        <select
          value={selected() ?? ""}
          disabled={!ready()}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setChosen((DISTROS.some((d) => d.id === v) ? v : null) as DistroId | null);
          }}
        >
          <Show when={!desktopDefault(kind() ?? "unknown")}>
            <option value="">Choose a platform</option>
          </Show>
          <For each={DISTROS}>
            {(d) => {
              const available = () => !!pickAsset(release() ?? null, d.id);
              return (
                <option value={d.id}>
                  {d.label}
                  {ready() && release() && !available() ? " — none yet" : ""}
                </option>
              );
            }}
          </For>
        </select>
      </label>

      <Show when={missingRelease()}>
        <p class="download-cta-note">No release yet.</p>
      </Show>
      <Show when={missingAsset()}>
        <p class="download-cta-note">No build for that platform yet.</p>
      </Show>
      <Show when={error()}>
        {(msg) => <p class="download-cta-note">{msg()}</p>}
      </Show>
    </div>
  );
}
