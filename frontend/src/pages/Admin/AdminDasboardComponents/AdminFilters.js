// src/components/Admin/AdminFilters.js

import React, { useMemo } from "react";
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  Button
} from "@mui/material";
import { Autocomplete } from "@mui/material";

const PROPERTY_TYPES = [
  "Flats/Apartments",
  "Villa",
  "Plot",
  "Shop/Showroom",
  "Industrial Warehouse",
  "Retail",
  "Office Space"
];

const STATUS_OPTIONS = ["pending", "approved", "rejected"];

export default function AdminFilters({
  filters,
  setFilters,
  cityList,
  localities,
  loadingLocalities
}) {

  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      propertyType: "",
      status: "",
      city: "",
      locality: "",
      imageFilter: "",
      sortBy: "latest"
    });
  };

  const sortOptions = useMemo(() => ([
    { value: "latest", label: "Latest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "priceHigh", label: "Price: High → Low" },
    { value: "priceLow", label: "Price: Low → High" },
    { value: "mostViewed", label: "Most Viewed" }
  ]), []);

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      mb={3}
      flexWrap="wrap"
      alignItems="center"
    >

      {/* Search */}
      <TextField
        label="Search property"
        size="small"
        value={filters.search}
        onChange={(e) => handleChange("search", e.target.value)}
        sx={{ minWidth: 220 }}
      />

      {/* Property Type */}
      <Select
        size="small"
        value={filters.propertyType}
        displayEmpty
        onChange={(e) => handleChange("propertyType", e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">All Types</MenuItem>
        {PROPERTY_TYPES.map((type) => (
          <MenuItem key={type} value={type}>{type}</MenuItem>
        ))}
      </Select>

      {/* Status */}
      <Select
        size="small"
        value={filters.status}
        displayEmpty
        onChange={(e) => handleChange("status", e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">All Status</MenuItem>
        {STATUS_OPTIONS.map((status) => (
          <MenuItem key={status} value={status}>
            {status.toUpperCase()}
          </MenuItem>
        ))}
      </Select>

      {/* City */}
      <Select
        size="small"
        value={filters.city}
        displayEmpty
        onChange={(e) => handleChange("city", e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">All Cities</MenuItem>
        {cityList.map((city) => (
          <MenuItem key={city} value={city}>{city}</MenuItem>
        ))}
      </Select>

      {/* Locality */}
      <Autocomplete
        size="small"
        value={filters.locality}
        options={localities}
        loading={loadingLocalities}
        disabled={!filters.city}
        onChange={(_, val) => handleChange("locality", val)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Locality"
            placeholder={filters.city ? "Search locality" : "Select city first"}
          />
        )}
        sx={{ minWidth: 220 }}
      />

      {/* Image Filter */}
      <Select
        size="small"
        value={filters.imageFilter}
        displayEmpty
        onChange={(e) => handleChange("imageFilter", e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">All Properties</MenuItem>
        <MenuItem value="withImages">With Images</MenuItem>
        <MenuItem value="withoutImages">Without Images</MenuItem>
        <MenuItem value="coverOnly">Cover Image Only</MenuItem>
        <MenuItem value="galleryOnly">Gallery Only</MenuItem>
      </Select>

      {/* Sort */}
      <Select
        size="small"
        value={filters.sortBy}
        onChange={(e) => handleChange("sortBy", e.target.value)}
        sx={{ minWidth: 200 }}
      >
        {sortOptions.map((s) => (
          <MenuItem key={s.value} value={s.value}>
            {s.label} 
          </MenuItem>
        ))}
      </Select>

      {/* Reset */}
      <Button
        variant="outlined"
        size="small"
        onClick={resetFilters}
      >
        Reset
      </Button>

    </Stack>
  );
}