import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Fade,
  Paper,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { MessageCircle, X, ArrowLeft } from "lucide-react";

/* ---------------------------------- */
/* FORM CONFIG */
/* ---------------------------------- */

const steps = [
  { 
    key: "budget", 
    question: "What's your budget?", 
    options: ["< ₹25L", "₹25L–₹50L", "₹50L–₹1Cr", "> ₹1Cr"] 
  },
  { 
    key: "propertyType", 
    question: "Property type?", 
    options: ["Apartments", "Villa", "Plot", "Shop/Showroom", "Office Spaces" , "Industrial Building"] 
  },
  { 
    key: "locality", 
    question: "Preferred locality?", 
    input: true, 
    type: "text",
    placeholder: "e.g., Bandra West" 
  },
  { 
    key: "name", 
    question: "Your name?", 
    input: true, 
    type: "text",
    placeholder: "Full name" 
  },
  { 
    key: "email", 
    question: "Your email?", 
    input: true, 
    type: "email",
    placeholder: "name@example.com" 
  },
  { 
    key: "phone", 
    question: "Phone number?", 
    input: true, 
    type: "tel",
    placeholder: "+91 98765 43210" 
  },
];

/* ---------------------------------- */
/* VALIDATION */
/* ---------------------------------- */

const validators = {
  text: (v) => v.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  tel: (v) => /^\+?[0-9]{10,15}$/.test(v.replace(/[\s\-\(\)]/g, "")),
};

const errorMessages = {
  text: "Please enter at least 2 characters",
  email: "Please enter a valid email address",
  tel: "Please enter a valid phone number",
};

/* ---------------------------------- */
/* STYLES - Purple/Red Theme */
/* ---------------------------------- */

const OptionButton = styled(Button)({
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 600,
  fontSize: "14px",
  textTransform: "none",
  color: "#374151",
  background: "#fff",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  overflow: "hidden",
  
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    opacity: 0,
    transition: "opacity 0.25s ease",
  },
  
  "&:hover": {
    borderColor: "#7c3aed",
    color: "#7c3aed",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
    
    "&::before": {
      opacity: 1,
    },
  },
  
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
});

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    fontSize: "14px",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    transition: "all 0.2s ease",
    
    "& fieldset": {
      borderColor: "#e5e7eb",
      borderWidth: "1.5px",
    },
    
    "&:hover fieldset": {
      borderColor: "#9ca3af",
    },
    
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      borderWidth: "2px",
    },
  },
  
  "& .MuiOutlinedInput-input": {
    padding: "11px 14px",
  },
  
  "& .MuiFormHelperText-root": {
    fontSize: "12px",
    marginLeft: 4,
    marginTop: 4,
  },
});

const SubmitButton = styled(Button)(({ variant }) => ({
  padding: "10px 20px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: "14px",
  textTransform: "none",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
  
  ...(variant === "contained" && {
    background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    color: "#fff",
    
    "&:hover": {
      background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
      boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
      transform: "translateY(-1px)",
    },
    
    "&:active": {
      transform: "translateY(0)",
    },
    
    "&:disabled": {
      background: "#e5e7eb",
      color: "#9ca3af",
      boxShadow: "none",
    },
  }),
  
  ...(variant === "outlined" && {
    border: "1.5px solid #e5e7eb",
    color: "#6b7280",
    background: "#fff",
    boxShadow: "none",
    
    "&:hover": {
      borderColor: "#7c3aed",
      background: "#faf5ff",
      color: "#7c3aed",
    },
  }),
}));

/* ---------------------------------- */
/* COMPONENT */
/* ---------------------------------- */

const SmartContactForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const currentStep = useMemo(() => steps[step], [step]);

  /* ---------------------------------- */
  /* PERSISTENCE */
  /* ---------------------------------- */
  
  useEffect(() => {
    if (Object.keys(formData).length > 0 && !isSubmitted) {
      try {
        localStorage.setItem('contactFormDraft', JSON.stringify({
          formData,
          step,
          timestamp: Date.now(),
        }));
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }
  }, [formData, step, isSubmitted]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem('contactFormDraft');
      if (draft) {
        const { formData: savedData, step: savedStep, timestamp } = JSON.parse(draft);
        // Only restore if < 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setFormData(savedData);
          setStep(savedStep);
        } else {
          localStorage.removeItem('contactFormDraft');
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    }
  }, []);

  /* ---------------------------------- */
  /* AUTO-FOCUS */
  /* ---------------------------------- */
  
  useEffect(() => {
    if (inputRef.current && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    setError("");
  }, [step, isOpen]);

  /* ---------------------------------- */
  /* ANALYTICS */
  /* ---------------------------------- */
  
  useEffect(() => {
    if (isOpen && window.gtag) {
      window.gtag('event', 'form_step_view', {
        step_number: step,
        step_name: currentStep.key,
      });
    }
  }, [step, isOpen, currentStep]);

  /* ---------------------------------- */
  /* API SUBMISSION */
  /* ---------------------------------- */
  
  const submitToAPI = useCallback(async (data) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data, 
          source: "smart_form",
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Submission failed");
      }
      
      const result = await res.json();
      
      // Track conversion
      if (window.gtag) {
        window.gtag('event', 'lead_submitted', {
          budget: data.budget,
          property_type: data.propertyType,
          locality: data.locality,
        });
      }
      
      return result;
    } catch (err) {
      console.error('Submission error:', err);
      throw err;
    }
  }, []);

  /* ---------------------------------- */
  /* HANDLERS */
  /* ---------------------------------- */
  
  const handleNext = useCallback(
    async (value) => {
      // Validate input fields
      if (currentStep.input) {
        const trimmedValue = value?.trim() || "";
        const type = currentStep.type || "text";
        
        if (!validators[type](trimmedValue)) {
          setError(errorMessages[type]);
          return;
        }
      }

      // Sanitize input
      const sanitizedValue = typeof value === 'string' 
        ? value.trim().replace(/<script[^>]*>.*?<\/script>/gi, '')
        : value;

      const updated = { ...formData, [currentStep.key]: sanitizedValue };
      setFormData(updated);
      setError("");

      // Next step or submit
      if (step < steps.length - 1) {
        setStep((prev) => prev + 1);
      } else {
        setIsSubmitting(true);
        try {
          await submitToAPI(updated);
          setIsSubmitted(true);
          localStorage.removeItem('contactFormDraft');
        } catch (err) {
          setError("Submission failed. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [step, formData, currentStep, submitToAPI]
  );

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      setError("");
    }
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(0);
    setFormData({});
    setIsSubmitted(false);
    setError("");
    localStorage.removeItem('contactFormDraft');
  }, []);

  /* ---------------------------------- */
  /* RENDER */
  /* ---------------------------------- */

  return (
    <div style={{ width: 380 }}>
      {/* Header */}
      <Box
        onClick={() => !isOpen && setIsOpen(true)}
        sx={{
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          color: "#fff",
          p: "12px 16px",
          borderRadius: isOpen ? "12px 12px 0 0" : "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: isOpen ? "default" : "pointer",
          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
          transition: "all 0.3s ease",
          
          "&:hover": {
            boxShadow: isOpen 
              ? "0 4px 12px rgba(124, 58, 237, 0.25)"
              : "0 6px 16px rgba(124, 58, 237, 0.35)",
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={0.75}>
          <MessageCircle size={18} />
          <Typography fontWeight={700} fontSize="14px">
            Get Expert Help
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((p) => !p);
          }}
          aria-label={isOpen ? "Close form" : "Open form"}
          aria-expanded={isOpen}
          sx={{ 
            color: "#fff",
            p: 0.5,
            "&:hover": { 
              backgroundColor: "rgba(255, 255, 255, 0.15)" 
            },
          }}
        >
          {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
        </IconButton>
      </Box>

      {/* Expandable Content */}
      {isOpen && (
        <Fade in timeout={300}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "0 0 12px 12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
              background: "#fafafa",
            }}
          >
            {isSubmitted ? (
              /* SUCCESS STATE */
              <Box textAlign="center">
                <CheckCircleIcon 
                  sx={{ 
                    fontSize: 56, 
                    color: "#22c55e",
                    filter: "drop-shadow(0 4px 8px rgba(34, 197, 94, 0.2))",
                  }} 
                />
                <Typography fontWeight={700} fontSize="16px" mt={1.5} color="#1f2937">
                  Thank You, {formData.name}!
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1} fontSize="13px">
                  Our property expert will contact you within 24 hours.
                </Typography>
                
                <Box display="flex" gap={1} mt={2.5}>
                  <SubmitButton 
                    variant="outlined" 
                    onClick={handleReset}
                    sx={{ flex: 1 }}
                  >
                    Submit Another
                  </SubmitButton>
                  <SubmitButton 
                    variant="contained"
                    onClick={() => setIsOpen(false)}
                    sx={{ flex: 1 }}
                  >
                    Close
                  </SubmitButton>
                </Box>
              </Box>
            ) : (
              /* FORM STEPS */
              <>
                {/* Progress Bar */}
                <Box mb={2}>
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center" 
                    mb={0.5}
                  >
                    <Typography fontSize="11px" fontWeight={600} color="#6b7280">
                      Step {step + 1} of {steps.length}
                    </Typography>
                    <Typography fontSize="11px" fontWeight={600} color="#7c3aed">
                      {Math.round(((step + 1) / steps.length) * 100)}%
                    </Typography>
                  </Box>
                  
                  <Box
                    sx={{
                      height: 5,
                      background: "#e5e7eb",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${((step + 1) / steps.length) * 100}%`,
                        background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                        borderRadius: 3,
                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </Box>
                </Box>

                {/* Question */}
                <Typography 
                  fontWeight={700} 
                  fontSize="15px"
                  color="#1f2937"
                  mb={2}
                >
                  {currentStep.question}
                </Typography>

                {/* Options */}
                {currentStep.options && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {currentStep.options.map((opt) => (
                      <OptionButton
                        key={opt}
                        fullWidth
                        onClick={() => handleNext(opt)}
                        disabled={isSubmitting}
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
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleNext(inputRef.current?.value || "");
                    }}
                  >
                    <StyledTextField
                      fullWidth
                      inputRef={inputRef}
                      type={currentStep.type}
                      size="small"
                      placeholder={currentStep.placeholder}
                      error={!!error}
                      helperText={error}
                      disabled={isSubmitting}
                      inputProps={{
                        "aria-label": currentStep.question,
                      }}
                    />

                    <Box display="flex" gap={1} mt={2}>
                      {step > 0 && (
                        <SubmitButton
                          variant="outlined"
                          onClick={handleBack}
                          disabled={isSubmitting}
                          startIcon={<ArrowLeft size={14} />}
                          sx={{ minWidth: 90 }}
                        >
                          Back
                        </SubmitButton>
                      )}

                      <SubmitButton
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <CircularProgress 
                              size={16} 
                              sx={{ mr: 1, color: "#fff" }} 
                            />
                            {step === steps.length - 1 ? "Submitting..." : "Loading..."}
                          </>
                        ) : (
                          step === steps.length - 1 ? "Submit →" : "Next →"
                        )}
                      </SubmitButton>
                    </Box>
                  </Box>
                )}

                {/* Privacy Note */}
                <Typography 
                  fontSize="11px" 
                  color="#9ca3af" 
                  textAlign="center" 
                  mt={2}
                >
                  🔒 Your information is secure and will never be shared
                </Typography>
              </>
            )}
          </Paper>
        </Fade>
      )}
    </div>
  );
};

export default SmartContactForm;