//frontend-vite/src/hooks/useHeartProperty.js
import { useMemo, useCallback, useContext } from "react";
import { CustomerActivityContext } from "../contexts/CustomerActivityContext";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

function useHeartProperty(propertyId) {
  const { heartProperties, toggleHeart } = useContext(CustomerActivityContext);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // derive saved state globally
  const isSaved = useMemo(() => {
    if (!propertyId) return false;

    return heartProperties.some(
      (p) => (p._id || p).toString() === propertyId.toString()
    );
  }, [heartProperties, propertyId]);

  // unified toggle
  const handleToggleHeart = useCallback(async () => {
    if (!currentUser) {
      // toast.error("Please log in to save properties.");
      setTimeout(() => navigate("/customer-login"), 1500);
      return;
    }

    try {
      await toggleHeart(propertyId);

      success(
        isSaved ? "Removed from shortlist" : "Added to shortlist"
      );
    } catch (err) {
      error("Something went wrong.");
    }
  }, [currentUser, toggleHeart, propertyId, isSaved, navigate]);

  return { isSaved, handleToggleHeart };
}

export default useHeartProperty;