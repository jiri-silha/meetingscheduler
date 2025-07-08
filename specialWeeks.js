// src/specialWeeks.js
// -------------------------------------------------------------
// Central place to register “special-layout” weeks.
// The rest of the UI can simply call `getSpecialLayout(weekKey)`
// to know whether it needs to tweak any sections.
// -------------------------------------------------------------

/*  HELPERS  */
import { weekKey } from "./firebaseHelpers";

/**
 * @typedef {Object} FieldOverride
 * @property {"dropdown" | "text"} type – Which control to render.
 * @property {string}  label          – Human-readable label.
 * @property {string}  [oldKey]       – If replacing an existing field.
 */

/**
 * @typedef {Object} SectionOverride
 * @property {FieldOverride[]} add     – Additional fields to append.
 * @property {string[]}        remove  – Keys of existing fields to hide.
 * @property {Object.<string, FieldOverride>} replace – In-place replacements (key → new spec)
 */

/**
 * @typedef {Object} WeeklyLayoutOverride
 * @property {Object.<string, SectionOverride>} midweek  – keyed by section id
 * @property {Object.<string, SectionOverride>} weekend  – keyed by section id
 */

/**
 * SPECIAL_WEEKS – Monday ISO-date → layout overrides
 * Add future exceptions here in the same shape.
 */
export const SPECIAL_WEEKS /** @type {Record<string, WeeklyLayoutOverride>} */ = {
  // 14 – 20 July 2025
  "2025-07-14": {
    midweek: {
      chairmanAndPrayers: {
        // Swap the “Closing Prayer” dropdown for a free-text input
        replace: {
          closingPrayer: { type: "text", label: "Closing Prayer" },
        },
        // Add an extra dropdown right after it
        add: [
          { type: "dropdown", label: "Closing Song", oldKey: "closingSong" },
        ],
        remove: [],
      },
      livingAsChristians: {
        remove: ["cbsConductor", "cbsReader"],
        add: [{ type: "text", label: "Service Talk", oldKey: "serviceTalk" }],
        replace: {},
      },
    },

    weekend: {
      chairman: {
        replace: {
          concludingPrayer: { type: "text", label: "Concluding Prayer" },
        },
        add: [
          { type: "dropdown", label: "Opening Song", oldKey: "openingSong" },
          { type: "dropdown", label: "Concluding Song", oldKey: "concludingSong" },
        ],
        remove: [],
      },
      talks: {
        add: [
          { type: "text", label: "Speaker", oldKey: "speaker" },
          { type: "text", label: "Public Talk", oldKey: "publicTalk" },
          { type: "text", label: "Concluding Talk", oldKey: "concludingTalk" },
        ],
        remove: [],
        replace: {},
      },
      watchtower: {
        replace: {},
        add: [
          { type: "dropdown", label: "WT Conductor", oldKey: "wtConductor" },
        ],
        remove: [],
      },
    },
  },
};

/*  PUBLIC API  */

/**
 * Quick boolean – does the given date fall into a registered special week?
 * @param {Date} date Any date within the desired week.
 */
export function isSpecialWeek(date) {
  return weekKey(getMonday(date)) in SPECIAL_WEEKS;
}

/**
 * Return overrides (or null) for the week that begins with `date`’s Monday.
 * @param {Date} date Any date within the desired week.
 */
export function getSpecialLayout(date) {
  return SPECIAL_WEEKS[weekKey(getMonday(date))] || null;
}

/*  INTERNAL  */
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun…6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift sunday back 6, others to Monday
  date.setDate(date.getDate() + diff);
  return date;
}
