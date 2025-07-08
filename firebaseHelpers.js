// 🔹 src/firebaseHelpers.js
// Common utilities + Firestore helpers that the UI expects.

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/* ---------- date helpers ---------- */

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Safe week key → “YYYY-MM-DD” (always returns a valid string) */
export function weekKey(date) {
  const d =
    date instanceof Date && !isNaN(date) ? date : new Date(); // today fallback
  return d.toISOString().slice(0, 10);
}

/* ---------- Firestore helpers for schedules ---------- */

export async function saveSchedule(mondayKey, selectedAssignments) {
  await setDoc(doc(db, "schedules", mondayKey), {
    selectedAssignments,
    updated: Date.now(),
  });
}

export async function loadSchedule(mondayKey) {
  const snap = await getDoc(doc(db, "schedules", mondayKey));
  return snap.exists() ? snap.data().selectedAssignments || {} : {};
}

export async function saveSchedules(weekKey, mw, wt) {
  await setDoc(doc(db, "schedules", weekKey), { mw, wt, updated: Date.now() });
}

export async function loadSchedules(weekKey) {
  const snap = await getDoc(doc(db, "schedules", weekKey));
  if (!snap.exists()) return { mw: {}, wt: {} };
  const d = snap.data();
  if (!("mw" in d) && !("wt" in d))
    return { mw: d.selectedAssignments || {}, wt: {} };
  return { mw: d.mw || {}, wt: d.wt || {} };
}

/* ---------- Firestore helpers for publisher roles ---------- */

export async function savePublisherRoles(r) {
  await setDoc(doc(db, "roles", "publisherRolesV1"), { publisherRoles: r });
}

export async function loadPublisherRoles() {
  const s = await getDoc(doc(db, "roles", "publisherRolesV1"));
  return s.exists() ? s.data().publisherRoles || {} : {};
}

/* ---------- Firestore helpers for unavailabilities ---------- */

export async function saveUnavailabilities(u) {
  await setDoc(doc(db, "roles", "unavailabilitiesV1"), { unavailabilities: u });
}

export async function loadUnavailabilities() {
  const s = await getDoc(doc(db, "roles", "unavailabilitiesV1"));
  return s.exists() ? s.data().unavailabilities || {} : {};
}

/* ---------- Firestore helpers for lastAssigned ---------- */

export async function saveLastAssigned(data) {
  await setDoc(doc(db, "lastAssigned", "data"), data);
}

export async function loadLastAssigned() {
  const snap = await getDoc(doc(db, "lastAssigned", "data"));
  return snap.exists() ? snap.data() : {};
}

/* ---------- Publishers (with students support) ---------- */

/**
 * Save the lists of publishers, including students.
 * @param {Object} param0
 * @param {Array<string>} param0.elders
 * @param {Array<string>} param0.ministerialServants
 * @param {Array<string>} param0.students
 * @param {Array<string>} param0.allPublishers
 */
export async function savePublishersList({
  elders,
  ministerialServants,
  students = [],
  allPublishers,
}) {
  await setDoc(doc(db, "lists", "publishers"), {
    elders,
    ministerialServants,
    students,
    allPublishers,
    updated: Date.now(),
  });
}

/**
 * Load the lists of publishers, including students.
 * @returns {Promise<{elders: string[], ministerialServants: string[], students: string[], allPublishers: string[]}>}
 */
export async function loadPublishersList() {
  const snap = await getDoc(doc(db, "lists", "publishers"));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    elders: data.elders || [],
    ministerialServants: data.ministerialServants || [],
    students: data.students || [],
    allPublishers: data.allPublishers || [],
  };
}
