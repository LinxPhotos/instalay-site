import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

export default function InstallDocs() {
  return (
    <article class="prose">
      <Title>Install — InstaLay</Title>
      <h1>Install</h1>
      <h2>Windows</h2>
      <ul>
        <li>
          <strong>winget</strong> (after package acceptance):{" "}
          <code>winget install LinxPhotos.InstaLay</code>
        </li>
        <li>
          <strong>Microsoft Store</strong>: search “InstaLay” or sideload the{" "}
          <code>*-store.msix</code> from Releases via Partner Center.
        </li>
        <li>
          <strong>Portable / Inno</strong>:{" "}
          <A href="/download">download the installer or ZIP for your platform</A>.
        </li>
      </ul>
      <h2>macOS</h2>
      <p>
        <code>brew install --cask amdphreak/tap/instalay</code> or{" "}
        <A href="/download">install the DMG for your Mac</A>.
      </p>
      <h2>Linux</h2>
      <p>
        Extract the <code>.tar.gz</code> for your CPU from{" "}
        <A href="/download">Downloads</A> and run <code>./instalay</code>.
      </p>
      <h2>Mobile &amp; web</h2>
      <p>
        Android / iOS / web builds ship from the same Flutter project. Store
        listings use the keyword pack in <code>store/</code>.
      </p>
    </article>
  );
}
