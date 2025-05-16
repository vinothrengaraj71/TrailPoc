import React, { useEffect } from "react";
import { requestPermission, onMessageListener } from "./firebase";

function App() {
  useEffect(() => {
    requestPermission().then((token) => {
      if (token) {
        let accesstoken =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyVG9rZW4iOnsiZW1haWwiOiJyb3NobmkucmFqQGdtYWlsLmNvbSIsInVzZXJVdWlkIjoiNThlZGUyZTYtMTk2Mi00MGEwLThjZTEtYzRiOTM2MzU5ZTI0In0sImlhdCI6MTc0NzMwNDQ2NSwiZXhwIjoxNzQ3MzkwODY1fQ.bbQXVIrifOMfFU7ZskUiCAxOjR3cRv-mbCSqU_4k9nE";
        fetch(
          "https://schoolone-web-bff-proxy-2b7l7eeqeq-el.a.run.app/api/notification/fcmregister",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accesstoken}`,
            },
            body: JSON.stringify({
              userUuid: "a3a3d2f2-a2f6-4ad0-89a6-d881a0f8cb98",
              userAgent: "test", // or get from login/session
              fcmTokens: token,
              deviceType: "web",
              deviceInfo: "test",
              statusId: "1", // or get from login/session
            }),
          }
        );
      }
    });

    onMessageListener().then((payload) => {
      console.log("Message received in foreground: ", payload);
      alert(`${payload.notification.title}\n${payload.notification.body}`);
    });
  }, []);

  return (
    <div className="App">
      <h1>React + Firebase Cloud Messaging (FCM)</h1>
    </div>
  );
}

export default App;
