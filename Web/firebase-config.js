// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeNFTMYiKVVtrnTQHZFb_-Uhh307CrEaU",
  authDomain: "temprocw.firebaseapp.com",
  projectId: "temprocw",
  storageBucket: "temprocw.firebasestorage.app",
  messagingSenderId: "537290462610",
  appId: "1:537290462610:web:0b653f682f4a177e9f1d4b",
  measurementId: "G-W6S0C56BZP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = firebase.auth();

// Initialize Firestore Database
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Whitelisted emails (only these emails can sign in)
const WHITELISTED_EMAILS = [
  "curiosityweekends@gmail.com",
  "salmanfarishassan4519@gmail.com",
  "jemshidkk@gmail.com",
  // Add more allowed emails here
];

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;
window.googleProvider = googleProvider;
window.WHITELISTED_EMAILS = WHITELISTED_EMAILS; 