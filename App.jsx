import React, { useState, useEffect, useMemo } from "react";
import PasswordProtectedApp from "./components/PasswordProtectedApp";
import MeetingScheduler from "./MeetingScheduler";
import WatchtowerScheduler from "./WatchtowerScheduler";
import { getSpecialLayout } from "./specialWeeks";
import { isSpecialWeek } from "./specialWeeks";
import PublishersPage from "./PublishersPage";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import { DUTIES } from "./MeetingScheduler";

import {
  saveSchedules,
  loadSchedules,
  savePublisherRoles,
  loadPublisherRoles,
  saveUnavailabilities,
  loadUnavailabilities,
  saveLastAssigned,
  loadLastAssigned,
  weekKey,
  addDays,
  savePublishersList,
  loadPublishersList,
} from "./firebaseHelpers";

import { auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

import "./MeetingScheduler.css";

function ymdLocal(d) {
  return d.toLocaleDateString("en-CA");
}

const ELDERS_INITIAL = [
  "Ulrich, Ivan","Stika, Jiri","Hrubes, Lawrence","Pecha, Marek","Atherden, Wayne",
  "Silha, Jiri","Palenik, Daniel","Fillery, James","Kroc, Lukas","Warsow, Michael",
  "Krupka, Jaromir","Bohat, Robert","Osuoha, Jonathan","Ngongang, Morgan","Cupidon, Cliff",
];
const MINISTERIAL_SERVANTS_INITIAL = [
  "Kawara, Biology","Starenko, Lukas","Bisnan, Joey","Krecichwost, Eric",
];
const ALL_PUBLISHERS_INITIAL = [
  "Pecha, Marek","Atherden, Wayne","Ulrich, Ivan","Stika, Jiri","Fillery, James",
  "Kroc, Lukas","Bisnan, Joey","Elliott, Sue","Hrubes, Lawrence","Hrubes, Martina",
  "Chibale, Alex Chimanse","Karakurt, Mertcan","Kawara, Biology","Kawara, Merida",
  "Kawara, Nyaradzo","Naidoo, Chantel","Nesvadbova, Vladimira","Owusu-Yeboah Adwoa",
  "Owusu-Yeboah Solomon","Sobicka, Ondrej","Sobickova, Katerina","Stikova, Marcela",
  "Turek, Shirley","Ulrichova, Jasmine","Ulrichova, Meg","Vojacek, Jima",
  "Atherden, Leon","Atherden, Martina","Ayoub Glinsky, Rachelle","Bello, Samira",
  "Botnar, Kristyna","Botnar, Vladimir","Grimova Anastasia","Chlabicz, Pawel",
  "Kopcak, Jakub","Koutsky, Sharlaine","Kuzemkova, Sara","Mae, Johna",
  "Owoeye, Feyisao","Palenik, Daniel","Pechova, Veronika","Silha, Jiri",
  "Silhova, Nely","Schubert, Petra","Urban, Mate","Bartos, Pavel",
  "Bartosova, Bembe","Beverton, Romana","Carino, Russel","Dvorak Vukovicova, Nikolina",
  "Fillery, Petra","Hrubesova, Kamilla","Hrubesova, Madelen","Krecichwost Eric",
  "Krecichwost Layla","Krecichwost Tiffany","Kroc, Zuzana","Magdura, Jesriel",
  "Maniatakis, Jeanne","Maniatakis, Mathew","Sedlak, Petr","Sedlakova, Alexandra",
  "Smith, Lorna","Warsow, Michael","Krupka, Jaromir","Antignani, Roberto",
  "Bohat, Gabriela","Bohat, Robert","Emmett, Frank","Gomonit, Joy",
  "Kalu Samuel, Tenderly Nkeiru","Kalu, Samuel Anya","Kamara, Agnes","Kamara, James",
  "Kamara, Lisa","Lukhanina Anna","Lukhanina Svetlana","Nzamutuma, Anne Anitha",
  "Ray, Bryan Matthew","Starenko, Lukas","Syvous, Kateryna","Ubungen, Andrea",
  "Warsow, Jessy","Warsow, Noah","Weston, Mark","Weston, Veronika",
  "Wright, Monika","Wright, Noah","Osuoha, Jonathan","Ngongang, Morgan",
  "Cupidon, Cliff","Cupidon, Karin","Eybatoweru, Richard","Ibe, Jerry","Ibe, Lois",
  "James, Muriel","Ngongang, Lucresse","Opara, Chidinma Jennifer","Osuoha, Justina",
  "Owoeye, Olamide"
];

export const ASSIGNMENTS = [
  "Chairman","Opening Prayer","Treasures","Spiritual Gems","Bible Reading",
  "Student 1","Assistant 1","Student 2","Assistant 2","Student 3","Assistant 3","Student 4","Assistant 4",
  "Part 1","Part 2","CBS Conductor","CBS Reader","Closing Prayer",
  "WT Chairman","Public Talk","Hospitality","WT Conductor","WT Reader"
];
const PUBLISHER_EXCLUDED_ASSIGNMENTS = [
  "Chairman","Treasures","Part 1","Part 2","CBS Conductor","Spiritual Gems"
];

const ALL_ASSIGNMENTS = [...ASSIGNMENTS, ...DUTIES];

function getMonday(d=new Date()){
  const n = new Date(d);
  const day = n.getDay();
  n.setDate(n.getDate() - day + (day === 0 ? -6 : 1));
  n.setHours(0,0,0,0);
  return n;
}
function formatWeekRange(m){
  const opts = { month:"long", day:"numeric" };
  const e = addDays(m,6);
  return `${m.toLocaleDateString(undefined,opts)} – ${e.toLocaleDateString(undefined,opts)}`;
}
function getOldestDate() {
  return new Date(2000, 0, 1).toISOString();
}

function LoadingScreen() {
  return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <p className="loading-text">Fetching schedules…</p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const today = new Date().getDay();
  const initialPlannerTab = (today >= 0 && today <= 3) ? "lm" : "wt";

  const [activePage, setActivePage] = useState("planning");
  const [plannerTab, setPlannerTab] = useState(initialPlannerTab);
  const [currentMonday, setCurrentMonday] = useState(() => getMonday());

  // Monday-of-the-week the user is viewing
  const monday = useMemo(() => currentMonday, [currentMonday]);

  // Layout overrides for "special" weeks (e.g. 14 – 20 July 2025)
  const specialLayout = useMemo(() => getSpecialLayout(monday), //returns { midweek, weekend } or null
  [monday]);

  // Tuesday (offset 1) on special weeks, otherwise Wednesday (offset 2)
  const midOffset   = isSpecialWeek(currentMonday) ? 1 : 2;

  const midweekDate = ymdLocal(addDays(currentMonday, midOffset));
  const weekendDate = ymdLocal(addDays(currentMonday, 6));

  const midweekDay  = addDays(currentMonday, midOffset).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  });
  const weekendDay  = addDays(currentMonday, 6).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  });
  const weekLabel   = formatWeekRange(currentMonday);

  const [elders, setElders] = useState(ELDERS_INITIAL);
  const [ministerialServants, setMinisterialServants] = useState(MINISTERIAL_SERVANTS_INITIAL);
  const [publishersList, setPublishersList] = useState(ALL_PUBLISHERS_INITIAL);

  // *** NEW STATE FOR STUDENTS ***
  const [students, setStudents] = useState([]);

  const PUBLISHERS = publishersList.slice().sort((a,b)=>a.localeCompare(b));

  // *** UPDATED GROUPS INCLUDING STUDENTS ***
  const publisherGroups = [
    { name: "Elders", members: elders.slice().sort() },
    { name: "Ministerial Servants", members: ministerialServants.slice().sort() },
    { name: "Publishers", members: PUBLISHERS.filter(p => !elders.includes(p) && !ministerialServants.includes(p) && !students.includes(p)) },
  ];

  if (isEditable && students.length > 0) {
    publisherGroups.push({ name: "Students", members: students.slice().sort() });
  }

  const onDeletePublisher = async (name) => {
    setElders((prev) => prev.filter((p) => p !== name));
    setMinisterialServants((prev) => prev.filter((p) => p !== name));
    setPublishersList((prev) => prev.filter((p) => p !== name));
    setStudents((prev) => prev.filter((p) => p !== name)); // *** REMOVE FROM STUDENTS ***

    setPublisherRoles((prev) => {
      const { [name]: _, ...rest } = prev;
      savePublisherRoles(rest);
      return rest;
    });

    setRawUnavailabilities((prev) => {
      const { [name]: _, ...rest } = prev;
      saveUnavailabilities(rest);
      return rest;
    });

    await savePublishersList({
      elders: elders.filter((p) => p !== name),
      ministerialServants: ministerialServants.filter((p) => p !== name),
      students: students.filter((p) => p !== name), // *** INCLUDE STUDENTS ***
      allPublishers: publishersList.filter((p) => p !== name),
    });
  };

  const [selectedMW, setSelectedMW] = useState({});
  const [selectedWT, setSelectedWT] = useState({});
  const [publisherRoles, setPublisherRoles] = useState(() => {
    const init = {};
    PUBLISHERS.forEach(p => {
      init[p] = {};
      ASSIGNMENTS.forEach(a => init[p][a] = false);
    });
    return init;
  });
  const [rawUnavailabilities, setRawUnavailabilities] = useState({});
  const [weeklyUnavailabilities, setWeeklyUnavailabilities] = useState({});
  const [lastAssigned, setLastAssigned] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsEditable(true);
      } else {
        setUser(null);
        setIsEditable(false);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    (async () => {
      const storedLists = await loadPublishersList();
      if (storedLists) {
        setElders(storedLists.elders || ELDERS_INITIAL);
        setMinisterialServants(storedLists.ministerialServants || MINISTERIAL_SERVANTS_INITIAL);
        setPublishersList(storedLists.allPublishers || ALL_PUBLISHERS_INITIAL);
        setStudents(storedLists.students || []); // *** LOAD STUDENTS ***
      }
      const raw = await loadUnavailabilities();
      setRawUnavailabilities(raw || {});
    })();
  }, []);

  useEffect(() => {
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      ymdLocal(addDays(currentMonday, i))
    );
    const filtered = {};
    Object.entries(rawUnavailabilities).forEach(([pub, dates]) => {
      if (Array.isArray(dates)) {
        const hits = dates.filter(d => weekDates.includes(d));
        if (hits.length) filtered[pub] = hits;
      }
    });
    setWeeklyUnavailabilities(filtered);
  }, [currentMonday, rawUnavailabilities]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const { mw, wt } = await loadSchedules(weekKey(currentMonday));
      const roles = await loadPublisherRoles();
      const lastAssignedData = await loadLastAssigned();

      if (dead) return;
      setSelectedMW(mw);
      setSelectedWT(wt);
      if (Object.keys(roles).length) setPublisherRoles(roles);
      if (lastAssignedData && Object.keys(lastAssignedData).length)
        setLastAssigned(lastAssignedData);
      setLoading(false);
    })();
    return () => { dead = true; };
  }, [currentMonday]);

  const saveCurrentWeek = async () => {
    setIsSaving(true);
    try {
      const prevSchedules = await loadSchedules(weekKey(currentMonday));
      const prevMW = prevSchedules.mw || {};
      const prevWT = prevSchedules.wt || {};
      const prevLastAssigned = await loadLastAssigned();

      await saveSchedules(weekKey(currentMonday), selectedMW, selectedWT);

      const updatedLastAssigned = { ...prevLastAssigned };

      // Combine all assignments including duties
      const allAssignments = { ...selectedMW, ...selectedWT };

      // Make sure prevAllAssignments is declared BEFORE usage
      const prevAllAssignments = { ...prevMW, ...prevWT };

      const assignedDate = currentMonday.toISOString();

      ALL_ASSIGNMENTS.forEach(assignment => {
        if (!updatedLastAssigned[assignment]) updatedLastAssigned[assignment] = {};

        const prevPublisher = prevAllAssignments[assignment];
        const currentPublisher = allAssignments[assignment];

        if (prevPublisher && !currentPublisher) {
          updatedLastAssigned[assignment][prevPublisher] = getOldestDate();
        }

        if (currentPublisher && currentPublisher !== prevPublisher) {
          const prevDate = updatedLastAssigned[assignment][currentPublisher];
          if (!prevDate || new Date(prevDate) < new Date(assignedDate)) {
            updatedLastAssigned[assignment][currentPublisher] = assignedDate;
          }
        }
      });

      setLastAssigned(updatedLastAssigned);
      await saveLastAssigned(updatedLastAssigned);

      alert("Schedule saved!");
    } finally {
      setIsSaving(false);
    }
  };

  const goPrev = () => setCurrentMonday(m => addDays(m, -7));
  const goNext = () => setCurrentMonday(m => addDays(m, 7));
  const changeMW = (key, pub) => {
    setSelectedMW(prev => {
      const updatedMW = { ...prev, [key]: pub };

      // If the changed key is "Cleaning", update Weekend cleaning accordingly
      if (key === "Cleaning") {
        setSelectedWT(prevWT => {
          // Only update Weekend cleaning if empty or matches previous MW cleaning
          if (!prevWT["Cleaning"] || prevWT["Cleaning"] === prev[key]) {
            return { ...prevWT, Cleaning: pub };
          }
          return prevWT; // Keep manual override if different
        });
      }

      return updatedMW;
    });
  };

  const changeWT = (key, pub) => setSelectedWT(prev => ({ ...prev, [key]: pub }));

  const toggleRole = (pub, role) => {
    setPublisherRoles(prev => {
      const upd = { ...prev, [pub]: { ...prev[pub], [role]: !prev[pub][role] } };
      savePublisherRoles(upd);
      return upd;
    });
  };

  const toggleUnavailable = (pub, date) => {
    setRawUnavailabilities(prev => {
      const list = prev[pub] || [];
      const next = list.includes(date) ? list.filter(d => d !== date) : [...list, date];
      const upd = { ...prev, [pub]: next };
      saveUnavailabilities(upd);
      return upd;
    });
  };

  const addNewPublisher = async (name, groupName) => {
    if (groupName === "Elders") {
      setElders(prev => [...prev, name].sort());
    } else if (groupName === "Ministerial Servants") {
      setMinisterialServants(prev => [...prev, name].sort());
    } else if (groupName === "Students") {
      setStudents(prev => [...prev, name].sort());
    }
    const updatedAllPublishers = [...publishersList, name].sort();
    setPublishersList(updatedAllPublishers);

    setPublisherRoles(prev => {
      const newPublisherRoles = {};
      ASSIGNMENTS.forEach(a => newPublisherRoles[a] = false);
      const updatedRoles = { ...prev, [name]: newPublisherRoles };
      savePublisherRoles(updatedRoles);
      return updatedRoles;
    });

    await savePublishersList({
      elders: groupName === "Elders" ? [...elders, name] : elders,
      ministerialServants: groupName === "Ministerial Servants" ? [...ministerialServants, name] : ministerialServants,
      students: groupName === "Students" ? [...students, name] : students,
      allPublishers: updatedAllPublishers
    });
  };

  const DUMMY_EMAIL = "user@yourapp.com";

  const handleLogin = async (password) => {
    try {
      await signInWithEmailAndPassword(auth, DUMMY_EMAIL, password);
      setShowLoginModal(false);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (authLoading || loading) return <LoadingScreen />;

  return (
    <PasswordProtectedApp>
    <div className="page-wrapper">
      <Header
        activePage={activePage}
        plannerTab={plannerTab}
        setPlannerTab={setPlannerTab}
        goPrev={goPrev}
        goNext={goNext}
        weekLabel={weekLabel}
        totalPublishers={PUBLISHERS.length - students.length}
        setActivePage={setActivePage}
        isEditable={isEditable}
        onLoginClick={() => setShowLoginModal(true)}
        onLogoutClick={handleLogout}
      />

      {showLoginModal && !user && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSubmit={handleLogin}
        />
      )}

      <div className="content">
        {activePage === "planning" ? (
          plannerTab === "lm" ? (
            <MeetingScheduler
              monday={monday}
              layoutOverride={specialLayout?.midweek}
              weekLabel={weekLabel}
              currentMonday={currentMonday}
              goToPrevWeek={goPrev}
              goToNextWeek={goNext}
              PUBLISHERS={PUBLISHERS}
              publisherRoles={publisherRoles}
              selectedAssignments={selectedMW}
              onAssignmentChange={changeMW}
              unavailabilities={weeklyUnavailabilities}
              lastAssigned={lastAssigned}
              dayLabel={midweekDay}
              meetingDate={midweekDate}
              isEditable={isEditable}
            />
          ) : (
            <WatchtowerScheduler
              monday={monday}
              layoutOverride={specialLayout?.weekend}
              weekLabel={weekLabel}
              currentMonday={currentMonday}
              goToPrevWeek={goPrev}
              goToNextWeek={goNext}
              PUBLISHERS={PUBLISHERS}
              publisherRoles={publisherRoles}
              selectedAssignments={selectedWT}
              onAssignmentChange={changeWT}
              unavailabilities={weeklyUnavailabilities}
              lastAssigned={lastAssigned}
              dayLabel={weekendDay}
              meetingDate={weekendDate}
              isEditable={isEditable}
            />
          )
        ) : (
          <PublishersPage
            ASSIGNMENTS={ASSIGNMENTS}
            publisherGroups={publisherGroups}
            publisherRoles={publisherRoles}
            toggleRole={toggleRole}
            PUBLISHER_EXCLUDED_ASSIGNMENTS={PUBLISHER_EXCLUDED_ASSIGNMENTS}
            unavailabilities={rawUnavailabilities}
            toggleUnavailability={toggleUnavailable}
            addNewPublisher={addNewPublisher}
            onDeletePublisher={onDeletePublisher}
            isEditable={isEditable}
          />
        )}
        {activePage === "planning" && isEditable && (
          <button
            className="save-button"
            onClick={saveCurrentWeek}
            disabled={isSaving}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isSaving ? "Saving..." : "Save Schedule"}
          </button>
        )}
      </div>

      <nav className="bottom-tab-bar">
        <button
          className={activePage === "planning" ? "active" : undefined}
          onClick={() => setActivePage("planning")}
        >
          Meetings
        </button>
        <button
          className={activePage === "publishers" ? "active" : undefined}
          onClick={() => setActivePage("publishers")}
        >
          Congregation
        </button>
      </nav>
    </div>
    </PasswordProtectedApp>
  );
}
