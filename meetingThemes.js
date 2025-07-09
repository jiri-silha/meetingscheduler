// src/components/meetingThemes.js
/* ---------------------------------------------------------------
   getTreasuresTheme(date)  → Promise<string>
   Pulls the Treasures theme from wol.jw.org.  Works in the browser
   by using thingproxy to bypass CORS.  Week 1 = first Monday.
---------------------------------------------------------------- */

export async function getTreasuresTheme(mondayDate) {
  const date = new Date(mondayDate);
  date.setUTCHours(12, 0, 0, 0);

  /* ---- WOL “first-Monday” week number ---- */
  const jan1    = new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 12));
  const jan1DOW = (jan1.getUTCDay() + 6) % 7;      // Mon=0 … Sun=6
  const firstMo = new Date(jan1);
  firstMo.setUTCDate(jan1.getUTCDate() + ((7 - jan1DOW) % 7));
  const week = Math.floor((date - firstMo) / 604800000) + 3;
  /* ---------------------------------------- */

  const wolURL = `https://wol.jw.org/en/wol/meetings/r1/lp-e/${date.getUTCFullYear()}/${week}`;
  const proxy  = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(wolURL)}`;

  try {
    const html = await (await fetch(proxy)).text();
/* --- extract Treasures theme ----------------------------------- */
const doc = new DOMParser().parseFromString(html, "text/html");

/* 1 ◦ all <div id="tt#"> elements in document order */
const ttBlocks = Array.from(doc.querySelectorAll('div[id^="tt"]'));

let theme = null;

for (const block of ttBlocks) {
  // Ignore if this block is the heading (contains “TREASURES FROM GOD’S WORD”).
  if (/TREASURES FROM GOD/i.test(block.textContent)) continue;

  const strong = block.querySelector("strong");
  if (strong) {
    theme = strong.textContent
      .replace(/^[0-9]+\\.[\\s-]*/, "")   // drop leading “1. ” if present
      .replace(/\\s+[–—-].*$/, "")        // drop “ – Proverbs …” if present
      .trim();
    break;
  }
}

if (theme) return theme;
/* --------------------------------------------------------------- */
  } catch (err) {
    console.error("getTreasuresTheme:", err);
  }
  return "Treasures from God’s Word";  // fallback
}

/* ---------------------------------------------------------------
   getLivingParts(date) → Promise<string[]>
   Returns 1-or-2 part titles for the “Living as Christians” section.
---------------------------------------------------------------- */
export async function getLivingParts(mondayDate) {
  const date = new Date(mondayDate);
  date.setUTCHours(12, 0, 0, 0);

  /* first-Monday week number (same math as getTreasuresTheme) */
  const jan1    = new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 12));
  const jan1DOW = (jan1.getUTCDay() + 6) % 7;      // Mon = 0 … Sun = 6
  const firstMo = new Date(jan1);
  firstMo.setUTCDate(jan1.getUTCDate() + ((7 - jan1DOW) % 7));
  const week    = Math.floor((date - firstMo) / 604_800_000) + 3;

  const wolURL  = `https://wol.jw.org/en/wol/meetings/r1/lp-e/${date.getUTCFullYear()}/${week}`;
  const proxy   = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(wolURL)}`;

  try {
    const html = await (await fetch(proxy)).text();
    const doc  = new DOMParser().parseFromString(html, "text/html");

    /* locate the <h2>/<h3> “Living as Christians” heading */
    const heading = [...doc.querySelectorAll("h2, h3")]
      .find(h => /Living as Christians/i.test(h.textContent));

    const titles = [];
    if (heading) {
      /* walk forward until the next section heading */
      for (
        let n = heading.nextElementSibling;
        n && !/^H[23]$/i.test(n.tagName);
        n = n.nextElementSibling
      ) {
        /* grab every <strong> under this node (li, p, div …) */
        n.querySelectorAll("strong").forEach(str => {
          const txt = str.textContent
            .replace(/^[0-9]+[.\s-]*/, "")   // drop “7. ” etc.
            .replace(/[–—-].*$/, "")         // drop scripture ref
            .trim();
          if (txt) titles.push(txt);
        });
        if (titles.length >= 2) break;        // need at most 2
      }
    }

    if (titles.length) return titles.slice(0, 2);
  } catch (err) {
    console.error("getLivingParts:", err);
  }

  /* fallback – generic placeholder */
  return ["Part 1"];
}
