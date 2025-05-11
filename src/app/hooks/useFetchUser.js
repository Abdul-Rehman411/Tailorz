import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { useEffect, useState } from "react";

const useFetchUser = (uid) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setUser(querySnapshot.docs[0].data());
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [uid]);

  return { user, loading };
};

export default useFetchUser;
