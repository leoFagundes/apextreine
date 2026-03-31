import {
  doc, getDoc, getDocs, collection, query,
  where, updateDoc, arrayUnion, arrayRemove,
  serverTimestamp, limit, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { UserProfile } from '@/types';

function fromDoc(snap: any): UserProfile {
  const d = snap.data();
  return {
    ...d,
    uid: snap.id,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(),
    lastTrainedAt: d.lastTrainedAt instanceof Timestamp ? d.lastTrainedAt.toDate() : undefined,
  } as UserProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return fromDoc(snap);
}

export async function getPublicProfiles(limitCount = 20): Promise<UserProfile[]> {
  const q = query(
    collection(db, 'users'),
    where('isPublic', '==', true),
    orderBy('totalWorkouts', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(fromDoc);
}

export async function followUser(currentUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', currentUid), {
    following: arrayUnion(targetUid),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', targetUid), {
    followers: arrayUnion(currentUid),
    updatedAt: serverTimestamp(),
  });
}

export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', currentUid), {
    following: arrayRemove(targetUid),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', targetUid), {
    followers: arrayRemove(currentUid),
    updatedAt: serverTimestamp(),
  });
}

export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  // Basic search by displayName - in production use Algolia or similar
  const q = query(
    collection(db, 'users'),
    where('isPublic', '==', true),
    orderBy('displayName'),
    limit(20)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map(fromDoc);
  return all.filter(u =>
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
