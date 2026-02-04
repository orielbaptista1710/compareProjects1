import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  TextField,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  HeadsetMic as SupportIcon,
  BugReport as BugIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  Description as DocIcon,
  // Feedback as FeedbackIcon,
} from "@mui/icons-material";

const DeveloperSupport = () => {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: "#faf9fc",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          textAlign: "center",
          background:
            "linear-gradient(90deg, #9417E2 0%, #D90429 100%)",
          color: "#fff",
          borderRadius: 3,
        }}
      >
        <SupportIcon sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h4" fontWeight={700}>
          Developer Help Center
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Your one-stop resource for CompareProjects developer support,
          documentation, and technical help.
        </Typography>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Documentation Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <DocIcon sx={{ fontSize: 32, color: "#9417E2", mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Developer Docs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Access the CompareProjects API documentation, integration
                guidelines, and best practices for listing and data management.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                sx={{ color: "#9417E2", fontWeight: 600 }}
              >
                View Documentation
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Report Issue Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <BugIcon sx={{ fontSize: 32, color: "#D90429", mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Report an Issue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Facing issues with property uploads, dashboards, or API
                responses? Report them directly to our developer support team.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                sx={{ color: "#D90429", fontWeight: 600 }}
              >
                Submit Ticket
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* FAQs Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <InfoIcon sx={{ fontSize: 32, color: "#9417E2", mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Common Questions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Learn about verification timelines, approval policies, and
                common developer FAQs for a smooth onboarding experience.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                sx={{ color: "#9417E2", fontWeight: 600 }}
              >
                View FAQs
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Contact Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <MailIcon sx={{ fontSize: 32, color: "#D90429", mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Contact Support
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Need to talk to us directly? Our support team is available
                24/7 to help you with technical or business queries.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                sx={{ color: "#D90429", fontWeight: 600 }}
              >
                Email Support
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 5 }} />

      {/* Feedback Form */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 3,
          background: "#fff",
        }}
      >
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Share Feedback
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Help us improve the developer experience — let us know what you’d like
          to see or what could work better.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Your Name"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message / Feedback"
              variant="outlined"
              size="small"
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={12} textAlign="right">
            <Button
              variant="contained"
              sx={{
                bgcolor: "#9417E2",
                "&:hover": { bgcolor: "#7a0fc2" },
              }}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DeveloperSupport;
