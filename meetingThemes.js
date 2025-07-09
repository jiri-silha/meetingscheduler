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
   Returns 1-or-2 part titles for the Living-as-Christians section.
---------------------------------------------------------------- */
export async function getLivingParts(mondayDate) {
  const date = new Date(mondayDate);
  date.setUTCHours(12, 0, 0, 0);

  /* first-Monday week number  */
  const jan1    = new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 12));
  const jan1DOW = (jan1.getUTCDay() + 6) % 7;
  const firstMo = new Date(jan1);
  firstMo.setUTCDate(jan1.getUTCDate() + ((7 - jan1DOW) % 7));
  const week = Math.floor((date - firstMo) / 604800000) + 1;

  const wolURL = `https://wol.jw.org/en/wol/meetings/r1/lp-e/${date.getUTCFullYear()}/${week}`;
  const proxy  = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(wolURL)}`;

  try {
    const html = await (await fetch(proxy)).text();
    const doc  = new DOMParser().parseFromString(html, "text/html");

    /* Living-as-Christians block is div#tt11 (English) */
    const block = doc.querySelector('div#tt11');
    if (!block) throw new Error("tt11 not found");

    const titles = Array.from(block.querySelectorAll("strong"))
      .map(s =>
        s.textContent
          .replace(/^[0-9]+[.\\s-]*/, "")   // drop leading “7. ”
          .replace(/[–—-].*$/, "")          // drop scripture ref
          .trim()
      )
      .filter(t => t.length);

    /* First 1-or-2 strong tags are the part titles */
    return titles.slice(0, 2);
  } catch (err) {
    console.error("getLivingParts:", err);
  }
  /* fallback – two generic parts */
  return ["Part 1", "Part 2"];
}
