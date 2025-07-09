// ────────────────  src/MeetingScheduler.jsx  ────────────────
import React, { useState, useMemo, Fragment } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

/* ───────────────────────── helpers ───────────────────────── */

/** Count how many times each publisher is assigned this week */
const buildCounts = sel =>
  Object.values(sel).reduce((m, p) => {
    if (!p) return m;
    m[p] = (m[p] || 0) + 1;
    return m;
  }, {});

/** Filter publishers by role for a given assignment key */
const getByRole = (P, roles, key) => P.filter(pub => roles[pub]?.[key]);

/** Sort publisher list by last‑assigned date (oldest first) then A‑Z */
function sortByLastAssigned(arr, lastAssignedObj, assignmentKey) {
  return arr.slice().sort((a, b) => {
    const dateA = lastAssignedObj[assignmentKey]?.[a] || "2000-01-01T00:00:00.000Z";
    const dateB = lastAssignedObj[assignmentKey]?.[b] || "2000-01-01T00:00:00.000Z";
    if (dateA === dateB) return a.localeCompare(b);
    return new Date(dateA) - new Date(dateB);
  });
}

/* ───────────────────────── static data ───────────────────────── */

const APPLY_ASSIGNMENTS = [
  { key: "Student 1", asstKey: "Assistant 1" },
  { key: "Student 2", asstKey: "Assistant 2" },
  { key: "Student 3", asstKey: "Assistant 3" },
  { key: "Student 4", asstKey: "Assistant 4" },
];

const CLEANING_OPTIONS = ["Group 1", "Group 2", "Group 3", "Group 4"];
const SONG_NUMBERS     = Array.from({ length: 161 }, (_, i) => String(i + 1));

const SECTIONS = [
  {
    title: "MEETING CHAIRMAN AND PRAYERS",
    shortTitle: "CHAIRMAN",
    assignments: ["Chairman", "Opening Prayer", "Closing Prayer"],
  },
  {
    title: "Treasures from God’s Word",
    shortTitle: "TREASURES",
    color: "blue",
    assignments: ["Treasures", "Spiritual Gems", "Bible Reading"],
  },
  { marker: "APPLY" },
  {
    title: "Living as Christians",
    shortTitle: "Living as Christians",
    color: "red",
    assignments: ["Part 1", "Part 2", "CBS Conductor", "CBS Reader"],
  },
];

export const DUTIES = [
  "Cleaning",
  "Entrance Attendant",
  "Auditorium Attendant",
  "A/V",
  "Zoom",
  "Microphone 1 & Stage",
  "Microphone 2",
];

/* ───────────────────────── component ───────────────────────── */

export default function MeetingScheduler({
  treasureTheme = "Treasures from God's Word",
  livingPartTitles = ["Part 1", "Part 2"],
  dayLabel,
  meetingDate,
  PUBLISHERS,
  publisherRoles,
  selectedAssignments,
  onAssignmentChange,
  unavailabilities = {},
  lastAssigned = {},
  isEditable,
  layoutOverride = null,          // non‑null for 14–20 Jul 2025 week
}) {
  const counts = useMemo(() => buildCounts(selectedAssignments), [selectedAssignments]);

  /* ---------- dropdown option line ---------- */
  const optionRow = (pub, { active, disabled }) => (
    <div className={`option-line${active ? " active" : ""}${disabled ? " disabled" : ""}`}>
      <span className="option-name">{pub}</span>
      {counts[pub] > 0 && (
        <span className="option-badge">{counts[pub]} assignment{counts[pub] > 1 ? "s" : ""}</span>
      )}
      {disabled && <span className="option-badge">unavailable</span>}
    </div>
  );

  /* ---------- publisher / fixed-list dropdown row ---------- */
const Select = (id, editable) => {
  /* 1 ◦ Cleaning uses a fixed options list */
  if (id === "Cleaning") {
    return ListSelectRow(id, CLEANING_OPTIONS, "Select option");
  }

  /* 2 ◦ Build the initial role-qualified pool */
  let pool = getByRole(PUBLISHERS, publisherRoles, id);
  if (!pool.length) pool = PUBLISHERS.slice();           // nobody has the role

  const current = selectedAssignments[id];
const unavailable = pool.filter(pub => Boolean(unavailabilities[pub]));
const available = pool.filter(pub => !unavailabilities[pub]);

const sortedAvailable = sortByLastAssigned(available, lastAssigned, id);
const sortedUnavailable = sortByLastAssigned(unavailable, lastAssigned, id);

let options = [...sortedAvailable, ...sortedUnavailable];

if (current && !options.includes(current)) {
  options.unshift(current);
}


  /* 7 ◦ Render dropdown */
  return (
    <Listbox
      value={current || ""}
      onChange={v => onAssignmentChange(id, v)}
      disabled={!editable}
    >
      <div className="assignment">
        <Listbox.Button className="assignment-button">
          <span className="assignment-label">
  {id === "Treasures"
    ? treasureTheme
    : id === "Part 1"
      ? livingPartTitles[0] || "Part 1"
      : id === "Part 2"
        ? (livingPartTitles[1] || "Part 2")
        : id}
</span>
          <span className={`dropdown-value ${!current ? "text-gray-400" : ""}`}>
            {current || "Select publisher"}
          </span>
          {editable && <ChevronDownIcon className="h-4 w-4" />}
        </Listbox.Button>

        <Listbox.Options className="options-panel">
          <Listbox.Option value="">
            {({ active }) => (
              <div className={`option-line${active ? " active" : ""}`}>Select publisher</div>
            )}
          </Listbox.Option>

          {options.map(pub => (
            <Listbox.Option
              key={pub}
              value={pub}
              disabled={Boolean(unavailabilities[pub]) && pub !== current}
            >
              {state => optionRow(pub, state)}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};

  /* ---------- fixed‑list dropdown (songs) ---------- */
  const ListSelectRow = (key, LIST, placeholder) => (
  <div className="assignment">
    <Listbox
      value={selectedAssignments[key] || ""}
      onChange={v => onAssignmentChange(key, v)}
      disabled={!isEditable}
    >
      <Listbox.Button className="assignment-button">
        <span className="assignment-label">{key}</span>
        <span className={`dropdown-value ${!selectedAssignments[key] ? "text-gray-400" : ""}`}>
          {selectedAssignments[key] || placeholder}
        </span>
        {isEditable && <ChevronDownIcon className="h-4 w-4" />}
      </Listbox.Button>

      <Listbox.Options className="options-panel">
        <Listbox.Option value="">
          {({ active }) => (
            <div className={`option-line${active ? " active" : ""}`}>{placeholder}</div>
          )}
        </Listbox.Option>
        {LIST.map(item => (
          <Listbox.Option key={item} value={item}>
            {({ active }) => (
              <div className={`option-line${active ? " active" : ""}`}>{item}</div>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  </div>
);


  /* ---------- text‑input row (uncontrolled to keep focus) ---------- */
  const TextInputRow = ({ id, placeholder }) => {
    const [local, setLocal] = useState(selectedAssignments[id] || "");

    return (
      <div className="assignment">
        <div className="assignment-button">
          <span className="assignment-label">{id}</span>
          <input
            type="text"
            className="text-input dropdown-value"
            defaultValue={local}
            onChange={e => setLocal(e.target.value)}
            onBlur={e => onAssignmentChange(id, e.target.value)}
            disabled={!isEditable}
          />
        </div>
      </div>
    );
  };

  /* ---------- template for standard rows ---------- */
  const sections = useMemo(() => SECTIONS, []); // immutable baseline
  const isSpecial = Boolean(layoutOverride);

  return (
    <main className="content">
      {layoutOverride && (
  <div className="info-banner">
    <div className="headline">CO Week with&nbsp;Johan&nbsp;and&nbsp;Elisabeth&nbsp;Meulmeester</div>
    <div className="subline">(15–20&nbsp;July&nbsp;2025)</div>
  </div>
)}

<h2 className="day-title">{dayLabel}</h2>

      {isSpecial ? (
        /* ───────── SPECIAL MIDWEEK LAYOUT (14–20 Jul 2025) ───────── */
        <>
          {/* CHAIRMAN & PRAYERS */}
          <section className="section">
            <h3 className="section-title">Chairman</h3>
            {Select("Chairman",        isEditable)}
            {Select("Opening Prayer",  isEditable)}
            {Select("Closing Prayer", isEditable)}
            {ListSelectRow("Closing Song", SONG_NUMBERS, "Select song")}
          </section>

          {/* TREASURES */}
          <section className="section blue">
            <h3 className="section-title">Treasures from God’s Word</h3>
            {[
              "Treasures",
              "Spiritual Gems",
              "Bible Reading",
            ].map(id => (
              <Fragment key={id}>{Select(id, isEditable)}</Fragment>
            ))}
          </section>

          {/* APPLY YOURSELF */}
          <section className="section beige">
            <h3 className="section-title">
              <span className="section-title-full">Apply Yourself to the Field&nbsp;Ministry</span>
              <span className="section-title-short">Field&nbsp;Ministry</span>
            </h3>
            {APPLY_ASSIGNMENTS.map(({ key: s, asstKey: a }) => (
              <div key={s} className="apply-group">
                {Select(s, isEditable)}
                {Select(a, isEditable)}
              </div>
            ))}
          </section>

          {/* LIVING AS CHRISTIANS */}
<section className="section red">
  <h3 className="section-title">Living as Christians</h3>

  {/* dynamic Part rows */}
  <div className="assignment">{Select("Part 1", isEditable)}</div>
  {livingPartTitles.length > 1 && (
    <div className="assignment">{Select("Part 2", isEditable)}</div>
  )}

  {/* Service Talk (text input) only on CO week */}
  <TextInputRow id="Service Talk" placeholder="Title" />

  {/* CBS rows always present */}
  <div className="assignment">{Select("CBS Conductor", isEditable)}</div>
  <div className="assignment">{Select("CBS Reader", isEditable)}</div>
</section>

          {/* DUTIES */}
          <section className="section duties-section">
            <h3 className="section-title">Duties</h3>
            {DUTIES.map(d =>
              d === "Cleaning"
                ? <Fragment key={d}>{Select(d, isEditable)}</Fragment>
                : Select(d, isEditable)
            )}
          </section>
        </>
      ) : (
        /* ───────── STANDARD MIDWEEK LAYOUT ───────── */
        <>
          {sections.map(sec => {
            if (sec.shortTitle === "Living as Christians") {
  return (
    <section key="LAC" className="section red">
      <h3 className="section-title">Living as Christians</h3>

      {/* dynamic Part rows */}
      <div className="assignment">{Select("Part 1", isEditable)}</div>
      {livingPartTitles.length > 1 && (
        <div className="assignment">{Select("Part 2", isEditable)}</div>
      )}

      {/* CBS rows always present */}
      <div className="assignment">{Select("CBS Conductor", isEditable)}</div>
      <div className="assignment">{Select("CBS Reader", isEditable)}</div>
    </section>
  );
}

            return (
              <section key={sec.shortTitle} className={`section${sec.color ? " " + sec.color : ""}`}>
                <h3 className="section-title">
                  <span className="section-title-full">{sec.title}</span>
                  <span className="section-title-short">{sec.shortTitle}</span>
                </h3>
                {sec.assignments.map(a => (
  <Fragment key={a}>{Select(a, isEditable)}</Fragment>
))}
              </section>
            );
          })}

          {/* DUTIES */}
          <section className="section duties-section">
            <h3 className="section-title">Duties</h3>
            {DUTIES.map(d =>
              d === "Cleaning"
                ? <Fragment key={d}>{Select(d, isEditable)}</Fragment>
                : Select(d, isEditable)
            )}
          </section>
        </>
      )}
    </main>
  );
}
