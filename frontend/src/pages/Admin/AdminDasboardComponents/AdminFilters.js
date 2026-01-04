import React from "react";
import {
  Stack,
  TextField,
  Select,
  MenuItem
} from "@mui/material";
import { Autocomplete } from "@mui/material";

export default function AdminFilters({
  search,
  setSearch,

  propertyTypeFilter,
  setPropertyTypeFilter,

  statusFilter,
  setStatusFilter,

  cityFilter,
  setCityFilter,
  cityList,

  localityFilter,
  setLocalityFilter,
  localitySearch,
  setLocalitySearch,
  localities,
  loadingLocalities,

  imageFilter,
  setImageFilter,

  sortBy,
  setSortBy
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>

      {/* Search */}
      <TextField
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Property Type */}
      <Select
        value={propertyTypeFilter}
        onChange={(e) => setPropertyTypeFilter(e.target.value)}
        displayEmpty
      >
        <MenuItem value="">All Types</MenuItem>
        <MenuItem value="Flats/Apartments">Flats/Apartments</MenuItem>
        <MenuItem value="Villa">Villa</MenuItem>
        <MenuItem value="Plot">Plot</MenuItem>
        <MenuItem value="Shop/Showroom">Shop/Showroom</MenuItem>
        <MenuItem value="Industrial Warehouse">Industrial Warehouse</MenuItem>
        <MenuItem value="Retail">Retail</MenuItem>
        <MenuItem value="Office Space">Office Space</MenuItem>
      </Select>

      {/* Status */}
      <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        displayEmpty
      >
        <MenuItem value="">All Status</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
      </Select>

      {/* City */}
      <Select
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        displayEmpty
      >
        <MenuItem value="">All Cities</MenuItem>
        {cityList.map((city) => (
          <MenuItem key={city} value={city}>{city}</MenuItem>
        ))}
      </Select>

      {/* Locality */}
      <Autocomplete
        value={localityFilter}
        options={localities}
        loading={loadingLocalities}
        disabled={!cityFilter}
        onChange={(_, val) => setLocalityFilter(val)}
        onInputChange={(_, val) => setLocalitySearch(val)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Locality"
            placeholder={cityFilter ? "Search locality" : "Select city first"}
          />
        )}
        sx={{ minWidth: 220 }}
      />

      {/* Image Filter */}
      <Select
        value={imageFilter}
        onChange={(e) => setImageFilter(e.target.value)}
        displayEmpty
      >
        <MenuItem value="">All Properties</MenuItem>
        <MenuItem value="withImages">With Images</MenuItem>
        <MenuItem value="withoutImages">Without Images</MenuItem>
        <MenuItem value="coverOnly">With Cover Image only</MenuItem>
        <MenuItem value="galleryOnly">With Gallery Images only</MenuItem>
      </Select>

      {/* Sort */}
      <Select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        displayEmpty
      >
        <MenuItem value="latest">Latest First</MenuItem>
        <MenuItem value="oldest">Oldest First</MenuItem>
        <MenuItem value="priceHigh">Price: High → Low</MenuItem>
        <MenuItem value="priceLow">Price: Low → High</MenuItem>
        <MenuItem value="mostViewed">Most Viewed</MenuItem>
      </Select>

    </Stack>
  );
}
