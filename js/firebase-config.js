// firebase-config.js
// Firebase Realtime Database - Public read/write mode for PoC
// Project: homesync-2205

const firebaseConfig = {
    apiKey: "AIzaSyALNJIPyvUQOK0bWmrzA53RCuij9rFY6xY",
    authDomain: "homesync-2205.firebaseapp.com",
    databaseURL: "https://homesync-2205-default-rtdb.firebaseio.com",
    projectId: "homesync-2205",
    storageBucket: "homesync-2205.firebasestorage.app",
    messagingSenderId: "403264507349",
    appId: "1:403264507349:web:e99bb53eb424209a06c15c"
};

// Initialize Firebase (v8 SDK)
try {
    firebase.initializeApp(firebaseConfig);
    console.log("HomeSync: Firebase initialized successfully.");
} catch (e) {
    // Already initialized (hot reload guard)
    console.warn("HomeSync: Firebase already initialized or config error.", e);
}
