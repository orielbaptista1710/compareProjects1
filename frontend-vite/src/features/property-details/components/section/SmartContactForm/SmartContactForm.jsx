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
  Checkbox,
  FormControlLabel,
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

import API from "../../../../../api/api";
import { isValidEmail, suggestEmail } from "../../../../../utils/emailValidation";
import { PROPERTY_TYPE_CONFIG } from "../../../../../assests/constants/propertyTypeConfig";

// The same Residential / Commercial lists the search bar uses (BHK group
// excluded). `value` is the canonical listing type the backend accepts.
const PROPERTY_TYPE_GROUPS = PROPERTY_TYPE_CONFIG.filter((g) => g.target === "propertyType");
const PROPERTY_TYPE_VALUES = new Set(
  PROPERTY_TYPE_GROUPS.flatMap((g) => g.items.map((i) => i.value))
);

/* ─────────────────────────────────────────────
   FORM STEPS
───────────────────────────────────────────── */

const steps = [
  {
    key: "budget",
    title: "Budget Range",
    subtitle: "Choose your preferred budget",
    // Words, not "<" / ">": the backend's HTML sanitiser stores those as &lt; / &gt;.
    options: ["Under ₹25L", "₹25L–₹50L", "₹50L–₹1Cr", "Above ₹1Cr"],
  },
  {
    key: "propertyType",
    title: "Property Type",
    subtitle: "What are you looking for?",
    groups: PROPERTY_TYPE_GROUPS,
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
    placeholder: "10-digit mobile number",
  },
];

/* ─────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────── */

const validators = {
  text: (v) => v.trim().length >= 2,
  email: isValidEmail,
  tel: (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")),
};

const errorMessages = {
  text: "Please enter at least 2 characters",
  email: "Please enter a valid email address",
  tel: "Please enter a valid phone number",
};

// Lets the browser autofill and shows the right mobile keyboard.
const INPUT_HINTS = {
  customerName: { autoComplete: "name" },
  customerEmail: { autoComplete: "email", inputMode: "email" },
  customerPhone: { autoComplete: "tel-national", inputMode: "tel" },
};

// Marks the card that matches the answer already given (visible after Back).
const selectedSx = (selected) =>
  selected
    ? {
        borderColor: "var(--color-primary)",
        background: "var(--color-surface-tint)",
        color: "var(--color-primary)",
      }
    : undefined;

/* ─────────────────────────────────────────────
   DRAFT PERSISTENCE HELPERS
───────────────────────────────────────────── */

const DRAFT_KEY = "contactFormDraft";
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Reads and validates the saved draft once, at module load time / initial
// render — used only for the lazy useState initializers below. Returns null
// if there's nothing usable, so callers don't need their own try/catch.
function readValidDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < DRAFT_MAX_AGE_MS) {
      return parsed;
    }
    return null;
  } catch (err) {
    // Corrupted/incompatible draft data (e.g. from an older app version) —
    // don't crash the form over it, just drop it and log for diagnostics.
    console.error("Failed to parse saved contact form draft:", err);
    return null;
  }
}

/* ─────────────────────────────────────────────
   STYLED COMPONENTS
───────────────────────────────────────────── */

const StepCard = styled(Button)({
  borderRadius: 16,
  border: "1px solid var(--color-line)",
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  textTransform: "none",
  padding: "14px 16px",
  justifyContent: "flex-start",
  fontWeight: 600,
  fontSize: "13px",
  minHeight: 58,
  transition: "all 0.2s ease",
  boxShadow: "none",
  "&:hover": {
    borderColor: "var(--color-primary)",
    background: "linear-gradient(135deg, var(--color-surface-tint) 0%, var(--color-surface-tint-strong) 100%)",
    transform: "translateY(-1px)",
    boxShadow: "var(--shadow-md)",
  },
});

const ContinueButton = styled(Button)({
  height: 46,
  borderRadius: 14,
  fontWeight: 700,
  textTransform: "none",
  fontSize: "14px",
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "var(--color-surface)",
  boxShadow: "var(--shadow-brand)",
  "&:hover": {
    background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-dark) 100%)",
  },
  "&:disabled": {
    background: "var(--color-line)",
    color: "var(--color-placeholder)",
    boxShadow: "none",
  },
});

const SecondaryButton = styled(Button)({
  height: 46,
  borderRadius: 14,
  fontWeight: 600,
  textTransform: "none",
  fontSize: "13px",
  border: "1px solid var(--color-line)",
  color: "var(--color-ink-muted)",
  background: "var(--color-surface)",
  "&:hover": {
    borderColor: "var(--color-primary)",
    background: "var(--color-surface-tint)",
    color: "var(--color-primary)",
  },
});

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 16,
    background: "var(--color-surface)",
    "& fieldset": { borderColor: "var(--color-line)" },
    "&:hover fieldset": { borderColor: "var(--color-primary-light)" },
    "&.Mui-focused fieldset": { borderColor: "var(--color-primary)", borderWidth: "2px" },
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
  const [prevIsInSheet, setPrevIsInSheet] = useState(isInSheet);

  // Lazy initializers replace the old "load draft in a useEffect on mount"
  // pattern. The draft is read once, synchronously, before first paint —
  // no flash of empty state, no setState-in-effect lint violation, and no
  // extra render pass.
  const [formData, setFormData] = useState(() => {
    const saved = { ...(readValidDraft()?.formData ?? {}) };
    // A draft from before the type list changed may hold "Apartment" etc.; the
    // backend would reject it, so drop it and let the step ask again.
    if (!PROPERTY_TYPE_VALUES.has(saved.propertyType)) delete saved.propertyType;
    return saved;
  });
  const [step, setStep] = useState(() => {
    const draft = readValidDraft();
    const saved = draft?.step ?? 0;
    // If the saved type was dropped above, resume at the type step instead of
    // a later one, so the user is asked for it again.
    const typeStep = steps.findIndex((s) => s.key === "propertyType");
    const typeLost = !PROPERTY_TYPE_VALUES.has(draft?.formData?.propertyType);
    return typeLost && saved > typeStep ? typeStep : saved;
  });

  // Consent is never restored from the draft: it has to be a fresh, explicit
  // tick each time (docs/review SEC-07, DPDP).
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [error, setError] = useState("");
  // Last email we showed a "did you mean" prompt for; sending it again keeps it.
  const [warnedEmail, setWarnedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRef = useRef(null);

  const currentStep = useMemo(() => steps[step], [step]);

  /* ─────────────────────────────────────────
     OPEN WHEN EMBEDDED IN A SHEET (render-time adjustment)
     Replaces useEffect(() => { if (isInSheet) setIsOpen(true); }, [isInSheet]).
     isOpen already initializes from isInSheet on mount; this only needs to
     handle isInSheet flipping true *after* mount, which is why we compare
     against prevIsInSheet rather than re-running unconditionally.
  ───────────────────────────────────────── */
  if (isInSheet !== prevIsInSheet) {
    setPrevIsInSheet(isInSheet);
    if (isInSheet) {
      setIsOpen(true);
    }
  }

  /* ─────────────────────────────────────────
     DRAFT SAVE (this one is a legitimate effect — it's syncing React
     state OUT to an external system, localStorage, which is exactly
     what useEffect is for)
  ───────────────────────────────────────── */

  useEffect(() => {
    if (Object.keys(formData).length > 0 && !isSubmitted) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ formData, step, timestamp: Date.now() })
      );
    }
  }, [formData, step, isSubmitted]);

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
    // Shared API client: a relative fetch("/api/...") only works through the
    // Vite dev proxy; in production it hits the static site, not the backend.
    // Non-2xx responses reject, which the caller already handles as a failure.
    const res = await API.post("/api/leads/customer", {
      ...data,
      customerContactConsent: true, // only reached once the box is ticked
      source: "smart_properties_page_form",
      timestamp: new Date().toISOString(),
    });

    return res.data;
  }, []);

  const handleNext = useCallback(
    async (value) => {
      if (currentStep.input) {
        const trimmed = value?.trim() || "";
        const type = currentStep.type || "text";

        if (!validators[type](trimmed)) {
          setError(errorMessages[type]);
          return;
        }

        // Typo domains (gmail.con) are valid syntax, so ask once instead of
        // blocking: a second Next on the same value keeps it.
        if (type === "email" && warnedEmail !== trimmed) {
          const hint = suggestEmail(trimmed);
          if (hint) {
            setWarnedEmail(trimmed);
            setError(`Did you mean ${hint}? Click Continue again to keep ${trimmed}.`);
            return;
          }
        }
      }

      const sanitized =
        currentStep.key === "customerPhone"
          ? value.replace(/\D/g, "")
          : typeof value === "string"
          ? value.trim()
          : value;
      const updated = { ...formData, [currentStep.key]: sanitized };

      setFormData(updated);
      setError("");

      if (step < steps.length - 1) {
        setStep((p) => p + 1);
        return;
      }

      if (!consent) {
        setConsentError(true);
        return;
      }

      setIsSubmitting(true);

      try {
        await submitToAPI(updated);
        setIsSubmitted(true);
        localStorage.removeItem(DRAFT_KEY);
      } catch (err) {
        // The server's field message (e.g. "Invalid email format") beats a
        // generic failure; jump back to the step that owns the bad field.
        const fieldErrors = err?.response?.data?.errors?.fieldErrors;
        const badStep = steps.findIndex((s) => fieldErrors?.[s.key]);
        if (badStep >= 0) {
          setStep(badStep);
          setError(fieldErrors[steps[badStep].key][0]);
        } else {
          setError("Submission failed. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [step, formData, currentStep, consent, submitToAPI, warnedEmail]
  );

  const handleBack = () => {
    if (step > 0) {
      setStep((p) => p - 1);
      setError("");
      setWarnedEmail("");
    }
  };

  const handleReset = () => {
    setStep(0);
    setFormData({});
    setError("");
    setWarnedEmail("");
    setConsent(false);
    setConsentError(false);
    setIsSubmitted(false);
    localStorage.removeItem(DRAFT_KEY);

    if (!isInSheet) {
      setIsOpen(false);
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */

  return (
    <Box sx={{ width: "100%", maxWidth: isInSheet ? "100%" : 380, mx: "auto" }}>
      {!isInSheet && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: isOpen ? "22px 22px 0 0" : "22px",
            overflow: "hidden",
            border: "1px solid var(--color-line)",
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            color: "var(--color-surface)",
          }}
        >
          <Box
            onClick={() => setIsOpen((prev) => !prev)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.7,
              cursor: "pointer",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "12px",
                  background: "var(--color-on-dark-fill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle size={18} />
              </Box>

              <Box>
                <Typography fontWeight={700} fontSize="14px">
                  Get Expert Help
                </Typography>
                <Typography fontSize="11px" sx={{ opacity: 0.8 }}>
                  Free consultation
                </Typography>
              </Box>
            </Box>

            <IconButton sx={{ color: "var(--color-surface)" }}>
              {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
            </IconButton>
          </Box>
        </Paper>
      )}

      {isOpen && (
        <Fade in timeout={250}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: isInSheet ? "0px" : "0 0 22px 22px",
              border: isInSheet ? "none" : "1px solid var(--color-line)",
              borderTop: "none",
              background: "var(--color-surface)",
              overflow: "hidden",
            }}
          >
            {isSubmitted ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 74,
                    height: 74,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-success-bg) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircle2 size={36} color="var(--color-success)" />
                </Box>

                <Typography fontWeight={800} fontSize="20px" mb={1}>
                  Thank You!
                </Typography>

                <Typography fontSize="14px" color="var(--color-ink-muted)" mb={3}>
                  Our property expert will contact you shortly.
                </Typography>

                <Box display="flex" gap={1}>
                  <SecondaryButton fullWidth onClick={handleReset}>
                    Submit Another
                  </SecondaryButton>

                  <ContinueButton fullWidth onClick={() => !isInSheet && setIsOpen(false)}>
                    Close
                  </ContinueButton>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: "1px solid var(--color-line)" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography fontSize="12px" fontWeight={700} color="var(--color-ink-muted)">
                      STEP {step + 1} / {steps.length}
                    </Typography>

                    <Typography fontSize="12px" fontWeight={700} color="var(--color-primary)">
                      {Math.round(((step + 1) / steps.length) * 100)}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={((step + 1) / steps.length) * 100}
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      background: "var(--color-surface-tint-strong)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background: "linear-gradient(90deg,var(--color-primary),var(--color-primary-light))",
                      },
                    }}
                  />
                </Box>

                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "20px", lineHeight: 1.2 }}>
                    {currentStep.title}
                  </Typography>

                  <Typography fontSize="13px" color="var(--color-ink-muted)" mb={2.2}>
                    {currentStep.subtitle}
                  </Typography>

                  {currentStep.options && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: isInSheet
                          ? "repeat(2, minmax(0,1fr))"
                          : "1fr",
                        gap: 1.2,
                      }}
                    >
                      {currentStep.options.map((option) => (
                        <StepCard
                          key={option}
                          fullWidth
                          onClick={() => handleNext(option)}
                          disabled={isSubmitting}
                          sx={selectedSx(formData[currentStep.key] === option)}
                        >
                          {option}
                        </StepCard>
                      ))}
                    </Box>
                  )}

                  {currentStep.groups &&
                    currentStep.groups.map((group) => (
                      <Box key={group.key} sx={{ mb: 2, "&:last-of-type": { mb: 0 } }}>
                        <Typography
                          component="h3"
                          fontSize="11px"
                          fontWeight={700}
                          letterSpacing="0.06em"
                          textTransform="uppercase"
                          color="var(--color-ink-muted)"
                          mb={1}
                        >
                          {group.group}
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: isInSheet
                              ? "repeat(2, minmax(0,1fr))"
                              : "1fr",
                            gap: 1.2,
                          }}
                        >
                          {group.items.map((item) => (
                            <StepCard
                              key={item.value}
                              fullWidth
                              onClick={() => handleNext(item.value)}
                              disabled={isSubmitting}
                              sx={selectedSx(formData[currentStep.key] === item.value)}
                            >
                              {item.label}
                            </StepCard>
                          ))}
                        </Box>
                      </Box>
                    ))}

                  {/* Card steps have no text field to carry the error. */}
                  {error && !currentStep.input && (
                    <Typography fontSize="12px" color="error" role="alert" mt={1.5}>
                      {error}
                    </Typography>
                  )}

                  {currentStep.input && (
                    <Box
                      component="form"
                      noValidate
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleNext(inputRef.current?.value || "");
                      }}
                    >
                      <StyledTextField
                        key={step}
                        defaultValue={formData[currentStep.key] ?? ""}
                        fullWidth
                        inputRef={inputRef}
                        type={currentStep.type}
                        placeholder={currentStep.placeholder}
                        error={!!error}
                        helperText={error}
                        disabled={isSubmitting}
                        slotProps={{
                          htmlInput: {
                            "aria-label": currentStep.title,
                            ...INPUT_HINTS[currentStep.key],
                          },
                        }}
                      />

                      {step === steps.length - 1 && (
                        <Box mt={1.5}>
                          <FormControlLabel
                            sx={{ alignItems: "flex-start", mx: 0 }}
                            control={
                              <Checkbox
                                size="small"
                                checked={consent}
                                onChange={(e) => {
                                  setConsent(e.target.checked);
                                  setConsentError(false);
                                }}
                                disabled={isSubmitting}
                                sx={{ p: 0.5, mr: 1, "&.Mui-checked": { color: "var(--color-primary)" } }}
                              />
                            }
                            label={
                              <Typography fontSize="12px" color="var(--color-ink-muted)">
                                I agree to be contacted via phone, WhatsApp, SMS or email.
                              </Typography>
                            }
                          />
                          {consentError && (
                            <Typography fontSize="12px" color="error" role="alert">
                              Please agree to be contacted
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Box display="flex" gap={1} mt={2}>
                        {step > 0 && (
                          <SecondaryButton onClick={handleBack} startIcon={<ArrowLeft size={16} />}>
                            Back
                          </SecondaryButton>
                        )}

                        <ContinueButton type="submit" fullWidth disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <CircularProgress size={18} sx={{ color: "var(--color-surface)", mr: 1 }} />
                              Submitting...
                            </>
                          ) : step === steps.length - 1 ? (
                            "Submit Enquiry"
                          ) : (
                            "Continue"
                          )}
                        </ContinueButton>
                      </Box>
                    </Box>
                  )}

                  <Box
                    sx={{
                      mt: 2.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 1.2,
                      borderRadius: 14,
                      background: "var(--color-surface-tint)",
                    }}
                  >
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <Typography fontSize="11px" color="var(--color-ink-muted)">
                      Your information is secure and never shared.
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