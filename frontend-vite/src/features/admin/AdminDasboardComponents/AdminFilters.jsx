// frontend-vite/src/pages/Admin/AdminDasboardComponents/AdminFilters.jsx
import { useMemo } from "react";
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
import { LISTING_STATUS_LABELS } from "../listingStatus";
import {
  DEFAULT_LISTING_FILTERS as DEFAULT_FILTERS,
  PROPERTY_TYPES,
  STATUS_OPTIONS,
  POSTED_BY_OPTIONS,
  IMAGE_OPTIONS,
  SORT_OPTIONS,
} from "../listings/listingFilters";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FILTER_FIELDS = ["search", "propertyType", "status", "listedBy", "city", "locality", "imageFilter"];

// How many filters differ from the defaults (excludes sortBy). The default
// status ("pending") isn't something the admin chose, so it doesn't count.
function countActiveFilters(filters) {
  return FILTER_FIELDS.filter((field) => filters[field] !== DEFAULT_FILTERS[field]).length;
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
          slotProps={{ htmlInput: { maxLength: 50 } }}
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

        {/* Posted by */}
        <Select
          size="small"
          value={filters.listedBy}
          displayEmpty
          onChange={(e) => handleChange("listedBy", e.target.value)}
          sx={selectSx}
          inputProps={{ "aria-label": "Posted by" }}
        >
          <MenuItem value="">Posted by anyone</MenuItem>
          {POSTED_BY_OPTIONS.map(({ value, label }) => (
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
          {filters.status !== DEFAULT_FILTERS.status && (
            <Chip
              size="small"
              label={LISTING_STATUS_LABELS[filters.status] ?? "All status"}
              onDelete={() => handleChange("status", DEFAULT_FILTERS.status)}
            />
          )}
          {filters.listedBy && (
            <Chip
              size="small"
              label={`Posted by ${POSTED_BY_OPTIONS.find((o) => o.value === filters.listedBy)?.label ?? filters.listedBy}`}
              onDelete={() => handleChange("listedBy", "")}
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