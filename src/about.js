// about.js: entry point for about.html. Page-specific render only;
// shared shell (lang, top nav, header, footer, i18n) lives in page-shell.js.

import { loadYaml, renderTemplate, combineContext } from "./content-loader.js";
import { bootPage, registerServiceWorker } from "./page-shell.js";

registerServiceWorker();

bootPage({
  pageTitle: ({ lang, site }) =>
    `${lang === "fr" ? "À propos" : "About"} | ${site?.site?.title ?? ""}`,
  onRender: async ({ lang, site }) => {
    const [findings, aboutMd] = await Promise.all([
      loadYaml("content/findings.yml"),
      fetchText(`content/about.${lang}.md`),
    ]);
    const ctx = combineContext(site, findings);
    renderAbout(aboutMd, ctx);
  },
});

function renderAbout(md, ctx) {
  const root = document.querySelector("[data-region='about']");
  if (!root) return;
  const rendered = renderTemplate(md, ctx);
  root.innerHTML = `<article class="about">${window.marked.parse(rendered)}</article>`;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}
