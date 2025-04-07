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

// Define cost constants (these are example rates, adjust as needed)
const TRANSCRIPTION_COST_PER_MINUTE = 0.006; // $0.006 per minute
const ARTICLE_GENERATION_COST_PER_TOKEN = 0.00001; // $0.00001 per token
const ESTIMATED_TOKENS_PER_ARTICLE = 2000; // Estimate 2000 tokens per article

// Track transcription usage
export const trackTranscriptionUsage = async (
  userId: string,
  durationInSeconds: number
) => {
  try {
    const durationInMinutes = durationInSeconds / 60;
    const cost = durationInMinutes * TRANSCRIPTION_COST_PER_MINUTE;

    // Add usage record
    await addDoc(collection(db, "usage"), {
      userId,
      type: "transcription",
      durationInMinutes,
      cost,
      timestamp: Timestamp.now(),
    });

    // Update user's total usage
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTranscriptionCost = userData.transcriptionCost || 0;
      const currentTotalCost = userData.totalCost || 0;

      await setDoc(
        userRef,
        {
          transcriptionCost: currentTranscriptionCost + cost,
          totalCost: currentTotalCost + cost,
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
    } else {
      await setDoc(
        userRef,
        {
          transcriptionCost: cost,
          totalCost: cost,
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
    }

    return cost;
  } catch (error) {
    console.error("Error tracking transcription usage:", error);
    return 0;
  }
};

// Track article generation usage
export const trackArticleGenerationUsage = async (userId: string) => {
  try {
    const cost =
      ESTIMATED_TOKENS_PER_ARTICLE * ARTICLE_GENERATION_COST_PER_TOKEN;

    // Add usage record
    await addDoc(collection(db, "usage"), {
      userId,
      type: "article",
      estimatedTokens: ESTIMATED_TOKENS_PER_ARTICLE,
      cost,
      timestamp: Timestamp.now(),
    });

    // Update user's total usage
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentArticleCost = userData.articleCost || 0;
      const currentTotalCost = userData.totalCost || 0;

      await setDoc(
        userRef,
        {
          articleCost: currentArticleCost + cost,
          totalCost: currentTotalCost + cost,
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
    } else {
      await setDoc(
        userRef,
        {
          articleCost: cost,
          totalCost: cost,
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
    }

    return cost;
  } catch (error) {
    console.error("Error tracking article generation usage:", error);
    return 0;
  }
};

// Get user's usage statistics
export const getUserUsageStats = async (userId: string) => {
  try {
    // Get user document for total costs
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    let totalStats = {
      transcriptionCost: 0,
      articleCost: 0,
      totalCost: 0,
      lastUpdated: null,
    };

    if (userDoc.exists()) {
      const userData = userDoc.data();
      totalStats = {
        transcriptionCost: userData.transcriptionCost || 0,
        articleCost: userData.articleCost || 0,
        totalCost: userData.totalCost || 0,
        lastUpdated: userData.lastUpdated,
      };
    }

    // Get current month's usage
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayTimestamp = Timestamp.fromDate(firstDayOfMonth);

    const usageQuery = query(
      collection(db, "usage"),
      where("userId", "==", userId),
      where("timestamp", ">=", firstDayTimestamp)
    );

    const querySnapshot = await getDocs(usageQuery);

    const currentMonthStats = {
      transcriptionCost: 0,
      transcriptionMinutes: 0,
      articleCost: 0,
      articleCount: 0,
      totalCost: 0,
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === "transcription") {
        currentMonthStats.transcriptionCost += data.cost;
        currentMonthStats.transcriptionMinutes += data.durationInMinutes;
        currentMonthStats.totalCost += data.cost;
      } else if (data.type === "article") {
        currentMonthStats.articleCost += data.cost;
        currentMonthStats.articleCount += 1;
        currentMonthStats.totalCost += data.cost;
      }
    });

    return {
      totalStats,
      currentMonthStats,
    };
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return {
      totalStats: {
        transcriptionCost: 0,
        articleCost: 0,
        totalCost: 0,
        lastUpdated: null,
      },
      currentMonthStats: {
        transcriptionCost: 0,
        transcriptionMinutes: 0,
        articleCost: 0,
        articleCount: 0,
        totalCost: 0,
      },
    };
  }
};
