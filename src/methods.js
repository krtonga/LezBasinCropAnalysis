// methods.js: entry point for methods.html. Renders the methods white
// paper as one long markdown page.
//
// English-only: the paper text in `content/methods.en.md` is loaded
// regardless of the active UI language. The page chrome (top nav, header,
// footer) still reflects the toggle. A French translation of the paper
// can be added later by creating content/methods.fr.md and switching the
// fetch path below to use ${lang}.

import { loadYaml, renderTemplate, combineContext } from "./content-loader.js";
import { bootPage, registerServiceWorker } from "./page-shell.js";

registerServiceWorker();

bootPage({
  pageTitle: ({ lang, site }) =>
    `${lang === "fr" ? "Méthodologie" : "Methods"} | ${site?.site?.title ?? ""}`,
  onRender: async ({ site }) => {
    const [findings, md] = await Promise.all([
      loadYaml("content/findings.yml"),
      fetchText("content/methods.en.md"),         // English-only for now
    ]);
    const ctx = combineContext(site, findings);
    renderMethods(md, ctx);
  },
});

function renderMethods(md, ctx) {
  const root = document.querySelector("[data-region='methods']");
  if (!root) return;
  const rendered = renderTemplate(md, ctx);
  root.innerHTML = `<article class="methods-paper">${window.marked.parse(rendered)}</article>`;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}
