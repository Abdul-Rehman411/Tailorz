import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const deleteNotification = async (user, notificationId) => {
  try {
    const notifDocRef = doc(
      db,
      "notifications",
      user,
      "userNotifications",
      notificationId
    );
    await deleteDoc(notifDocRef);
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};

export default deleteNotification;
