import { isFirebaseEnabled, auth } from "./firebase";
import { signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from "firebase/auth";

export interface GoogleSignInResult {
  ok: true;
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  accessToken?: string;
  refreshToken?: string;
}

export type SignInResult =
  | GoogleSignInResult
  | { ok: false; error: string };

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
// Request Google Drive access
provider.addScope('https://www.googleapis.com/auth/drive.file');

export async function signOutGoogle(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

export async function signInWithGoogle(): Promise<SignInResult> {
  if (!isFirebaseEnabled) {
    return { ok: false, error: "Firebase not configured" };
  }

  try {
    const result = await signInWithPopup(auth!, provider);
    const { uid, email, displayName, photoURL } = result.user;

    if (!email) {
      return { ok: false, error: "Google account has no email." };
    }

    // Get OAuth credential (includes access token for Google Drive)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    return {
      ok: true,
      uid,
      email,
      name: displayName ?? email,
      photoURL: photoURL ?? undefined,
      accessToken,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-in failed.";
    return { ok: false, error: message };
  }
}
