import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  Box,
  Button,
  TextField,
  Typography,
  Fade,
  Paper,
  CircularProgress,
  IconButton,
  LinearProgress,
} from "@mui/material";

import { styled } from "@mui/material/styles";

import {
  MessageCircle,
  X,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────
   FORM STEPS
───────────────────────────────────────────── */

const steps = [
  {
    key: "budget",
    title: "Budget Range",
    subtitle: "Choose your preferred budget",
    options: ["< ₹25L", "₹25L–₹50L", "₹50L–₹1Cr", "> ₹1Cr"],
  },

  {
    key: "propertyType",
    title: "Property Type",
    subtitle: "What are you looking for?",
    options: [
      "Apartment",
      "Villa",
      "Plot",
      "Office",
      "Shop",
      "Industrial",
    ],
  },

  {
    key: "locality",
    title: "Preferred Locality",
    subtitle: "Where would you like the property?",
    input: true,
    type: "text",
    placeholder: "e.g. Bandra West",
  },

  {
    key: "customerName",
    title: "Your Name",
    subtitle: "Tell us your full name",
    input: true,
    type: "text",
    placeholder: "John Doe",
  },

  {
    key: "customerEmail",
    title: "Email Address",
    subtitle: "We'll send property updates here",
    input: true,
    type: "email",
    placeholder: "name@example.com",
  },

  {
    key: "customerPhone",
    title: "Phone Number",
    subtitle: "Our expert will contact you shortly",
    input: true,
    type: "tel",
    placeholder: "+91 98765 43210",
  },
];

/* ─────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────── */

const validators = {
  text: (v) => v.trim().length >= 2,

  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),

  tel: (v) =>
    /^\+?[0-9]{10,15}$/.test(v.replace(/\s/g, "")),
};

const errorMessages = {
  text: "Please enter at least 2 characters",
  email: "Please enter a valid email address",
  tel: "Please enter a valid phone number",
};

/* ─────────────────────────────────────────────
   STYLED COMPONENTS
───────────────────────────────────────────── */

const StepCard = styled(Button)({
  borderRadius: 16,

  border: "1px solid #ececec",

  background: "#ffffff",

  color: "#1f2937",

  textTransform: "none",

  padding: "14px 16px",

  justifyContent: "flex-start",

  fontWeight: 600,

  fontSize: "13px",

  minHeight: 58,

  transition: "all 0.2s ease",

  boxShadow: "none",

  "&:hover": {
    borderColor: "#9417E2",

    background:
      "linear-gradient(135deg, #fcf7ff 0%, #f7efff 100%)",

    transform: "translateY(-1px)",

    boxShadow:
      "0 8px 20px rgba(148, 23, 226, 0.08)",
  },
});

const ContinueButton = styled(Button)({
  height: 46,

  borderRadius: 14,

  fontWeight: 700,

  textTransform: "none",

  fontSize: "14px",

  background:
    "linear-gradient(135deg, #9417E2 0%, #7b2cbf 100%)",

  color: "#fff",

  boxShadow:
    "0 10px 24px rgba(148, 23, 226, 0.22)",

  "&:hover": {
    background:
      "linear-gradient(135deg, #7b2cbf 0%, #6a1bb1 100%)",
  },

  "&:disabled": {
    background: "#e5e7eb",
    color: "#9ca3af",
    boxShadow: "none",
  },
});

const SecondaryButton = styled(Button)({
  height: 46,

  borderRadius: 14,

  fontWeight: 600,

  textTransform: "none",

  fontSize: "13px",

  border: "1px solid #e5e7eb",

  color: "#6b7280",

  background: "#fff",

  "&:hover": {
    borderColor: "#9417E2",

    background: "#faf5ff",

    color: "#9417E2",
  },
});

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 16,

    background: "#ffffff",

    "& fieldset": {
      borderColor: "#e5e7eb",
    },

    "&:hover fieldset": {
      borderColor: "#c084fc",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#9417E2",
      borderWidth: "2px",
    },
  },

  "& .MuiOutlinedInput-input": {
    padding: "14px",
    fontSize: "14px",
  },
});

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

const SmartContactForm = ({ isInSheet = false }) => {
  const [isOpen, setIsOpen] = useState(isInSheet);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRef = useRef(null);

  const currentStep = useMemo(
    () => steps[step],
    [step]
  );

  /* ───────────────────────────────────────── */

  useEffect(() => {
    if (isInSheet) {
      setIsOpen(true);
    }
  }, [isInSheet]);

  /* ─────────────────────────────────────────
     DRAFT SAVE
  ───────────────────────────────────────── */

  useEffect(() => {
    if (
      Object.keys(formData).length > 0 &&
      !isSubmitted
    ) {
      localStorage.setItem(
        "contactFormDraft",
        JSON.stringify({
          formData,
          step,
          timestamp: Date.now(),
        })
      );
    }
  }, [formData, step, isSubmitted]);

  useEffect(() => {
    const draft =
      localStorage.getItem("contactFormDraft");

    if (!draft) return;

    try {
      const {
        formData: savedData,
        step: savedStep,
        timestamp,
      } = JSON.parse(draft);

      if (
        Date.now() - timestamp <
        24 * 60 * 60 * 1000
      ) {
        setFormData(savedData);

        setStep(savedStep);
      }
    } catch {}
  }, []);

  /* ───────────────────────────────────────── */

  useEffect(() => {
    if (inputRef.current && isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [step, isOpen]);

  /* ─────────────────────────────────────────
     SUBMIT
  ───────────────────────────────────────── */

  const submitToAPI = useCallback(async (data) => {
    const res = await fetch(
      "/api/leads/customer",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...data,
          source:
            "smart_properties_page_form",
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Submission failed");
    }

    return await res.json();
  }, []);

  /* ───────────────────────────────────────── */

  const handleNext = useCallback(
    async (value) => {
      if (currentStep.input) {
        const trimmed = value?.trim() || "";

        const type =
          currentStep.type || "text";

        if (!validators[type](trimmed)) {
          setError(errorMessages[type]);

          return;
        }
      }

      const sanitized =
        typeof value === "string"
          ? value.trim()
          : value;

      const updated = {
        ...formData,
        [currentStep.key]: sanitized,
      };

      setFormData(updated);

      setError("");

      if (step < steps.length - 1) {
        setStep((p) => p + 1);
        return;
      }

      setIsSubmitting(true);

      try {
        await submitToAPI(updated);

        setIsSubmitted(true);

        localStorage.removeItem(
          "contactFormDraft"
        );
      } catch {
        setError(
          "Submission failed. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [step, formData, currentStep, submitToAPI]
  );

  const handleBack = () => {
    if (step > 0) {
      setStep((p) => p - 1);

      setError("");
    }
  };

  const handleReset = () => {
    setStep(0);
    setFormData({});
    setError("");
    setIsSubmitted(false);

    localStorage.removeItem(
      "contactFormDraft"
    );

    if (!isInSheet) {
      setIsOpen(false);
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: isInSheet
          ? "100%"
          : 380,
        mx: "auto",
      }}
    >
      {/* COLLAPSE HEADER */}

      {!isInSheet && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: isOpen
              ? "22px 22px 0 0"
              : "22px",
            overflow: "hidden",
            border: "1px solid #ececec",
            background:"linear-gradient(135deg, #9417E2 0%, #7b2cbf 100%)",
            color: "#fff",
          }}
        >
          <Box
            onClick={() =>
              setIsOpen((prev) => !prev)
            }
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent:"space-between",
              px: 2,
              py: 1.7,
              cursor: "pointer",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
              }}
            >

              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "12px",
                  background:"rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle size={18} />
              </Box>

              <Box>
                <Typography
                  fontWeight={700}
                  fontSize="14px"
                >
                  Get Expert Help
                </Typography>

                <Typography
                  fontSize="11px"
                  sx={{ opacity: 0.8 }}
                >
                  Free consultation
                </Typography>
              </Box>
            </Box>

            <IconButton
              sx={{
                color: "#fff",
              }}
            >
              {isOpen ? (
                <X size={18} />
              ) : (
                <MessageCircle size={18} />
              )}
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* BODY */}

      {isOpen && (
        <Fade in timeout={250}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: isInSheet
                ? "0px"
                : "0 0 22px 22px",
              border: isInSheet
                ? "none"
                : "1px solid #ececec",
              borderTop: "none",
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            {/* SUCCESS */}

            {isSubmitted ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    width: 74,
                    height: 74,
                    borderRadius: "50%",
                    background:"linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircle2
                    size={36}
                    color="#16a34a"
                  />
                </Box>

                <Typography
                  fontWeight={800}
                  fontSize="20px"
                  mb={1}
                >
                  Thank You!
                </Typography>

                <Typography
                  fontSize="14px"
                  color="#6b7280"
                  mb={3}
                >
                  Our property expert will
                  contact you shortly.
                </Typography>

                <Box
                  display="flex"
                  gap={1}
                >
                  <SecondaryButton
                    fullWidth
                    onClick={handleReset}
                  >
                    Submit Another
                  </SecondaryButton>

                  <ContinueButton
                    fullWidth
                    onClick={() =>
                      !isInSheet &&
                      setIsOpen(false)
                    }
                  >
                    Close
                  </ContinueButton>
                </Box>
              </Box>
            ) : (
              <>
                {/* TOP */}

                <Box
                  sx={{
                    px: 2,
                    pt: 2,
                    pb: 1.5,

                    borderBottom:
                      "1px solid #f3f4f6",
                  }}
                >
                    <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}>


                    <Typography
                      fontSize="12px"
                      fontWeight={700}
                      color="#6b7280"
                    >
                      STEP {step + 1} /{" "}
                      {steps.length}
                    </Typography>

                    <Typography
                      fontSize="12px"
                      fontWeight={700}
                      color="#9417E2"
                    >
                      {Math.round(
                        ((step + 1) /
                          steps.length) *
                          100
                      )}
                      %
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={
                      ((step + 1) /
                        steps.length) *
                      100
                    }
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      background: "#f3e8ff","& .MuiLinearProgress-bar":
                        {
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg,#9417E2,#c026d3)",
                        },
                    }}
                  />
                </Box>

                {/* CONTENT */}

                <Box
                  sx={{
                    p: 2,
                  }}
                >

                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "20px",
                        lineHeight: 1.2
                      }}
                    >
                    {currentStep.title}
                  </Typography>

                  <Typography
                    fontSize="13px"
                    color="#6b7280"
                    mb={2.2}
                  >
                    {currentStep.subtitle}
                  </Typography>

                  {/* OPTIONS */}

                  {currentStep.options && (
                    <Box
                      sx={{
                        display: "grid",

                        gridTemplateColumns:
                          isInSheet
                            ? "repeat(2, minmax(0,1fr))"
                            : "1fr",

                        gap: 1.2,
                      }}
                    >
                      {currentStep.options.map(
                        (option) => (
                          <StepCard
                            key={option}
                            fullWidth
                            onClick={() =>
                              handleNext(
                                option
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                          >
                            {option}
                          </StepCard>
                        )
                      )}
                    </Box>
                  )}

                  {/* INPUT */}

                  {currentStep.input && (
                    <Box
                      component="form"
                      onSubmit={(e) => {
                        e.preventDefault();

                        handleNext(
                          inputRef.current
                            ?.value || ""
                        );
                      }}
                    >
                      <StyledTextField
                        fullWidth
                        inputRef={inputRef}
                        type={currentStep.type}
                        placeholder={
                          currentStep.placeholder
                        }
                        error={!!error}
                        helperText={error}
                        disabled={
                          isSubmitting
                        }
                      />

                      <Box
                        display="flex"
                        gap={1}
                        mt={2}
                      >
                        {step > 0 && (
                          <SecondaryButton
                            onClick={
                              handleBack
                            }
                            startIcon={
                              <ArrowLeft
                                size={16}
                              />
                            }
                          >
                            Back
                          </SecondaryButton>
                        )}

                        <ContinueButton
                          type="submit"
                          fullWidth
                          disabled={
                            isSubmitting
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <CircularProgress
                                size={18}
                                sx={{
                                  color:
                                    "#fff",

                                  mr: 1,
                                }}
                              />

                              Submitting...
                            </>
                          ) : step ===
                            steps.length -
                              1 ? (
                            "Submit Enquiry"
                          ) : (
                            "Continue"
                          )}
                        </ContinueButton>
                      </Box>
                    </Box>
                  )}

                  {/* FOOTER */}

                  <Box
                    sx={{
                      mt: 2.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 1.2,
                      borderRadius: 14,
                      background:"#faf5ff",
                    }}
                  > 
                    <ShieldCheck
                      size={16}
                      color="#9417E2"
                    />

                    <Typography
                      fontSize="11px"
                      color="#6b7280"
                    >
                      Your information is secure
                      and never shared.
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default SmartContactForm;