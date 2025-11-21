import React from "react";
import { useFormContext } from "react-hook-form";

const PropertyInformationSection = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="form-section">
      <h3>Property Information</h3>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="developerName">Developer Name</label>
          <input
            id="developerName"
            {...register("developerName", { required: "Developer name is required" })}
            placeholder="Enter developer name"
          />
          {errors.developerName && <span className="error">{errors.developerName.message}</span>}
        </div>

        <div className="form-col">
          <label htmlFor="title">Property Title</label>
          <input
            id="title"
            {...register("title", { required: "Title is required" })}
            placeholder="Enter property title"
          />
          {errors.title && <span className="error">{errors.title.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="description">Short Description</label>
          <textarea
            id="description"
            {...register("description", { required: "Description is required" })}
            placeholder="Write a short description"
            rows={3}
          />
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="long_description">Detailed Description</label>
          <textarea
            id="long_description"
            {...register("long_description")}
            placeholder="Write a detailed description"
            rows={5}
          />
        </div>
      </div>
    </section>
  );
};

export default PropertyInformationSection;
