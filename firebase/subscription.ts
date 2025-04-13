import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { app } from "./firabase";

const db = getFirestore(app);

export interface Subscription {
  planId: string;
  orderId: string;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  endDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Get user's current subscription
export const getUserSubscription = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().subscription) {
      return userDoc.data().subscription as Subscription;
    }
    return null;
  } catch (error) {
    console.error("Error getting user subscription:", error);
    throw error;
  }
};

// Update user's subscription
export const updateUserSubscription = async (
  userId: string,
  subscription: Subscription
) => {
  try {
    const userRef = doc(db, "users", userId);

    // Add subscription history
    await addDoc(collection(db, "subscription_history"), {
      userId,
      ...subscription,
      createdAt: Timestamp.now(),
    });

    // Update user's current subscription
    await setDoc(
      userRef,
      {
        subscription: {
          ...subscription,
          updatedAt: Timestamp.now(),
        },
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

// Check if user has an active subscription
export const hasActiveSubscription = async (userId: string) => {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription) return false;

    // Check if subscription is active and not expired
    return (
      subscription.status === "active" &&
      new Date(subscription.endDate) > new Date()
    );
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
};

// Get subscription limits based on plan
export const getSubscriptionLimits = (planId: string | null) => {
  switch (planId) {
    case "basic":
      return {
        transcriptionMinutes: 30,
        articlesPerMonth: 5,
      };
    case "pro":
      return {
        transcriptionMinutes: 120,
        articlesPerMonth: 20,
      };
    case "premium":
      return {
        transcriptionMinutes: Number.POSITIVE_INFINITY,
        articlesPerMonth: Number.POSITIVE_INFINITY,
      };
    default:
      // Free tier or no subscription
      return {
        transcriptionMinutes: 5,
        articlesPerMonth: 1,
      };
  }
};

// Check if user has reached their usage limits
export const checkUsageLimits = async (
  userId: string,
  type: "transcription" | "article"
) => {
  try {
    // Get user's subscription
    const subscription = await getUserSubscription(userId);
    const limits = getSubscriptionLimits(subscription?.planId || null);

    // Get current month's usage
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayTimestamp = Timestamp.fromDate(firstDayOfMonth);

    const usageQuery = query(
      collection(db, "usage"),
      where("userId", "==", userId),
      where("type", "==", type),
      where("timestamp", ">=", firstDayTimestamp)
    );

    const querySnapshot = await getDocs(usageQuery);

    if (type === "transcription") {
      let totalMinutes = 0;
      querySnapshot.forEach((doc) => {
        totalMinutes += doc.data().durationInMinutes || 0;
      });

      return {
        used: totalMinutes,
        limit: limits.transcriptionMinutes,
        hasReachedLimit: totalMinutes >= limits.transcriptionMinutes,
      };
    } else {
      // Article generation
      const articleCount = querySnapshot.size;

      return {
        used: articleCount,
        limit: limits.articlesPerMonth,
        hasReachedLimit: articleCount >= limits.articlesPerMonth,
      };
    }
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return {
      used: 0,
      limit: 0,
      hasReachedLimit: true, // Default to true on error to prevent overuse
    };
  }
};
