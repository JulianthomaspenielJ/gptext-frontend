importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBFLihwSkSkDMj1wnil4tYg3tTiKKsMdhk",
  authDomain: "gp-textiles.firebaseapp.com",
  projectId: "gp-textiles",
  messagingSenderId: "565581833068",
  appId: "1:565581833068:web:d78180f186cf616d05c949",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received", payload);

  self.registration.showNotification(payload.data.title, {
    body: payload.data.body,
    icon: "/logo192.png",
  });
});
