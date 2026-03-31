import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { WorkoutSession, BodyMetric, PersonalRecord } from "@/types";
import { checkAndAwardBadges } from "./gamification";

// ─── Sessions ────────────────────────────────────────────────────────────────

function sessionFromDoc(snap: any): WorkoutSession {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    startedAt:
      d.startedAt instanceof Timestamp ? d.startedAt.toDate() : new Date(),
    finishedAt:
      d.finishedAt instanceof Timestamp ? d.finishedAt.toDate() : undefined,
  } as WorkoutSession;
}

export async function saveSession(
  uid: string,
  session: Omit<WorkoutSession, "id">,
): Promise<string> {
  // 1. Save the session document
  const ref = await addDoc(collection(db, "sessions"), {
    ...session,
    workout: null,
    uid,
    startedAt: serverTimestamp(),
    finishedAt: serverTimestamp(),
  });

  // 2. Read current user profile to get up-to-date stats for badge checking
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() ?? {};

  const prevTotalWorkouts: number = userData.totalWorkouts ?? 0;
  const existingBadgeIds: string[] = (userData.badges ?? []).map((b: any) => b.id);

  // 3. Calculate new streak based on lastTrainedAt date
  const lastTrainedAt: Date | null =
    userData.lastTrainedAt instanceof Timestamp
      ? userData.lastTrainedAt.toDate()
      : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak: number = userData.streak ?? 0;
  if (!lastTrainedAt) {
    newStreak = 1;
  } else {
    const lastDay = new Date(lastTrainedAt);
    lastDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86400000);
    if (diffDays === 0) {
      // Already trained today — keep streak
    } else if (diffDays === 1) {
      newStreak = (userData.streak ?? 0) + 1;
    } else {
      // Broke the streak
      newStreak = 1;
    }
  }

  const newTotalWorkouts = prevTotalWorkouts + 1;

  // 4. Update user stats
  await updateDoc(userRef, {
    totalWorkouts: increment(1),
    totalMinutes: increment(Math.round((session.durationSeconds ?? 0) / 60)),
    xp: increment(session.xpEarned ?? 0),
    streak: newStreak,
    longestStreak: newStreak > (userData.longestStreak ?? 0) ? newStreak : (userData.longestStreak ?? 0),
    lastTrainedAt: serverTimestamp(),
  });

  // 5. Check and award badges
  const fullSession = { ...session, id: ref.id } as WorkoutSession;
  await checkAndAwardBadges(uid, newTotalWorkouts, newStreak, fullSession, existingBadgeIds);

  return ref.id;
}

export async function getUserSessions(
  uid: string,
  limitCount = 20,
): Promise<WorkoutSession[]> {
  // Simple query without orderBy to avoid index requirement
  const q = query(
    collection(db, "sessions"),
    where("uid", "==", uid),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(sessionFromDoc);
  // Sort client-side
  return results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

export async function getWeeklySessionCount(uid: string): Promise<number> {
  const q = query(collection(db, "sessions"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return snap.docs.filter((d) => {
    const data = d.data();
    const date =
      data.startedAt instanceof Timestamp
        ? data.startedAt.toDate()
        : new Date(0);
    return date >= weekAgo;
  }).length;
}


// ─── Body Metrics ─────────────────────────────────────────────────────────────

export async function saveBodyMetric(
  uid: string,
  metric: Omit<BodyMetric, "id" | "uid">,
): Promise<void> {
  await addDoc(collection(db, "metrics"), {
    ...metric,
    uid,
    date: serverTimestamp(),
  });
}

export async function getUserMetrics(
  uid: string,
  limitCount = 30,
): Promise<BodyMetric[]> {
  const q = query(
    collection(db, "metrics"),
    where("uid", "==", uid),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((s) => {
    const d = s.data();
    return {
      ...d,
      id: s.id,
      uid,
      date: d.date instanceof Timestamp ? d.date.toDate() : new Date(),
    } as BodyMetric;
  });
  return results.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ─── Personal Records ─────────────────────────────────────────────────────────

export async function updatePersonalRecord(
  uid: string,
  pr: PersonalRecord,
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    personalRecords: arrayUnion(pr),
  });
}
