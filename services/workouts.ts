import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Workout } from "@/types";

const COL = "workouts";

function fromDoc(snap: any): Workout {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt:
      d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    updatedAt:
      d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(),
  } as Workout;
}

export async function getUserWorkouts(uid: string): Promise<Workout[]> {
  const q = query(collection(db, COL), where("uid", "==", uid));
  const snap = await getDocs(q);
  const results = snap.docs.map(fromDoc);
  return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getPublicWorkouts(limitCount = 30): Promise<Workout[]> {
  const q = query(
    collection(db, COL),
    where("isPublic", "==", true),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(fromDoc);
  return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return fromDoc(snap);
}

export async function createWorkout(
  uid: string,
  data: Omit<
    Workout,
    "id" | "uid" | "createdAt" | "updatedAt" | "likes" | "copies" | "version"
  >,
): Promise<Workout> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    uid,
    likes: [],
    copies: 0,
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return fromDoc(snap);
}

export async function updateWorkout(
  id: string,
  data: Partial<Workout>,
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteWorkout(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function likeWorkout(
  workoutId: string,
  uid: string,
  liked: boolean,
): Promise<void> {
  await updateDoc(doc(db, COL, workoutId), {
    likes: liked ? arrayUnion(uid) : arrayRemove(uid),
  });
}

export async function copyWorkout(
  workoutId: string,
  uid: string,
): Promise<Workout> {
  const original = await getWorkoutById(workoutId);
  if (!original) throw new Error("Workout not found");
  await updateDoc(doc(db, COL, workoutId), { copies: increment(1) });
  const { id, ...rest } = original;
  return createWorkout(uid, {
    ...rest,
    name: `${rest.name} (cópia)`,
    isPublic: false,
    isTemplate: false,
  });
}
