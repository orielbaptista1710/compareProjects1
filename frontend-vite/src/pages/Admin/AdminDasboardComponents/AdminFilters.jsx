// frontend-vite/src/pages/Admin/AdminDasboardComponents/AdminFilters.jsx
import React, { useMemo } from "react";
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  Chip,
  Typography,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { X } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
// Keep in sync with propertyType.js — or import directly if bundler allows
const PROPERTY_TYPES = [
  "Flats/Apartments",
  "Villa",
  "Plot",
  "Shop/Showroom",
  "Industrial Warehouse/Godown",
  "Industrial Building",
  "Office Space",
  "Commercial Land",
];

const STATUS_OPTIONS = [
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const IMAGE_OPTIONS = [
  { value: "withImages",    label: "Has images" },
  { value: "withoutImages", label: "No images" },
  { value: "coverOnly",     label: "Cover only" },
  { value: "galleryOnly",   label: "Gallery only" },
];

const SORT_OPTIONS = [
  { value: "latest",    label: "Latest first" },
  { value: "oldest",    label: "Oldest first" },
  { value: "priceHigh", label: "Price: high → low" },
  { value: "priceLow",  label: "Price: low → high" },
  { value: "mostViewed", label: "Most viewed" },
];

const DEFAULT_FILTERS = {
  search:       "",
  propertyType: "",
  status:       "",
  city:         "",
  locality:     null,
  imageFilter:  "",
  sortBy:       "latest",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Count how many non-default filters are active (excludes sortBy)
function countActiveFilters(filters) {
  return [
    filters.search,
    filters.propertyType,
    filters.status,
    filters.city,
    filters.locality,
    filters.imageFilter,
  ].filter(Boolean).length;
}

// ─── Shared select style ─────────────────────────────────────────────────────
const selectSx = { minWidth: 150 };

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminFilters({
  filters,
  setFilters,
  cityList = [],
  localities = [],
  loadingLocalities = false,
}) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  return (
    <Box
      sx={{
        mb: 3,
        p:  { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* ── Row 1: Search + quick filters ───────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ flexWrap: "wrap", alignItems: "flex-start", gap: 1.5 }}
      >
        {/* Search */}
        <TextField
          label="Search"
          size="small"
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          placeholder="Title, developer, description…"
          sx={{ minWidth: 220, flexGrow: 1 }}
          inputProps={{ maxLength: 50 }}
        />

        {/* Status */}
        <Select
          size="small"
          value={filters.status}
          displayEmpty
          onChange={(e) => handleChange("status", e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="">All status</MenuItem>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>

        {/* Property type */}
        <Select
          size="small"
          value={filters.propertyType}
          displayEmpty
          onChange={(e) => handleChange("propertyType", e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All types</MenuItem>
          {PROPERTY_TYPES.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>

        {/* City */}
        <Select
          size="small"
          value={filters.city}
          displayEmpty
          onChange={(e) => handleChange("city", e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="">All cities</MenuItem>
          {cityList.map((city) => (
            <MenuItem key={city} value={city}>{city}</MenuItem>
          ))}
        </Select>

        {/* Locality — only shown when city selected */}
        {filters.city && (
          <Autocomplete
            size="small"
            value={filters.locality}
            options={localities}
            loading={loadingLocalities}
            onChange={(_, val) => handleChange("locality", val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Locality"
                placeholder="Search locality"
              />
            )}
            sx={{ minWidth: 200 }}
            // Prevent stale options flash when city changes
            key={filters.city}
          />
        )}

        {/* Image filter */}
        <Select
          size="small"
          value={filters.imageFilter}
          displayEmpty
          onChange={(e) => handleChange("imageFilter", e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All media</MenuItem>
          {IMAGE_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>

        {/* Sort */}
        <Select
          size="small"
          value={filters.sortBy}
          onChange={(e) => handleChange("sortBy", e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>

        {/* Reset — only shown when filters are active */}
        {activeCount > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={resetFilters}
            startIcon={<X size={14} />}
            sx={{ whiteSpace: "nowrap", alignSelf: "center" }}
          >
            Clear{activeCount > 1 ? ` (${activeCount})` : ""}
          </Button>
        )}
      </Stack>

      {/* ── Active filter chips (quick-remove) ───────────────────────── */}
      {activeCount > 0 && (
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 1, mt: 1.5, alignItems: "center" }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Active:
          </Typography>

          {filters.search && (
            <Chip
              size="small"
              label={`"${filters.search}"`}
              onDelete={() => handleChange("search", "")}
            />
          )}
          {filters.status && (
            <Chip
              size="small"
              label={filters.status}
              onDelete={() => handleChange("status", "")}
            />
          )}
          {filters.propertyType && (
            <Chip
              size="small"
              label={filters.propertyType}
              onDelete={() => handleChange("propertyType", "")}
            />
          )}
          {filters.city && (
            <Chip
              size="small"
              label={filters.city}
              onDelete={() => handleChange("city", "")}
            />
          )}
          {filters.locality && (
            <Chip
              size="small"
              label={filters.locality}
              onDelete={() => handleChange("locality", null)}
            />
          )}
          {filters.imageFilter && (
            <Chip
              size="small"
              label={IMAGE_OPTIONS.find((o) => o.value === filters.imageFilter)?.label ?? filters.imageFilter}
              onDelete={() => handleChange("imageFilter", "")}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}