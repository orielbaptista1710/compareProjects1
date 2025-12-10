// src/components/Admin/PropertyMediaSection.js
import React from "react";
import { Box, Typography, Stack } from "@mui/material";

const FALLBACK = "https://placehold.co/600x400/EBEBEB/555/png?text=No+image";

const Img = ({ src, alt, width = 120, height = 80 }) => (
  <Box
    component="img"
    src={src || FALLBACK}
    alt={alt}
    width={width}
    height={height}
    sx={{ borderRadius: 1, objectFit: "cover" }}
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = FALLBACK;
    }}
  />
);

export default function PropertyMediaSection({ property }) {
  if (!property) return null;

  const { coverImage, galleryImages, floorPlans, mediaFiles, virtualTours } = property;

  return (
    <Box>
      {/* ---------------- COVER IMAGE ---------------- */}
      <Typography variant="h6" gutterBottom>
        Cover Image
      </Typography>
      {coverImage?.url ? (
        <Img src={coverImage.url} alt="Cover Image" width="100%" height={300} />
      ) : (
        <Typography>No cover image</Typography>
      )}

      {/* ---------------- GALLERY ---------------- */}
      <Box mt={3}>
        <Typography variant="h6">Gallery Images</Typography>
        {galleryImages?.length ? (
          <Stack direction="row" spacing={2} sx={{ overflowX: "auto", py: 1 }}>
            {galleryImages.map((img, i) => (
              <Img key={i} src={img.url || img.src} alt={img.caption || "Gallery"} />
            ))}
          </Stack>
        ) : (
          <Typography>No gallery images</Typography>
        )}
      </Box>

      {/* ---------------- FLOOR PLANS ---------------- */}
      <Box mt={3}>
        <Typography variant="h6">Floor Plans</Typography>
        {floorPlans?.length ? (
          <Stack direction="row" spacing={2} sx={{ overflowX: "auto", py: 1 }}>
            {floorPlans.map((fp, i) => (
              <Box key={i} sx={{ textAlign: "center" }}>
                <Img src={fp.imageUrl} alt="Floor Plan" />
                <Typography variant="caption">{fp.planType}</Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography>No floor plans</Typography>
        )}
      </Box>

      {/* ---------------- MEDIA FILES ---------------- */}
      <Box mt={3}>
        <Typography variant="h6">Media Files</Typography>

        {mediaFiles?.length ? (
          <Stack direction="row" spacing={2} sx={{ overflowX: "auto", py: 1 }}>
            {mediaFiles.map((m, i) => (
              <Box key={i}>
                {m.type === "image" ? (
                  <Img src={m.src} alt="Media Image" />
                ) : (
                  <video
                    src={m.src}
                    width={160}
                    height={100}
                    controls
                    style={{ borderRadius: 8 }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography>No media files</Typography>
        )}
      </Box>

      {/* ---------------- VIRTUAL TOURS ---------------- */}
      <Box mt={3}>
        <Typography variant="h6">Virtual Tours</Typography>

        {virtualTours?.length ? (
          <Stack direction="row" spacing={2} sx={{ overflowX: "auto", py: 1 }}>
            {virtualTours.map((vt, i) => (
              <Box key={i}>
                <a href={vt.url} target="_blank" rel="noopener noreferrer">
                  <Img src={vt.thumbnail} alt="Virtual Tour" />
                </a>
                <Typography variant="caption">{vt.type}</Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography>No virtual tours</Typography>
        )}
      </Box>
    </Box>
  );
}
