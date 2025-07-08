import React, { useState } from "react";
import AddPublisherModal from "./components/AddPublisherModal";
import "./MeetingScheduler.css";

const DUTIES = [
  "Entrance Attendant",
  "Auditorium Attendant",
  "A/V",
  "Zoom",
  "Microphone 1 & Stage",
  "Microphone 2",
];

const STUDENTS_ASSIGNMENTS = [
  "Bible Reading",
  "Student 1", "Assistant 1",
  "Student 2", "Assistant 2",
  "Student 3", "Assistant 3",
  "Student 4", "Assistant 4"
];


function prettyRole(name) {
  if (name === "Chairman") return "Chairman (Mid-week)";
  if (name === "WT Chairman") return "Chairman (Weekend)";
  return name;
}

export default function PublishersPage({
  ASSIGNMENTS,
  publisherGroups,
  publisherRoles,
  toggleRole,
  PUBLISHER_EXCLUDED_ASSIGNMENTS,
  unavailabilities,
  toggleUnavailability,
  addNewPublisher,
  onDeletePublisher,
  isEditable, // <-- Add this prop!
}) {
  const [expanded, setExpanded] = useState(null);
  const [dateInput, setDateInput] = useState({});
  const [showAddPublisherModal, setShowAddPublisherModal] = useState(false);

  const coreAssignments = ASSIGNMENTS.filter((a) => !DUTIES.includes(a));

  const assignmentsForGroup = (groupName) => {
  if (groupName === "Students") {
    return STUDENTS_ASSIGNMENTS;
  }
  return groupName === "Publishers"
    ? coreAssignments.filter(a => !PUBLISHER_EXCLUDED_ASSIGNMENTS.includes(a))
    : coreAssignments;
};

  const handleDelete = (publisher) => {
    if (
      window.confirm(
        `Are you sure you want to delete publisher "${publisher}"? This action cannot be undone.`
      )
    ) {
      onDeletePublisher(publisher);
      if (expanded === publisher) setExpanded(null);
    }
  };

  return (
    <main className="pub-main">
      <h2 className="pub-title">Publishers &amp; Roles</h2>

      {isEditable && (
        <button
          className="add-publisher-btn"
          onClick={() => setShowAddPublisherModal(true)}
        >
          + Add New Publisher
        </button>
      )}

      {publisherGroups.map((group) => (
        <section key={group.name} className="pub-group">
          <div className="pub-group-title">
            <span>{group.name}</span>
            <span className="group-count">{group.members.length}</span>
          </div>

          {group.members.map((publisher) => {
            const aList = assignmentsForGroup(group.name);
            const dList = DUTIES;

            const everyChecked = [...aList, ...dList].every(
              (role) => publisherRoles[publisher]?.[role]
            );
            const toggleAll = () => {
              [...aList, ...dList].forEach((role) => {
                const checked = !!publisherRoles[publisher]?.[role];
                if (everyChecked ? checked : !checked) {
                  toggleRole(publisher, role);
                }
              });
            };

            const addUnav = () => {
              const date = dateInput[publisher];
              if (date) {
                toggleUnavailability(publisher, date);
                setDateInput((prev) => ({ ...prev, [publisher]: "" }));
              }
            };
            const clearUnav = () =>
              (unavailabilities[publisher] || []).forEach((d) =>
                toggleUnavailability(publisher, d)
              );

            return (
              <div key={publisher} className="pub-accordion">
                <div
                  className="pub-accordion-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <button
                    className="pub-accordion-btn"
                    onClick={
                      isEditable
                        ? () =>
                            setExpanded((open) =>
                              open === publisher ? null : publisher
                            )
                        : undefined
                    }
                    aria-expanded={expanded === publisher}
                    disabled={!isEditable}
                    style={{
                      cursor: isEditable ? "pointer" : "not-allowed",
                      opacity: isEditable ? 1 : 0.7,
                    }}
                  >
                    {publisher}
                  </button>
                  {isEditable && (
                    <button
                      className="delete-publisher-btn"
                      onClick={() => handleDelete(publisher)}
                      title={`Delete ${publisher}`}
                      aria-label={`Delete ${publisher}`}
                    >
                      ×
                    </button>
                  )}
                </div>

                {expanded === publisher && isEditable && (
                  <div className="pub-accordion-content">
                    <h4 className="pub-subheading">Assignments</h4>
                    <button
                      className="select-all-btn"
                      type="button"
                      onClick={toggleAll}
                    >
                      {everyChecked ? "Deselect All" : "Select All"}
                    </button>
                    <div className="pub-checkbox-grid">
                      {aList.map((role) => (
                        <label key={role} className="pub-checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!publisherRoles[publisher]?.[role]}
                            onChange={() => toggleRole(publisher, role)}
                          />
                          {prettyRole(role)}
                        </label>
                      ))}
                    </div>

                    {group.name !== "Students" && (
  <>
    <h4 className="pub-subheading">Duties</h4>
    <div className="pub-checkbox-grid">
      {dList.map((duty) => (
        <label key={duty} className="pub-checkbox-label">
          <input
            type="checkbox"
            checked={!!publisherRoles[publisher]?.[duty]}
            onChange={() => toggleRole(publisher, duty)}
          />
          {duty}
        </label>
      ))}
    </div>
  </>
)}

                    <h4 className="pub-subheading">Unavailability</h4>
                    <div className="unav-controls">
                      <input
                        type="date"
                        value={dateInput[publisher] || ""}
                        onChange={(e) =>
                          setDateInput((prev) => ({
                            ...prev,
                            [publisher]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="select-all-btn"
                        style={{ marginLeft: "0.5rem" }}
                        onClick={addUnav}
                      >
                        Add
                      </button>
                      <button
                        className="select-all-btn"
                        style={{ marginLeft: "0.5rem", background: "#aaa" }}
                        onClick={clearUnav}
                      >
                        Clear All
                      </button>
                    </div>

                    {!(unavailabilities[publisher] || []).length ? (
                      <p style={{ fontSize: "0.85rem", color: "#666" }}>
                        (no dates added)
                      </p>
                    ) : (
                      <ul className="unav-list">
                        {unavailabilities[publisher].map((d) => (
                          <li key={d}>
                            {d}{" "}
                            <button
                              onClick={() =>
                                toggleUnavailability(publisher, d)
                              }
                              style={{
                                marginLeft: "0.4rem",
                                color: "#942926",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                              }}
                              title="Remove"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {isEditable && showAddPublisherModal && (
        <AddPublisherModal
          onClose={() => setShowAddPublisherModal(false)}
          onAddPublisher={addNewPublisher}
          publisherGroups={publisherGroups}
        />
      )}
    </main>
  );
}
