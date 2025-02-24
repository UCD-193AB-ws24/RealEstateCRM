import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQA2WAXjgYjK9tz64SZdUnZeRM-oFimm4",
  authDomain: "est8-24877.firebaseapp.com",
  projectId: "est8-24877",
  storageBucket: "est8-24877.firebasestorage.app",
  messagingSenderId: "958630409521",
  appId: "1:958630409521:web:f13f93242dcf7a8db8ec10",
  measurementId: "G-71PTX989RR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);