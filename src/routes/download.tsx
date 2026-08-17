import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { DownloadCta } from "../components/DownloadCta";
import { LINX } from "../lib/linx";

export default function DownloadPage() {
  return (
    <article class="prose">
      <Title>Download — InstaLay</Title>
      <h1>Download</h1>
      <p>
        Desktop packages for Windows, macOS, and Linux. InstaLay Free is the same
        app as InstaLay — if you want to support the developer,{" "}
        <A href="/docs/pricing">see pricing</A> (checkout on Linx Photos).
      </p>
      <DownloadCta
        owner="LinxPhotos"
        repo="InstaLay"
        label="Download InstaLay"
        anchor="download"
      />
      <p class="muted">
        Pair InstaLay with{" "}
        <a href={LINX.home} rel="noopener noreferrer">
          Linx Photos
        </a>{" "}
        to pull album variants into tapestry projects and publish from your
        hosted library.
      </p>
      <h2>What you get</h2>
      <ul>
        <li>
          Windows installer: <code>*-windows-*-setup.exe</code> (portable ZIP and Store MSIX also ship)
        </li>
        <li>
          macOS: <code>*-macos-*.dmg</code>
        </li>
        <li>
          Linux: <code>*-linux-*.tar.gz</code>
        </li>
      </ul>
    </article>
  );
}
