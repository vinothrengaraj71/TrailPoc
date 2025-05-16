import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCjOgmnFe8tMRyRRu2oO1iuI_7i2Ow4kZs",
  authDomain: "schoolone-firebase.firebaseapp.com",
  projectId: "schoolone-firebase",
  storageBucket: "schoolone-firebase.firebasestorage.app",
  messagingSenderId: "377459185640",
  appId: "1:377459185640:web:29f8333a7065538f44365d",
  measurementId: "G-EP51VMJ95X",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to request permission and get FCM token
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BOXC-FBHsqR164wio7esp17ymS_-5ARjpG9QBI3S_WACWRdS2JMXHeDEWK4EHfWmcD8quxHHEOOvDaTRkeFaSAU", // we'll generate this soon
      });
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("Notification permission denied.");
    }
  } catch (err) {
    console.error("An error occurred while getting token:", err);
  }
};

// Listener for receiving messages when app is open
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
