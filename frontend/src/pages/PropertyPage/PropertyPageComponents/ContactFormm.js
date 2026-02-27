

//PropertyPage/PropertyPageComponents/ContactFormm.js -- to take leads/contact info from the customer for the sales team to get in touch
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
import useAppSnackbar from "../../../hooks/useAppSnackbar";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../../../api";

// Zod Schema
export const contactSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  customerEmail: z.string().email("Enter a valid email address"),
  customerContactConsent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to be contacted" }),
  }),
  message: z.string().optional(),
  loanInterest: z.boolean(),
  countryCode: z.string(), //Indian only Bro
});

const ContactFormm = ({ property }) => {
  const snackbar = useAppSnackbar();


  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    message: "",
    customerContactConsent: true,
    loanInterest: false,
    countryCode: "+91", //i dont event thing this is needed
  },
  });

  const onSubmit = async (data) => {
  try {
    await API.post("/api/leads/customer", {
  ...data,
  source: "property_page_contact",
  propertyId: property?._id || null,
  });
    snackbar.success("Thank you! We'll pass this to the sales team.");  //CHECK THIS -- HAVE TO MAKE SNACKBAR CONTEXT
    reset();
  } catch (err) {
  snackbar.error(
    err?.response?.data?.message || "Something went wrong. Please try again later."
  );
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
            Contact Developer in
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
                : "D"}
            </Avatar>

            <Typography sx={{ fontWeight: 500, color: "#4a4a4a" }}>
              {property?.developerName || "Developer"}
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
            name="customerName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isSubmitting}
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
            name="customerPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isSubmitting}
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
            name="customerEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
              name="customerContactConsent"
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
            {isSubmitting ? "Submitting..." : "Contact Developer"}
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
