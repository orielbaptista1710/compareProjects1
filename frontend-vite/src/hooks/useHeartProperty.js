//frontend-vite/src/hooks/useHeartProperty.js
import { useMemo, useCallback, useContext } from "react";
// import { toast } from "react-toastify";
import { CustomerActivityContext } from "../contexts/CustomerActivityContext";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
 
function useHeartProperty(propertyId) {
  const { heartedIds, toggleHeart } = useContext(CustomerActivityContext);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // derive saved state globally  — heartedIds is always the full, unpopulated
  // list (not paginated like heartProperties), so this is accurate regardless
  // of which page of the Shortlist tab happens to be loaded.
  const isSaved = useMemo(() => {
    if (!propertyId) return false;

    return heartedIds.includes(propertyId.toString());
  }, [heartedIds, propertyId]);

  // unified toggle
  const handleToggleHeart = useCallback(async () => {
    if (!currentUser) {
      // toast.error("Please log in to save properties.");
      setTimeout(() => navigate("/customer-login"), 1500);
      return;
    }

    try {
      await toggleHeart(propertyId);
      // toast.success(
      //   isSaved ? "Removed from shortlist" : "Added to shortlist"
      // );
    } catch (err) {
      console.error("Toggle heart error:", err);
      // toast.error("Something went wrong.");
    }
  }, [currentUser, toggleHeart, propertyId, 
    // isSaved, 
    navigate]);

  return { isSaved, handleToggleHeart };
}

export default useHeartProperty;