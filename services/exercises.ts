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
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Exercise } from "@/types";

const COL = "exercises";

function fromDoc(snap: any): Exercise {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt:
      d.createdAt instanceof Timestamp
        ? d.createdAt.toDate()
        : new Date(d.createdAt ?? 0),
    updatedAt:
      d.updatedAt instanceof Timestamp
        ? d.updatedAt.toDate()
        : new Date(d.updatedAt ?? 0),
  } as Exercise;
}

// Simple query WITHOUT orderBy — avoids needing a composite index
export async function getUserExercises(uid: string): Promise<Exercise[]> {
  const q = query(collection(db, COL), where("uid", "==", uid));
  const snap = await getDocs(q);
  const results = snap.docs.map(fromDoc);
  // Sort client-side to avoid Firestore composite index requirement
  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPublicExercises(limitCount = 50): Promise<Exercise[]> {
  const q = query(
    collection(db, COL),
    where("isPublic", "==", true),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(fromDoc);
  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createExercise(
  uid: string,
  data: Omit<Exercise, "id" | "uid" | "createdAt" | "updatedAt">,
): Promise<Exercise> {
  // Strip undefined values — Firestore does not accept undefined fields
  const clean: Record<string, any> = { uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  Object.entries(data as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  const ref = await addDoc(collection(db, COL), clean);
  const snap = await getDoc(ref);
  return fromDoc(snap);
}

export async function updateExercise(
  id: string,
  data: Partial<Exercise>,
): Promise<void> {
  const clean: Record<string, any> = { updatedAt: serverTimestamp() };
  Object.entries(data as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  await updateDoc(doc(db, COL, id), clean);
}

export async function deleteExercise(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// Split into chunks of 490 to stay under Firestore's 500 ops/batch limit
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function importExercises(
  uid: string,
  exercises: Omit<Exercise, "id" | "uid" | "createdAt" | "updatedAt">[],
  mode: "add" | "replace",
): Promise<number> {
  // If replace mode, delete existing first
  if (mode === "replace") {
    const existing = await getUserExercises(uid);
    if (existing.length > 0) {
      const deleteChunks = chunkArray(existing, 490);
      for (const chunk of deleteChunks) {
        const batch = writeBatch(db);
        chunk.forEach((e) => batch.delete(doc(db, COL, e.id)));
        await batch.commit();
      }
    }
  }

  // Write in chunks of 490
  const insertChunks = chunkArray(exercises, 490);
  for (const chunk of insertChunks) {
    const batch = writeBatch(db);
    chunk.forEach((ex) => {
      const ref = doc(collection(db, COL));
      // Strip undefined values — Firestore does not accept undefined
      const clean: Record<string, any> = {
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      Object.entries(ex as Record<string, any>).forEach(([k, v]) => {
        if (v !== undefined) clean[k] = v;
      });
      batch.set(ref, clean);
    });
    await batch.commit();
  }

  return exercises.length;
}
