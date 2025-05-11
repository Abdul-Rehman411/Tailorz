import axios from "axios";
import { db } from "@/utils/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

const UpdateTailorRating = async ({
  message,
  stars,
  userId,
  tailorId,
  setStatusMessage,
}) => {
  try {
    // Step 1: Store the review in "tailor_reviews"
    const reviewData = {
      message,
      stars,
      tailor_id: tailorId,
      user_id: userId,
    };

    const reviewsRef = collection(db, "tailor_reviews");

    const q = query(
      reviewsRef,
      where("tailor_id", "==", tailorId),
      where("user_id", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setStatusMessage({
        type: "warning",
        message: "You have already given a review to this tailor",
      });
      return;
    }

    // Add the new review if no existing review is found
    await addDoc(reviewsRef, reviewData);

    // Step 2: Analyze sentiment score using API
    const options = {
      method: "GET",
      url: "https://twinword-sentiment-analysis.p.rapidapi.com/analyze/",
      params: {
        text: message,
      },
      headers: {
        "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
        "x-rapidapi-host": process.env.NEXT_PUBLIC_RAPIDAPI_HOST,
      },
    };

    const response = await axios.request(options);
    const sentimentScore = response.data.score;

    // Step 3: Update "tailors" collection
    const tailorRef = doc(db, "tailors", tailorId);
    const tailorSnapshot = await getDoc(tailorRef);

    if (tailorSnapshot.exists()) {
      const currentData = tailorSnapshot.data();
      const currentRating = currentData.rating || 0;
      const currentTotalRating = currentData.total_rating || 0;

      // Calculate updated values
      const updatedRating = currentRating + stars + sentimentScore;
      const updatedTotalRating = currentTotalRating + 6;

      // Update Firestore with the new values
      await updateDoc(tailorRef, {
        rating: updatedRating,
        total_rating: updatedTotalRating,
      });

      setStatusMessage({
        type: "success",
        message: "Review added successfully",
      });
    } else {
      throw new Error("Tailor document not found!");
    }
  } catch (error) {
    console.error("Error updating rating:", error);
    setStatusMessage({
      type: "danger",
      message: "Failed to add review",
    });
  }

  return;
};

export default UpdateTailorRating;
