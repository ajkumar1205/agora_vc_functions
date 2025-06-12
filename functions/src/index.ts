import {onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import {RtcTokenBuilder, RtcRole} from "agora-token";
import { defineSecret } from "firebase-functions/params";


admin.initializeApp();

const APP_ID = defineSecret("APP_ID");
const APP_CERTIFICATE = defineSecret("APP_CERTIFICATE");

// Callable Function to Generate Agora Token
export const generateAgoraToken = onCall({
  secrets: [APP_ID, APP_CERTIFICATE]
}, async (request) => {
  if (!request.auth) {
    throw new Error("The function must be called while authenticated.");
  }

  const channelName = request.data.channelName;
  const uid: string = request.auth.uid;

  if (!channelName) {
    throw new Error("Missing channelName.");
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID.value(),
      APP_CERTIFICATE.value(),
      channelName,
      uid,
      role,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );
    return {token};
  } catch (error) {
    console.error("Error generating Agora token:", error);
    throw new Error("Could not generate Agora token.");
  }
});

// Firestore Trigger to Send FCM Notification
interface CallData {
    callerId: string;
    receiverId: string;
    channelName: string;
}

interface UserData {
    name: string;
    fcmToken: string;
}

export const sendCallNotification = onDocumentCreated("calls/{callId}", async (event) => {
  const callData = event.data?.data() as CallData;
  if (!callData) return console.error("No call data found");

  const {callerId, receiverId} = callData;

  const callerDoc = await admin.firestore().collection("users").where("uid", "==", callerId).limit(1).get();
  const receiverDoc = await admin.firestore().collection("users").where("uid", "==", receiverId).limit(1).get();

  if (receiverDoc.size < 1) {
    return console.error("Receiver not found");
  }

  const callerData = callerDoc.docs[0].data() as UserData;
  const receiverData = receiverDoc.docs[0].data() as UserData;

  const payload: admin.messaging.TokenMessage = {
    notification: {
      title: `Incoming Call from ${callerData.name}`,
      body: "Tap to answer.",
    },
    data: {
      channelName: callData.channelName,
      caller: JSON.stringify(callerDoc.docs[0].data()),
    },
    token: receiverData.fcmToken,
  };

  try {
    await admin.messaging().send(payload);
    console.log(`Notification sent to ${receiverId}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
});
