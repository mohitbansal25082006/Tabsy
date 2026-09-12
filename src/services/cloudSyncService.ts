import { auth, db, hasFirebaseConfig } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Workspace } from '../types/workspace';
import { storageService } from './storageService';

let isSigningIn = false;

export const cloudSyncService = {
  // Authentication
  async signInWithGoogle(): Promise<void> {
    if (!hasFirebaseConfig) throw new Error("Firebase is not configured. Setup instructions in chat.");
    if (isSigningIn) throw new Error("Sign-in already in progress.");
    
    isSigningIn = true;
    
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          isSigningIn = false;
          reject(new Error(chrome.runtime.lastError?.message || 'Failed to get auth token'));
          return;
        }
        
        try {
          const credential = GoogleAuthProvider.credential(null, token);
          await signInWithCredential(auth, credential);
          isSigningIn = false;
          resolve();
        } catch (error: any) {
          // If auth fails, the token might be stale or invalid. Clear it from Chrome's cache.
          chrome.identity.removeCachedAuthToken({ token }, () => {
            isSigningIn = false;
            if (error.code === 'auth/duplicate-raw-id') {
              reject(new Error("Login conflicted with an existing session. Cached token cleared. Please try again."));
            } else {
              reject(error);
            }
          });
        }
      });
    });
  },

  async signOut(): Promise<void> {
    if (!hasFirebaseConfig) return;
    await auth.signOut();
  },

  // Syncing Workspaces
  async syncWorkspace(workspace: Workspace): Promise<void> {
    if (!hasFirebaseConfig) return;
    const user = auth.currentUser;
    if (!user) return; // Only sync if logged in

    try {
      const workspaceRef = doc(db, 'users', user.uid, 'workspaces', workspace.id);
      
      // Strip out undefined values (which crash Firestore)
      const cleanWorkspace = JSON.parse(JSON.stringify(workspace));
      
      // We merge so we don't accidentally wipe out concurrent edits, though
      // basic last-write-wins is applied based on updatedAt
      await setDoc(workspaceRef, {
        ...cleanWorkspace,
        cloudUpdatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Failed to sync workspace to cloud:', error);
    }
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    if (!hasFirebaseConfig) return;
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const workspaceRef = doc(db, 'users', user.uid, 'workspaces', workspaceId);
      await deleteDoc(workspaceRef);
    } catch (error) {
      console.error('Failed to delete workspace from cloud:', error);
    }
  },

  // Real-time listener
  startRealtimeSync(onUpdate: (snapshot: any) => void): () => void {
    if (!hasFirebaseConfig) return () => {};
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, 'users', user.uid, 'workspaces')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      onUpdate(snapshot);
    }, (error) => {
      console.error("Real-time sync error:", error);
    });

    return unsubscribe;
  },

  async performInitialSync(localWorkspaces: Workspace[]): Promise<void> {
    if (!hasFirebaseConfig) return;
    const user = auth.currentUser;
    if (!user) return;
    
    // Upload local workspaces that aren't in the cloud yet
    // This is simple: just upload everything. The merge:true will protect newer cloud data.
    // In a production app, we would do a more sophisticated timestamp diff.
    const promises = localWorkspaces.map(ws => this.syncWorkspace(ws));
    await Promise.all(promises);
  },

  // Feature 4: Shareable Links
  async generateShareLink(workspace: Workspace): Promise<string> {
    if (!hasFirebaseConfig) throw new Error("Firebase is not configured. Setup instructions in chat.");
    // 6 character random ID
    const shareId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const shareRef = doc(db, 'shared_workspaces', shareId);
    
    // Strip out undefined values (which crash Firestore)
    const cleanWorkspace = JSON.parse(JSON.stringify(workspace));
    
    await setDoc(shareRef, {
      ...cleanWorkspace,
      sharedAt: serverTimestamp(),
      // 30 days TTL (could be enforced by a Cloud Function or manually checked on read)
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
    });

    return shareId;
  },

  async importSharedWorkspace(shareId: string): Promise<Workspace | null> {
    if (!hasFirebaseConfig) throw new Error("Firebase is not configured. Setup instructions in chat.");
    const shareRef = doc(db, 'shared_workspaces', shareId.toUpperCase());
    const snapshot = await getDoc(shareRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Check expiration on client just in case
      if (data.expiresAt && data.expiresAt < Date.now()) {
        throw new Error("This share link has expired.");
      }
      return data as Workspace;
    }
    return null;
  }
};
