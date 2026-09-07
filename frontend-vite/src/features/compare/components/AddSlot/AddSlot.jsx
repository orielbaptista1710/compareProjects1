//src/Compare/ComparePageComponents/AddSlot.jsx
import { Plus } from "lucide-react";

const AddSlot = ({ onClick }) => (
  <button className="add-slot" onClick={onClick} aria-label="Add property to compare">
    <span className="add-slot__icon"><Plus size={20} strokeWidth={1.5} /></span>
    <span className="add-slot__label">Add Property</span>
  </button>
);

export default AddSlot;