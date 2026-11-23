import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { LANDING_PAGES, landingMetadata, SITE_URL } from "../src/pages/home/publicSeoConfig.mjs";

const dist = path.resolve(process.env.PRERENDER_DIST_DIR || "dist");
const token = "S7aICfAiQhecOlomyxXyFPByHxWpiA_tn_2l5U5iynA";
for (const route of Object.keys(LANDING_PAGES)) {
  const file = path.join(dist, route.slice(1), "index.html");
  const html = await fs.readFile(file, "utf8");
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll("title").length, 1, `${route}: duplicate titles`);
  assert.equal(doc.title, LANDING_PAGES[route].title);
  assert.equal(doc.querySelector('meta[name="description"]').content, LANDING_PAGES[route].description);
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, landingMetadata(route).url);
  assert.equal(doc.head.querySelector('meta[name="google-site-verification"]').content, token);
  assert.equal(doc.querySelectorAll("h1").length, 1, `${route}: expected one primary heading`);
  assert.ok(doc.getElementById("root").textContent.trim().length > 100, `${route}: missing readable HTML`);
  assert.ok(doc.querySelector('meta[property="og:url"]'));
  assert.ok(doc.querySelector('meta[name="twitter:card"]'));
  const graph = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  assert.ok(graph["@graph"].some((entity) => entity["@type"] === "WebPage"));
  if (route === "/") {
    assert.ok(doc.querySelector('a[href="/platform"]'));
    assert.ok(doc.querySelector('a[href="/login-register"]'));
    assert.ok(doc.querySelector('a[href="/login-register?mode=register"]'));
  }
  if (route === "/login-register") assert.equal(doc.querySelector('input[type="password"]'), null);
  for (const form of doc.querySelectorAll("form")) assert.ok(form.querySelector("fieldset[disabled]"), "Static forms must wait for React handlers");
  dom.window.close();
}
const shell = new JSDOM(await fs.readFile(path.join(dist, "spa.html"), "utf8"));
assert.equal(shell.window.document.getElementById("root").children.length, 0);
assert.equal(shell.window.document.querySelector('link[rel="canonical"]'), null, "SPA shell must not inherit homepage canonical");
shell.window.close();
const sitemap = new JSDOM(await fs.readFile(path.join(dist, "sitemap.xml"), "utf8"), { contentType: "application/xml" });
const urls = [...sitemap.window.document.querySelectorAll("loc")].map((node) => node.textContent);
for (const route of Object.keys(LANDING_PAGES)) assert.ok(urls.includes(`${SITE_URL}${route}`));
assert.equal(new Set(urls).size, urls.length, "Duplicate sitemap URLs");
assert.ok(!urls.some((url) => /\/admin(?:\/|$)|\/panel(?:\/|$)/.test(url)));
for (const url of urls.filter((value) => value.startsWith(`${SITE_URL}/blogs/`))) {
  const slug = new URL(url).pathname.split("/").pop();
  const dom = new JSDOM(await fs.readFile(path.join(dist, "blogs", slug, "index.html"), "utf8"));
  assert.ok(dom.window.document.querySelector("article h1"));
  assert.ok(!dom.window.document.querySelector('meta[name="robots"]').content.includes("noindex"));
  dom.window.close();
}
sitemap.window.close();
assert.ok((await fs.readFile(path.join(dist, "robots.txt"), "utf8")).includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
console.log(`SEO verified: ${Object.keys(LANDING_PAGES).length} public pages, verification token, headings, metadata, structured data, clean SPA shell and ${urls.length} sitemap URLs.`);
