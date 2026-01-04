import { useState, useRef } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { TOP_SELECTOR_CITIES } from "../../../database/citySelectorData";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import "./CitySelector.css";

import { useCity } from "../../../contexts/CityContext";


export default function CitySelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const { city, setCity } = useCity();

  useOutsideClick(open, [ref], () => setOpen(false));

  const filteredSelectorCities = TOP_SELECTOR_CITIES.filter((city) =>
  city.name.toLowerCase().includes(search.toLowerCase())
);


  return (
    <div className="city-wrapper" ref={ref}>
      {/* Trigger */}
      <button
  className="city-trigger"
  onClick={() => setOpen(prev => !prev)}
>
  {city} <ChevronDown size={14} />
</button>


      {/* Dropdown */}
      {open && (
        <div className="city-dropdown">
          {/* Search */}
          <div className="city-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Select or type your city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="city-actions">
            <button className="detect-btn">
              <MapPin size={16} />
              Detect my location
            </button>
            <button
  className="reset-btn"
  onClick={() => setCity("Mumbai")}
>
  Reset City
</button>

          </div>

          {/* Cities */}
          <p className="city-title">Top Cities</p>

          <div className="city-grid">


            {filteredSelectorCities.map(({ name, icon: Icon }) => (
  <button
    key={name}
    className="city-item"
    onClick={() => {
      setCity(name);
      setOpen(false);
      setSearch("");
    }}
  >
    <div className="city-icon">
      <Icon size={24} strokeWidth={1.5} />
    </div>
    <span>{name}</span>
  </button>
))}



          </div>
        </div>
      )}
    </div>
  );
}
