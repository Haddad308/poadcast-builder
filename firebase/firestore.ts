import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "./firabase";

const db = getFirestore(app);

// Save API key to Firestore
export const saveApiKey = async (userId: string, apiKey: string) => {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        huggingfaceApiKey: apiKey,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error saving API key:", error);
    throw error;
  }
};

// Get API key from Firestore
export const getApiKey = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().huggingfaceApiKey;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting API key:", error);
    throw error;
  }
};
