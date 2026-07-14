import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Arabic learning application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="ar"[^>]+dir="rtl"/i);
  assert.match(html, /<title>رحلة العربية \| الصف الأول الإعدادي<\/title>/);
  assert.match(html, /رحلة/);
  assert.match(html, /الصف الأول الإعدادي/);
  assert.match(html, /\/images\/welcome-card\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the complete curriculum and visual assets", async () => {
  const source = await readFile(new URL("../app/curriculum-data.ts", import.meta.url), "utf8");
  const app = await readFile(new URL("../app/CurriculumApp.tsx", import.meta.url), "utf8");

  assert.equal((source.match(/id: "lesson-\d-\d"/g) ?? []).length, 12);
  assert.match(source, /return \[\.\.\.multipleChoice, \.\.\.trueFalse, \.\.\.completion\];/);
  assert.match(source, /while \(result\.length < 50\)/);
  assert.match(app, /const passMark = 70;/);
  assert.match(app, /lastLessonId/);
  assert.match(app, /lastQuestion/);
  assert.match(app, /الأستاذ محمد سعيد جعباص/);

  const assets = [
    "opening-hero.png", "welcome-card.png", "unit-1.png", "unit-2.png", "unit-3.png",
    ...Array.from({ length: 3 }, (_, unit) =>
      Array.from({ length: 4 }, (_, lesson) => `lesson-${unit + 1}-${lesson + 1}.png`),
    ).flat(),
    "teacher-mohamed-saeed.jpg",
  ];
  await Promise.all(assets.map((file) => access(new URL(`../public/images/${file}`, import.meta.url))));
});
