import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let db: any;
let auth: any;
let googleProvider: any;

try {
  console.log("Initializing Firebase with config:", firebaseConfig.projectId);
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Provide dummy objects or handle gracefully to prevent total app crash
  db = {};
  auth = { 
    onAuthStateChanged: (cb: any) => {
      console.warn("Using dummy auth observer");
      return () => {};
    },
    currentUser: null
  };
  googleProvider = {};
}

export { db, auth, googleProvider };

// Connection Test
async function testConnection() {
  if (!db || !db.type) return; // Skip if invalid
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
