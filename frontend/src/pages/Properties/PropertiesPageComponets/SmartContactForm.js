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
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { MessageCircle, X } from "lucide-react";

/* ----------------------------------
   FORM CONFIG
---------------------------------- */

const steps = [
  {
    key: "budget",
    question: "What's your budget range?",
    options: ["< ₹25k", "₹25k–₹50k", "₹50k–₹1L", "> ₹1L"],
  },
  {
    key: "propertyType",
    question: "What type of property do you want?",
    options: ["Apartment", "Villa", "Plot", "Office"],
  },
  {
    key: "locality",
    question: "Which locality are you interested in?",
    input: true,
    type: "text",
  },
  { key: "name", question: "What's your name?", input: true, type: "text" },
  { key: "email", question: "Your email?", input: true, type: "email" },
  { key: "phone", question: "Your phone number?", input: true, type: "tel" },
];

const validators = {
  text: (v) => v.trim().length > 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  tel: (v) => /^\+?[0-9]{7,15}$/.test(v.trim()),
};

/* ----------------------------------
   STYLED COMPONENTS
---------------------------------- */

const OptionButton = styled(Button)(() => ({
  border: "1.5px solid #e8e8e8",
  borderRadius: 12,
  padding: 12,
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

/* ----------------------------------
   COMPONENT
---------------------------------- */

const SmartContactForm = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleNext = (value) => {
    if (currentStep.input) {
      const type = currentStep.type || "text";
      if (!validators[type]?.(value || "")) {
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

    const updated = { ...formData, [currentStep.key]: value.trim() };
    setFormData(updated);
    setError("");

    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      console.log("✅ Contact Lead Submitted:", updated);
      setIsSubmitted(true);
    }
  };

  /* ----------------------------------
     RENDER
  ---------------------------------- */

  return (
    <div className={`contact-form-sidebar ${isOpen ? "expanded" : ""}`}>
      {/* Header */}
      <div className="propertiespage-contact-form-header">
        <h3>
          <MessageCircle size={18} /> Get Expert Help
        </h3>
        <button
          className="contact-form-toggle"
          onClick={() => setIsOpen((p) => !p)}
        >
          {isOpen ? <X size={16} /> : <MessageCircle size={16} />}
        </button>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="contact-form-content">
          {isSubmitted ? (
            <Fade in>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  backgroundColor: "#fff",
                }}
              >
                <CheckCircleIcon
                  sx={{ fontSize: 60, color: "#4caf50", mb: 2 }}
                />
                <Typography variant="h5" fontWeight={600}>
                  Thank You!
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  Our expert will contact you shortly with the best options.
                </Typography>
              </Paper>
            </Fade>
          ) : (
            <Fade in>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  maxWidth: 420,
                  mx: "auto",
                  borderRadius: 4,
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
                  sx={{ mb: 3 }}
                >
                  {currentStep.question}
                </Typography>

                {/* Options */}
                {currentStep.options && (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {currentStep.options.map((opt) => (
                      <OptionButton
                        key={opt}
                        fullWidth
                        onClick={() => handleNext(opt)}
                      >
                        {opt}
                      </OptionButton>
                    ))}
                  </Box>
                )}

                {/* Input */}
                {currentStep.input && (
                  <Box
                    component="form"
                    mt={2}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleNext(inputRef.current?.value || "");
                      inputRef.current.value = "";
                    }}
                  >
                    <TextField
                      fullWidth
                      inputRef={inputRef}
                      type={currentStep.type}
                      placeholder="Type your answer…"
                      error={!!error}
                      helperText={error}
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
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#b90322" },
                      }}
                    >
                      Next →
                    </Button>
                  </Box>
                )}
              </Paper>
            </Fade>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartContactForm;
