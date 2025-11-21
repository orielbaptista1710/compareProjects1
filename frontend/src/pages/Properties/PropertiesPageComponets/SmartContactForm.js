import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { styled } from "@mui/material/styles";

const steps = [
  { key: "budget", question: "What's your budget range?", options: ["< ₹25k", "₹25k–₹50k", "₹50k–₹1L", "> ₹1L"] },
  { key: "propertyType", question: "What type of property do you want?", options: ["Apartment", "Villa", "Plot", "Office"] },
  { key: "locality", question: "Which locality are you interested in?", input: true, type: "text" },
  { key: "name", question: "What's your name?", input: true, type: "text" },
  { key: "email", question: "Your email?", input: true, type: "email" },
  { key: "phone", question: "Your phone number?", input: true, type: "tel" },
];

const validators = {
  text: (val) => val.trim().length > 0,
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  tel: (val) => /^\+?[0-9]{7,15}$/.test(val.trim()),
};

// Elegant Option Button
const OptionButton = styled(Button)(({ theme }) => ({
  border: "1.5px solid #e8e8e8",
  borderRadius: "12px",
  padding: "12px",
  fontWeight: 500,
  color: "#222",
  backgroundColor: "#fafafa",
  textTransform: "none",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  transition: "all 0.25s ease",
  "&:hover": {
    borderColor: "#D90429",
    backgroundColor: "#fff",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(217,4,41,0.1)",
  },
}));

const SmartContactForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const currentStep = steps[step];

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    setError("");
  }, [step]);

  const handleNext = async (value) => {
    if (currentStep.input) {
      const type = currentStep.type || "text";
      if (!validators[type]?.(value)) {
        setError(
          type === "email"
            ? "Please enter a valid email address."
            : type === "tel"
            ? "Please enter a valid phone number."
            : "This field is required."
        );
        return;
      }
    }

    const newFormData = { ...formData, [currentStep.key]: value.trim() };
    setFormData(newFormData);
    setError("");

    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      try {
        console.log("✅ Final Data Submitted:", newFormData);
        setIsSubmitted(true);
      } catch (err) {
        console.error("Submission failed:", err);
        setError("Something went wrong. Please try again.");
      }
    }
  };

  if (isSubmitted) {
    return (
      <Fade in={true}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 4,
            backgroundColor: "#fff",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60, color: "#4caf50", mb: 2 }} />
          <Typography variant="h5" fontWeight={600} color="#333">
            Thank You!
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            We've received your details and will get in touch soon with
            personalized property options.
          </Typography>
        </Paper>
      </Fade>
    );
  }

  return (
    <Fade in={true}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 420,
          mx: "auto",
          borderRadius: 4,
          backgroundColor: "#ffffff",
        }}
      >
        {/* Stepper */}
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((s) => (
            <Step key={s.key}>
              <StepLabel />
            </Step>
          ))}
        </Stepper>

        <Typography
          variant="h6"
          fontWeight={600}
          align="center"
          sx={{
            mb: 3,
            color: "#2b2b2b",
            letterSpacing: 0.3,
            lineHeight: 1.4,
          }}
        >
          {currentStep.question}
        </Typography>

        {/* Option Buttons */}
        {currentStep.options && (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {currentStep.options.map((opt, i) => (
              <OptionButton key={i} fullWidth onClick={() => handleNext(opt)}>
                {opt}
              </OptionButton>
            ))}
          </Box>
        )}

        {/* Text Inputs */}
        {currentStep.input && (
          <Box
            component="form"
            mt={2}
            onSubmit={(e) => {
              e.preventDefault();
              handleNext(inputRef.current?.value);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <TextField
              fullWidth
              inputRef={inputRef}
              type={currentStep.type}
              placeholder="Type your answer..."
              error={!!error}
              helperText={error}
              variant="outlined"
              InputProps={{
                sx: {
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                  "&:hover": { backgroundColor: "#fff" },
                },
              }}
            />
            <Button
              variant="contained"
              type="submit"
              fullWidth
              sx={{
                mt: 2,
                py: 1.3,
                borderRadius: 2,
                backgroundColor: "#D90429",
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#b90322",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.25s ease",
              }}
            >
              Next →
            </Button>
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

export default SmartContactForm;
