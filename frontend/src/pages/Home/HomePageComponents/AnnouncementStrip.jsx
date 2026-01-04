import "./AnnouncementStrip.css";
import { useCity } from "../../../contexts/CityContext";

const AnnouncementStrip = () => {
  const { city } = useCity();

  return (
    <div className="announcement-strip">
      <div className="announcement-track">
        <span>
          We’ve got you covered in <strong>{city}</strong> — Verified Properties •
          Home Loans • Interiors • Legal Support
        </span>
        <span>
          We’ve got you covered in <strong>{city}</strong> — Verified Properties •
          Home Loans • Interiors • Legal Support
        </span>
      </div>
    </div>
  );
};

export default AnnouncementStrip;
