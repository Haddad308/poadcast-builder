import { Dispatch, SetStateAction } from "react";
import { db } from "./firabase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

export default async function isUsed(
  email: string,
  setEmailError: Dispatch<SetStateAction<string>>
) {
  if (!email) {
    setEmailError("Email is required");
    return true;
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setEmailError("Invalid email format");
    return true;
  }

  try {
    const mediaQuery = query(
      collection(db, "emails"),
      where("email", "==", email.toLowerCase()) // Convert to lowercase for consistency
    );

    const querySnapshot = await getDocs(mediaQuery);
    const exists = !querySnapshot.empty;

    if (!exists) {
      await addDoc(collection(db, "emails"), {
        email: email.toLowerCase(), // Store email in lowercase
        isUsed: true,
        createdAt: new Date(),
      });
    } else {
      setEmailError("Email is already in use");
    }

    return exists ? true : false;
  } catch (error) {
    console.error("Error checking email:", error);
    return "Error checking email";
  }
}
