// ────────────────  src/MeetingScheduler.jsx  ────────────────
import React from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

/* ---------- helpers ---------- */

/** Count how many times each publisher is assigned this week */
const buildCounts = sel =>
  Object.values(sel).reduce((m, p) => {
    if (!p) return m;
    m[p] = (m[p] || 0) + 1;
    return m;
  }, {});

/** Filter publishers by role for a given assignment key */
const getByRole = (P, roles, key) =>
  P.filter(pub => roles[pub]?.[key]);

/* ---------- data ---------- */

const APPLY_ASSIGNMENTS = [
  { key: "Student 1", label: "Student 1", asstKey: "Assistant 1", labelAsst: "Assistant 1" },
  { key: "Student 2", label: "Student 2", asstKey: "Assistant 2", labelAsst: "Assistant 2" },
  { key: "Student 3", label: "Student 3", asstKey: "Assistant 3", labelAsst: "Assistant 3" },
  { key: "Student 4", label: "Student 4", asstKey: "Assistant 4", labelAsst: "Assistant 4" },
];

const CLEANING_OPTIONS = ["Group 1", "Group 2", "Group 3", "Group 4"];

const SONG_NUMBERS = Array.from({ length: 161 }, (_, i) => String(i + 1));

const SECTIONS = [
  {
    title: "MEETING CHAIRMAN AND PRAYERS",
    shortTitle: "CHAIRMAN",
    color: "",
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

/* ---------- component ---------- */

export default function MeetingScheduler({
  dayLabel,               // e.g. "Wednesday, July 2"
  meetingDate,            // ISO date string "YYYY-MM-DD"
  PUBLISHERS,
  publisherRoles,
  selectedAssignments,
  onAssignmentChange,
  unavailabilities = {},
  lastAssigned = {},
  isEditable,
  layoutOverride = null,
}) {
  
  const counts = buildCounts(selectedAssignments);

  /* -------- free-text input row (Closing Prayer, Service Talk) -------- */
const TextInputRow = ({ id, placeholder }) => (
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

  /** Render one line in the dropdown, with badges for assignments & unavailability */
  const optionRow = (pub, { active, disabled }) => (
    <div
      className={
        "option-line" +
        (active ? " active" : "") +
        (disabled ? " disabled" : "")
      }
    >
      <span className="option-name">{pub}</span>
      {counts[pub] > 0 && (
        <span className="option-badge">
          {counts[pub]} assignment{counts[pub] > 1 ? "s" : ""}
        </span>
      )}
      {disabled && <span className="option-badge">unavailable</span>}
    </div>
  );

  /** Sort publishers by last assigned date for this assignment (oldest first), then alphabetically */
  function sortByLastAssigned(arr, lastAssignedObj, assignmentKey) {
    return arr.slice().sort((a, b) => {
      const dateA = lastAssignedObj[assignmentKey]?.[a] || "2000-01-01T00:00:00.000Z";
      const dateB = lastAssignedObj[assignmentKey]?.[b] || "2000-01-01T00:00:00.000Z";
      if (dateA === dateB) return a.localeCompare(b);
      return new Date(dateA) - new Date(dateB);
    });
  }

  /** Build and sort the list of options for a given assignment key */
  function renderOptions(key) {
    // 1 — start with publishers who have the correct role (fallback to everybody if no-one has that role)
    let byRole = getByRole(PUBLISHERS, publisherRoles, key);
    if (!byRole.length) byRole = PUBLISHERS.slice();

    // 2 — partition into three buckets
    const unavailable = byRole.filter(pub => Boolean(unavailabilities[pub]));
    const current = selectedAssignments[key];

    // Available = not unavailable, not currently selected, and not assigned this week
    const available = byRole.filter(
      pub =>
        !unavailable.includes(pub) &&
        (counts[pub] || 0) === 0 &&
        pub !== current
    );

    // Assigned = not unavailable, not currently selected, but assigned elsewhere this week
    const assigned = byRole.filter(
      pub =>
        !unavailable.includes(pub) &&
        (counts[pub] || 0) > 0 &&
        pub !== current
    );

    // 3 — sort each group by last assigned date (oldest first)
    const sortedAvailable = sortByLastAssigned(available, lastAssigned, key);
    const sortedAssigned = sortByLastAssigned(assigned, lastAssigned, key);
    const sortedUnavailable = sortByLastAssigned(unavailable, lastAssigned, key);

    // 4 — combine, inserting current selection at its group position if not already included
    let options = [
      ...sortedAvailable,
      ...sortedAssigned,
      ...sortedUnavailable,
    ];

    if (current && !options.includes(current)) {
      if (available.includes(current)) {
        options = [current, ...options];
      } else if (assigned.includes(current)) {
        options = [...sortedAvailable, current, ...sortedAssigned, ...sortedUnavailable];
      } else if (unavailable.includes(current)) {
        options = [...sortedAvailable, ...sortedAssigned, current, ...sortedUnavailable];
      }
      // Remove duplicates if any
      options = options.filter((v, i, arr) => arr.indexOf(v) === i);
    }

    // 5 — render
    return options.map(pub => (
      <Listbox.Option
        key={pub}
        value={pub}
        disabled={Boolean(unavailabilities[pub]) && pub !== current}
      >
        {state => optionRow(pub, state)}
      </Listbox.Option>
    ));
  }

  /** Custom select/dropdown component for an assignment ID */
  const Select = (id, isEditable) => {
  if (id === "Cleaning") {
    return (
      <Listbox
        value={selectedAssignments[id] || ""}
        onChange={v => onAssignmentChange(id, v)}
        disabled={!isEditable}
      >
        <div className="assignment">
          <Listbox.Button className={`assignment-button`}>
            <span className="assignment-label">{id}</span>
            <span className={`dropdown-value ${!selectedAssignments[id] ? "text-gray-400" : ""}`}>
              {selectedAssignments[id] || "Select option"}
            </span>
            {isEditable && <ChevronDownIcon className="h-4 w-4" />}
          </Listbox.Button>
          <Listbox.Options className="options-panel">
            <Listbox.Option value="">
              {({ active }) => (
                <div className={`option-line${active ? " active" : ""}`}>Select option</div>
              )}
            </Listbox.Option>
            {CLEANING_OPTIONS.map(item => (
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
  }

  return (
    <Listbox
      value={selectedAssignments[id] || ""}
      onChange={v => onAssignmentChange(id, v)}
      disabled={!isEditable}
    >
      <div className="relative">
        <Listbox.Button
          className={`assignment-button ${!isEditable ? "disabled" : ""}`}
        >
          <span className="assignment-label">{id}</span>
          <span
            className={
              "dropdown-value " +
              (!selectedAssignments[id] ? "text-gray-400" : "")
            }
          >
            {selectedAssignments[id] || "Select publisher"}
          </span>
          {isEditable && <ChevronDownIcon className="h-4 w-4" />}
        </Listbox.Button>

        <Listbox.Options className="options-panel">
          <Listbox.Option value="">
            {({ active }) => (
              <div className={"option-line" + (active ? " active" : "")}>
                Select publisher
              </div>
            )}
          </Listbox.Option>

          {renderOptions(id)}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};

  /* ======= build the section list, injecting special-week tweaks ======= */
  const isSpecial = Boolean(layoutOverride);    // true only for 14 – 20 Jul 2025

  // Deep-clone the static list so we can mutate safely
  const sections = JSON.parse(JSON.stringify(SECTIONS));

  if (isSpecial) {
    // 4-A  MEETING CHAIRMAN section tweaks
    const chairSec = sections.find(s => s.shortTitle === "CHAIRMAN");
    chairSec.assignments = [
      "Chairman",
      "Opening Prayer",
      { key: "Closing Prayer", type: "text" },
      { key: "Closing Song", type: "song" },
    ];

    // 4-B  LIVING AS CHRISTIANS section tweaks
    const lacSec = sections.find(s => s.shortTitle === "Living as Christians");
    lacSec.assignments = [
      "Part 1",
      "Part 2",
      { key: "Service Talk", type: "text" },   // ← free-text input
    ];
  }

  /* helper to render either a dropdown or a text input */
const renderRow = (item) => {
  const fieldKey = typeof item === "string" ? item : item.key;      // one name
  const type     = typeof item === "string" ? "dropdown" : item.type;

  return type === "dropdown"
    ? (
        <div key={fieldKey} className="assignment">
          {Select(fieldKey, isEditable)}
        </div>
      )
    : type === "song"
    ? <div key={fieldKey}>{ListSelectRow(fieldKey, SONG_NUMBERS, "Select song")}</div>
    : (
        <TextInputRow
          key={fieldKey}
          id={fieldKey}
          placeholder={`Enter ${fieldKey}`}
        />
      );
};

  return (
    <main className="content">
      <h2 className="day-title">{dayLabel}</h2>

      {sections.map((sec, i) => {
        if (sec.marker === "APPLY") {
          return (
            <div key={i} className="section beige">
              <h3 className="section-title">
                <span className="section-title-full">Apply Yourself to the Field Ministry</span>
                <span className="section-title-short">Field Ministry</span>
              </h3>

              {APPLY_ASSIGNMENTS.map(
                ({ key: studentKey, label: studentLabel, asstKey, labelAsst }, idx) => (
                  <div key={studentKey} className="apply-group">
                    {/* Student row */}
                    <div className="assignment">{Select(studentKey, isEditable)}</div>
                    {/* Assistant row */}
                    <div className="assignment">{Select(asstKey, isEditable)}</div>
                  </div>
                )
              )}
            </div>
          )
        }

        return (
          <div
            key={i}
            className={"section" + (sec.color ? " " + sec.color : "")}
          >
            <h3 className="section-title">
              <span className="section-title-full">{sec.title}</span>
              <span className="section-title-short">{sec.shortTitle}</span>
            </h3>
            {sec.assignments.map(renderRow)}
          </div>
        );
      })}

      <div className="section duties-section">
  <h3 className="section-title">Duties</h3>
  {DUTIES.map(d => (
    d === "Cleaning" ? (
      <React.Fragment key={d}>
        {Select(d, isEditable)}
      </React.Fragment>
    ) : (
      <div key={d} className="assignment">
        {Select(d, isEditable)}
      </div>
    )
  ))}
</div>

    </main>
  );
}
