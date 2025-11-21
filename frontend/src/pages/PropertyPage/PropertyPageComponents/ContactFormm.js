import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Divider,
  TextField,
  Button,
  Avatar,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../../../api";

// Zod Schema
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  email: z.string().email("Enter a valid email address"),
  message: z.string().optional(),
  contactConsent: z.boolean(),
  loanInterest: z.boolean(),
  countryCode: z.string(),
});

const ContactFormm = ({ property }) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      message: "",
      contactConsent: true,
      loanInterest: false,
      countryCode: "+91",
    },
  });

  const onSubmit = async (data) => {
    try {
      await API.post("/contact", data);
      reset(); // Clears the form
    } catch (err) {
      console.error("Failed to submit contact form:", err);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #e5e5e5",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Contact Sellers in
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <Avatar
              sx={{
                bgcolor: "#D90429",
                width: 40,
                height: 40,
                fontWeight: 600,
              }}
            >
              {property?.developerName
                ? property.developerName.charAt(0)
                : "A"}
            </Avatar>

            <Typography sx={{ fontWeight: 500, color: "#4a4a4a" }}>
              {property?.developerName || "Developer Name"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ mb: 2, fontWeight: 600 }}>
          Please share your contact
        </Typography>

        {/* FORM */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* NAME */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />

          {/* PHONE */}
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone Number"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
          />

          {/* EMAIL */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          {/* MESSAGE */}
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Message (optional)"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />
            )}
          />

          <Divider sx={{ my: 2 }} />

          {/* CONSENT CHECKBOXES */}
          <FormGroup sx={{ mb: 2 }}>
            {/* contactConsent */}
            <Controller
              name="contactConsent"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      sx={{ color: "#D90429" }}
                    />
                  }
                  label="I agree to be contacted via WhatsApp, SMS, phone, email etc."
                />
              )}
            />

            {/* loanInterest */}
            <Controller
              name="loanInterest"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      sx={{ color: "#D90429" }}
                    />
                  }
                  label={
                    <>
                      I am interested in{" "}
                      <Link to="/apnaloan" style={{ color: "#D90429" }}>
                        Home Loans
                      </Link>
                    </>
                  }
                />
              )}
            />
          </FormGroup>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#D90429",
              py: 1.2,
              fontWeight: 600,
              "&:hover": { backgroundColor: "#b00320" },
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Get Contact Details"}
          </Button>

          {/* SHORTLIST */}
          <Box
            sx={{
              textAlign: "center",
              borderTop: "1px solid #e5e5e5",
              mt: 3,
              pt: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Still deciding?
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Shortlist this property and easily come back later.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ContactFormm;
