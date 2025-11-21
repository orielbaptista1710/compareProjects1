import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  PROPERTY_TYPES,
  FURNISHED_OPTIONS,
  POSSESSION_STATUS_OPTIONS,
  AGE_OF_PROPERTY_OPTIONS,
  BHK_OPTIONS,
  BATHROOM_OPTIONS,
  BALCONY_OPTIONS,
  FACING_OPTIONS,
  PARKING_OPTIONS,
  FLOOR_OPTIONS,
} from "../../../assests/constants/propertyFormConstants";
import PropertyDetailsSection from "../SellPropertyFormComponents/property-form/PropertyDetailsSection";
import "./SellPropertyForm.css";

// ✅ Zod Validation Schema
const propertySchema = z.object({
  developerName: z.string().min(2, "Developer name is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  long_description: z.string().min(50, "Description must be at least 50 characters"), //i think ill add a max instread

  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  locality: z.string().min(1, "Locality is required"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().regex(/^\d{5,6}$/, "Enter a valid postal code"),

  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),

  price: z.coerce.number().positive("Price must be positive"),
  emiStarts: z.coerce.number().optional().default(0),

  totalFloors: z.coerce.number().optional(),
  unitsAvailable: z.coerce.number().min(1, "Enter at least 1 unit"),
  propertyType: z.string().min(1, "Select a property type"),
  furnishing: z.string().min(1, "Select a furnishing type"), //not required
  possessionStatus: z.string().min(1, "Select possession status"),

  
  bhk: z.string().optional(),
  bathrooms: z.string().optional(),
  balconies: z.string().optional(),
  facing: z.string().optional(),
  parking: z.string().optional(),
  floor: z.string().optional(),
  ageOfProperty: z.string().optional(),
});

const libraries = ["places"];

const SellPropertyForm = ({
  formData,
  onSubmit,
  handleCancelEdit,
  editingId,
  isAdding,
  isUpdating,
}) => {
  const autocompleteRef = useRef();
  const [coordinates, setCoordinates] = useState(formData.coordinates || null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: formData,
  });

  // ✅ Load Maps + Places API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ✅ Autocomplete location handler
  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place || !place.geometry) {
    console.warn("No geometry found for the selected place.");
    return;
  }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setCoordinates({ lat, lng });
    setValue("address", place.formatted_address);

    // Autofill city, state, pincode, locality
    const comps = place.address_components || [];
    for (let c of comps) {
      if (c.types.includes("locality")) setValue("city", c.long_name);
      if (c.types.includes("administrative_area_level_1")) setValue("state", c.long_name);
      if (c.types.includes("postal_code")) setValue("pincode", c.long_name);
      if (c.types.includes("sublocality") || c.types.includes("neighborhood"))
        setValue("locality", c.long_name);
    }
  };

  // ✅ Reverse lookup if pin moved manually
  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCoordinates({ lat, lng });

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(geocodeUrl);
    const data = await res.json();
    if (data.results[0]) {
      const place = data.results[0];
      setValue("address", place.formatted_address);
    }
  };

  // Submit handler
  const onFormSubmit = (data) => {
    const propertyData = { 
    ...formData,
    ...data, 
    furnishing: [data.furnishing], 
    possessionStatus: [data.possessionStatus],
    ageOfProperty: data.ageOfProperty || "New",
    pincode: Number(data.pincode), // Convert pincode to number on submit

    coordinates: {
      lat: Number(data.lat),
      lng: Number(data.lng),
    },
    
     };
    console.log("Submitting property:", propertyData); // debug check
    onSubmit(propertyData);
  };

  return (
    <form className="sell-property-form" onSubmit={handleSubmit(onFormSubmit)}>
      <h2>{editingId ? "Edit Property" : "Post a New Property"}</h2>

      {/* Developer Name */}
      <div className="form-group">
        <label>Developer Name</label>
        <input {...register("developerName")} placeholder="Developer Name" />
        {errors.developerName && <p className="error">{errors.developerName.message}</p>}
      </div>

      {/* Title */}
      <div className="form-group">
        <label>Project Title</label>
        <input {...register("title")} placeholder="Project Title" />
        {errors.title && <p className="error">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description</label>
        <textarea {...register("description")} placeholder=" Write a short Project Description " rows={3} />
        {errors.description && <p className="error">{errors.description.message}</p>}
      </div>

      <div className="form-group">
        <label>Detailed Description()</label>
        <textarea {...register("long_description")} placeholder="Detailed Description(Optional)" rows={3} />
        {errors.long_description && <p className="error">{errors.long_description.message}</p>}
      </div>

       {/* Google Maps Search */}
      {isLoaded && (
        <div className="form-group full">
          <label>Search Location (Google Maps)</label>
          <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
            <input placeholder="Type your project location..." />
          </Autocomplete>
        </div>
      )}

      {/* Map */}
      {isLoaded && coordinates && (
        <div className="map-container">
          <GoogleMap
            center={coordinates}
            zoom={15}
            onClick={handleMapClick}
            mapContainerStyle={{ height: "300px", width: "100%", borderRadius: "10px" }}
          >
            <Marker position={coordinates} />
          </GoogleMap>
        </div>
      )}

      {/* Address Details */}
      <div className="form-grid">
        <div className="form-group">
          <label>State</label>
          <input {...register("state")} placeholder="State" />
          {errors.state && <p className="error">{errors.state.message}</p>}
        </div>
        <div className="form-group">
          <label>City</label>
          <input {...register("city")} placeholder="City" />
          {errors.city && <p className="error">{errors.city.message}</p>}
        </div>
        <div className="form-group">
          <label>Locality</label>
          <input {...register("locality")} placeholder="Locality" />
          {errors.locality && <p className="error">{errors.locality.message}</p>}
        </div>
        <div className="form-group">
          <label>Pincode / Postal Code</label>
          <input {...register("pincode")} placeholder="Postal Code" />
          {errors.pincode && <p className="error">{errors.pincode.message}</p>}
        </div>
      </div>

      <div className="form-group full">
        <label>Full Address</label>
        <textarea {...register("address")} placeholder="Full Address" rows={3} />
        {errors.address && <p className="error">{errors.address.message}</p>}
      </div>


      {/* Price */}
      <div className="form-group">
        <label>Price (₹)</label>
        <input type="number" {...register("price")} placeholder="Enter Price" />
        {errors.price && <p className="error">{errors.price.message}</p>}
      </div>

      {/* have to add price fommatting , priceNegotiable, reraNumber, wings, totalFloors, amenities, emiStarts?,  */}

      {/* Property Type */}
      <div className="form-group">
        <label>Property Type</label>
        <select {...register("propertyType")}>
  <option value="">Select type</option>
  {PROPERTY_TYPES.map((type) => (
    <option key={type.label} value={type.label}>
      {type.label}
    </option>
  ))
  }
</select>

        {errors.propertyType && <p className="error">{errors.propertyType.message}</p>}
      </div>

      {/* Property Details */}
<div className="form-grid">

  <div className="form-group">
    <label>BHK</label>
    <select {...register("bhk")}>
      <option value="">Select</option>
      {BHK_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt} BHK</option>
      ))}
    </select>
    {errors.bhk && <p className="error">{errors.bhk.message}</p>}
  </div>

  <div className="form-group">
    <label>Bathrooms</label>
    <select {...register("bathrooms")}>
      <option value="">Select</option>
      {BATHROOM_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {errors.bathrooms && <p className="error">{errors.bathrooms.message}</p>}
  </div>

  <div className="form-group">
    <label>Balconies</label>
    <select {...register("balconies")}>
      <option value="">Select</option>
      {BALCONY_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {errors.balconies && <p className="error">{errors.balconies.message}</p>}
  </div>

  <div className="form-group">
    <label>Facing</label>
    <select {...register("facing")}>
      <option value="">Select</option>
      {FACING_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {errors.facing && <p className="error">{errors.facing.message}</p>}
  </div>

  <div className="form-group">
    <label>Parking</label>
    <select {...register("parking")}>
      <option value="">Select</option>
      {PARKING_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {errors.parking && <p className="error">{errors.parking.message}</p>}
  </div>

  <div className="form-group">
    <label>Floor</label>
    <select {...register("floor")}>
      <option value="">Select</option>
      {FLOOR_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {errors.floor && <p className="error">{errors.floor.message}</p>}
  </div>

</div>


      {/* Furnishing */}
      <div className="form-group">
        <label>Furnishing</label>
        <select {...register("furnishing")}>
          <option value="">Select type</option>
    {FURNISHED_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
        </select>
        {errors.furnishing && <p className="error">{errors.furnishing.message}</p>}
      </div>

      {/* Possession Status */}
      <div className="form-group">
        <label>Possession Status</label>
        <select {...register("possessionStatus")}>
          <option value="">Select</option>
          {POSSESSION_STATUS_OPTIONS.map((status) => (
      <option key={status} value={status}>{status}</option>
    ))}
        </select>
        {errors.possessionStatus && (
          <p className="error">{errors.possessionStatus.message}</p>
        )}
      </div>

      <div className="form-group">
  <label>Age of Property</label>
  <select {...register("ageOfProperty")}>
    <option value="">Select</option>
    {AGE_OF_PROPERTY_OPTIONS.map((age) => (
      <option key={age} value={age}>{age}</option>
    ))}
  </select>
</div>


      {/* Units Available */}
      <div className="form-group">
        <label>Units Available</label>
        <input type="number" {...register("unitsAvailable")} placeholder="Units Available" />
        {errors.unitsAvailable && <p className="error">{errors.unitsAvailable.message}</p>}
      </div>

     





      {/* Buttons */}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isAdding || isUpdating}>
          {editingId
            ? isUpdating
              ? "Updating..."
              : "Update Property"
            : isAdding
            ? "Submitting..."
            : "Submit Property"}
        </button>

        {editingId && (
          <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default SellPropertyForm;
