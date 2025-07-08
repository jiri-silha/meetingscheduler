// ────────────────  src/WatchtowerScheduler.jsx  ────────────────
import React, { Fragment } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { THEMES } from "./constants/publicTalkThemes";

/* ───────── fixed lists ───────── */
const HOSPITALITY_OPTIONS = [
  "Group 1", "Group 2", "Group 3", "Group 4", "Hospitality is covered"
];
const SONG_NUMBERS = Array.from({ length: 161 }, (_, i) => String(i + 1));
const DUTIES = [
  "Cleaning", "Entrance Attendant", "Auditorium Attendant", "A/V", "Zoom", "Microphone 1 & Stage", "Microphone 2"
];
const CLEANING_OPTIONS = ["Group 1", "Group 2", "Group 3", "Group 4"];

/* ───────────────────────────────── component ───────────────────────────────── */
export default function WatchtowerScheduler({
  dayLabel,             // e.g. "Sunday, July 6"
  meetingDate,          // ISO "YYYY-MM-DD"
  PUBLISHERS,
  publisherRoles,
  selectedAssignments,
  onAssignmentChange,
  unavailabilities = {},
  lastAssigned = {},
  isEditable,
  layoutOverride = null,
}) {

  // 1. Count assignments ONLY for this weekend schedule
  const assignmentCounts = {};
  PUBLISHERS.forEach(pub => {
    assignmentCounts[pub] = Object.values(selectedAssignments).filter(
      assignedPub => assignedPub === pub
    ).length;
  });

  // 2. Helper: is this person unavailable on this meeting date
  const isUnavailable = pub => (unavailabilities[pub] || []).some(d => new Date(d).toISOString().slice(0, 10) === meetingDate); 

  // 3. Reusable row renderer for publisher options
  const optionRow = (pub, { active, disabled }) => (
    <div className={`option-line${active ? " active" : ""}${disabled ? " disabled" : ""}`}>
      <span className="option-name">{pub}</span>
      {assignmentCounts[pub] > 0 && (
        <span className="option-badge">
          {assignmentCounts[pub]} assignment{assignmentCounts[pub] > 1 ? "s" : ""}
        </span>
      )}
      {disabled && <span className="option-badge">unavailable</span>}
    </div>
  );

  // 4-A. Generic fixed-list dropdown (Song / Theme / Hospitality)
  const ListSelectRow = (key, LIST, placeholder, buttonClassName = "") => (
  <Listbox
    value={selectedAssignments[key] || ""}
    onChange={v => onAssignmentChange(key, v)}
    disabled={!isEditable}
  >
    <div className="assignment">
      <Listbox.Button className={`assignment-button ${buttonClassName}`}>
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
    </div>
  </Listbox>
);


  // 4-B. Publisher picker with role + availability logic
  const PublisherSelect = key => {
    const isChairmanAndPrayer = key === "Opening Prayer";

    // Hospitality handled separately
    if (key === "Hospitality") {
      return ListSelectRow(key, HOSPITALITY_OPTIONS, "Select option");
    }

    // Cleaning
    if (key === "Cleaning") {
      return ListSelectRow(key, CLEANING_OPTIONS, "Select option");
    }

    // Build eligible pool
    let pool;
    if (isChairmanAndPrayer) {
      pool = PUBLISHERS.filter(p => publisherRoles[p]?.["WT Chairman"]);
    } else {
      pool = PUBLISHERS.filter(p => publisherRoles[p]?.[key]);
      if (!pool.length) pool = PUBLISHERS.slice();
    }

    // Pull in anyone who is unavailable that day
    pool = Array.from(new Set([...pool, ...PUBLISHERS.filter(isUnavailable)]));

    // Partition pool into available, assigned, unavailable
    const unavailable = pool.filter(isUnavailable);
    const available = pool.filter(p => !unavailable.includes(p) && assignmentCounts[p] === 0);
    const assigned = pool.filter(p => !unavailable.includes(p) && assignmentCounts[p] > 0);

    // Sort by last assigned date for this assignment
    function sortByLastAssigned(arr) {
      return arr.slice().sort((a, b) => {
        const dateA = lastAssigned[key]?.[a] || "2000-01-01T00:00:00.000Z";
        const dateB = lastAssigned[key]?.[b] || "2000-01-01T00:00:00.000Z";
        if (dateA === dateB) return a.localeCompare(b);
        return new Date(dateA) - new Date(dateB);
      });
    }

    /* -------- free-text row (Speaker, Concluding Prayer, etc.) -------- */
const TextInputRow = (id, placeholder) => (
  <div className="assignment">
    <div className="assignment-button">
      <span className="assignment-label">{id}</span>
      <input
        type="text"
        className="text-input dropdown-value"
        placeholder={placeholder}
        value={selectedAssignments[id] || ""}
        onChange={e => onAssignmentChange(id, e.target.value)}
        disabled={!isEditable}
      />
    </div>
  </div>
);

    const sortedAvailable = sortByLastAssigned(available);
    const sortedAssigned = sortByLastAssigned(assigned);
    const sortedUnavailable = sortByLastAssigned(unavailable);

    let ordered = [
      ...sortedAvailable,
      ...sortedAssigned,
      ...sortedUnavailable,
    ];

    const current = selectedAssignments[key];

    // Ensure current selection is always visible
    if (current && !ordered.includes(current)) {
      ordered = [current, ...ordered];
    }

    const label = isChairmanAndPrayer ? "Chairman and Prayer" : key;

    return (
  <Listbox
    value={current || ""}
    onChange={v => onAssignmentChange(key, v)}
    disabled={!isEditable}  // disable when locked
  >
    <div className="assignment">
      <Listbox.Button className="assignment-button">
        <span className="assignment-label">{label}</span>
        <span className={`dropdown-value ${!current ? "text-gray-400" : ""}`}>
          {current || "Select publisher"}
        </span>
        {isEditable && <ChevronDownIcon className="h-4 w-4" />}
      </Listbox.Button>

      <Listbox.Options className="options-panel">
        <Listbox.Option value="">
          {({ active }) => (
            <div className={`option-line${active ? " active" : ""}`}>Select publisher</div>
          )}
        </Listbox.Option>

        {ordered.map(pub => (
          <Listbox.Option
            key={pub}
            value={pub}
            disabled={isUnavailable(pub) && pub !== current}
          >
            {({ active, selected, disabled }) => optionRow(pub, { active, disabled })}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </div>
  </Listbox>
);
  };

  // 5. Plain text inputs (Speaker, Congregation)
  const TextInputRow = (key, placeholder) => (
    <div className="assignment">
      <div className="assignment-button">
        <span className="assignment-label">{key}</span>
        <input
          type="text"
          className="text-input dropdown-value"
          placeholder={placeholder}
          value={selectedAssignments[key] || ""}
          onChange={e => onAssignmentChange(key, e.target.value)}
        />
        {/*<span style={{ width: "1rem" }} />*/} {/* keeps alignment with chevron */}
      </div>
    </div>
  );

  // 6. Render
  
  // ⬇︎ put this just ABOVE the return (<main…>) in WatchtowerScheduler
console.log("meetingDate:", meetingDate);
console.log("unavailabilities for week:", unavailabilities);
console.log(
  "publishers detected as unavailable for this meeting:",
  PUBLISHERS.filter(isUnavailable)
);
  
  /* ======= toggle layout if this is a “special” week ======= */
const isSpecial = Boolean(layoutOverride);   // → true for 14–20 Jul 2025
  
  return (
    <main className="content">
  <h2 className="day-title">{dayLabel}</h2>

  {isSpecial ? (
    /* ---------- SPECIAL WEEKEND LAYOUT (14–20 Jul 2025) ---------- */
    <>
      {/* CHAIRMAN */}
      <section className="section">
        <h3 className="section-title">Chairman</h3>
        {PublisherSelect("Chairman and Prayer")}
        {ListSelectRow("Opening Song", SONG_NUMBERS, "Select song")}
        {ListSelectRow("Concluding Song", SONG_NUMBERS, "Select song")}
        {TextInputRow("Concluding Prayer", "Name")}
      </section>

      {/* TALKS */}
      <section className="section public-talk">
        <h3 className="section-title">Talks</h3>
        {TextInputRow("Speaker", "Speaker name")}
        {TextInputRow("Public Talk", "Talk title")}
        {TextInputRow("Concluding Talk", "Talk title")}
      </section>

      {/* WATCHTOWER */}
      <section className="section watchtower">
        <h3 className="section-title">Watchtower Study</h3>
        {PublisherSelect("WT Conductor")}
      </section>

      {/* DUTIES (unchanged) */}
      <section className="section duties-section">
        <h3 className="section-title">Duties</h3>
        {DUTIES.map(d => (
          <Fragment key={d}>{PublisherSelect(d)}</Fragment>
        ))}
      </section>
    </>
  ) : (
    /* ---------- STANDARD WEEKEND LAYOUT (all other weeks) ---------- */
    <>
      {/* CHAIRMAN */}
      <section className="section">
        <h3 className="section-title">Chairman</h3>
        {PublisherSelect("Opening Prayer")}
        {ListSelectRow("Song", SONG_NUMBERS, "Select song")}
      </section>

      {/* PUBLIC TALK */}
      <section className="section public-talk">
        <h3 className="section-title">Public Talk</h3>
        {TextInputRow("Speaker", "Speaker name")}
        {TextInputRow("Congregation", "Congregation")}
        {ListSelectRow("Theme", THEMES, "Select theme", "theme")}
        {PublisherSelect("Hospitality")}
      </section>

      {/* WATCHTOWER STUDY */}
      <section className="section watchtower">
        <h3 className="section-title">Watchtower Study</h3>
        {PublisherSelect("WT Conductor")}
        {PublisherSelect("WT Reader")}
        {PublisherSelect("Closing Prayer")}
      </section>

      {/* DUTIES */}
      <section className="section duties-section">
        <h3 className="section-title">Duties</h3>
        {DUTIES.map(d => (
          <Fragment key={d}>{PublisherSelect(d)}</Fragment>
        ))}
      </section>
    </>
  )}
</main>
  );
}
