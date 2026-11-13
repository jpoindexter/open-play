import {groups, pages, href, version, updated} from './pages.mjs';
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
export function template(page, body, headings) {
  const index = pages.indexOf(page);
  const adjacent = [pages[index - 1], pages[index + 1]];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)} — Open Play Help</title><meta name="description" content="${escape(page.description)}">
<meta name="theme-color" content="#000000"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/tokens.css"><link rel="stylesheet" href="/assets/site.css">
<script type="module" src="/assets/site.js"></script></head>
<body><a class="skip" href="#content">Skip to content</a>
<header class="topbar"><a class="brand" href="/" aria-label="Open Play Help home">openplay<span>Help & manual</span></a>
<form class="search" role="search" action="/" method="get"><label for="search">Search the manual</label><input id="search" name="q" type="search" placeholder="Search controls, topics, fixes…" autocomplete="off"><button type="submit">Search</button></form>
<a class="report-link" href="https://github.com/jpoindexter/open-play/issues/new?template=beta-bug-report.yml">Report a bug ${arrow}</a>
<button class="nav-toggle" type="button" aria-controls="manual-nav" aria-expanded="false">Contents</button></header>
<div class="shell"><nav id="manual-nav" class="sidebar" aria-label="Manual contents"><p class="edition">PRIVATE BETA GUIDE <span>v${version}</span></p>
${groups.map(([group, entries]) => `<section><h2>${group}</h2>${entries.map(([slug, title]) => `<a href="${href(slug)}" ${slug === page.slug ? 'aria-current="page"' : ''}>${escape(title)}</a>`).join('')}</section>`).join('')}
<p class="nav-foot">Built for local music.<br>Independent DJ software.</p></nav>
<main id="content" tabindex="-1"><section id="search-results" hidden aria-label="Search results"><h1>Search the manual</h1><p id="search-status" role="status"></p><div id="matches"></div><button id="close-search" type="button">Back to this article</button></section>
<article id="article"><div class="breadcrumb"><a href="/">Manual</a><span aria-hidden="true">/</span>${escape(page.group)}</div>
<p class="eyebrow">${escape(page.group)}</p><h1>${escape(page.title)}</h1><p class="lead">${escape(page.description)}</p>
${page.slug === 'index' ? '<p class="notice">Guide for the current private Mac candidate. A public beta installer is not available yet. <a href="/known-issues/">Read beta status</a>.</p>' : ''}
${body}
<footer class="article-footer"><p>Guide baseline: v${version} · Updated ${updated}. Check your app’s window title. Advanced and hardware limits are labelled.</p>
<nav class="pagination" aria-label="Adjacent articles">${adjacent.map((p, i) => p ? `<a href="${href(p.slug)}"><small>${i ? 'Next' : 'Previous'}</small>${escape(p.title)}<span aria-hidden="true">${i ? '→' : '←'}</span></a>` : '<span></span>').join('')}</nav></footer></article></main>
<aside class="on-page" aria-label="On this page"><p>On this page</p>${headings.map(h => `<a href="#${h.id}">${escape(h.text)}</a>`).join('')}<hr><a href="/known-issues/">Beta limitations ${arrow}</a><a href="/troubleshooting/">Get unstuck ${arrow}</a></aside></div>
</body></html>`;
}
