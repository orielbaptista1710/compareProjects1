import React, { useState, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Eye, Download, FileText, AlertCircle } from "lucide-react";
import "./BrochurePreview.css";

import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const getDownloadUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
};

const BrochurePreview = ({ brochure, title = "Project Brochure" }) => {
  const [status, setStatus] = useState("loading");

  // Memoized outside JSX — stable reference, never triggers unnecessary reloads
  const pdfOptions = useMemo(() => ({ withCredentials: false }), []);

  if (!brochure) return null;

  if (import.meta.env.DEV && brochure.includes("/image/upload/")) {
    console.warn(
      "[BrochurePreview] URL contains /image/upload/ — re-upload as resource_type:'raw' in Cloudinary."
    );
  }

  return (
    <div className="brochure-section">
      <h2 className="brochure-title">{title}</h2>

      <div className="brochure-card">
        <div className="preview-box">

          {status === "loading" && (
            <div className="preview-skeleton">
              <FileText size={32} strokeWidth={1} className="skeleton-icon" />
            </div>
          )}

          {status === "error" && (
            <div className="preview-error">
              <AlertCircle size={22} strokeWidth={1.5} />
              <span>Preview unavailable</span>
              <a
                href={brochure}
                target="_blank"
                rel="noopener noreferrer"
                className="preview-error__link"
              >
                Open PDF directly
              </a>
            </div>
          )}

          {status !== "error" && (
            <div className={`pdf-wrap ${status === "ready" ? "loaded" : ""}`}>
              <Document
                file={brochure}
                options={pdfOptions}
                onLoadSuccess={() => setStatus("ready")}
                onLoadError={(err) => {
                  console.error("[BrochurePreview] PDF load failed:", err);
                  setStatus("error");
                }}
                loading={null}
              >
                <Page
                  pageNumber={1}
                  width={380}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          )}

          {status === "ready" && (
            <a
              href={brochure}
              target="_blank"
              rel="noopener noreferrer"
              className="view-btn"
            >
              <Eye size={15} strokeWidth={1.5} /> View
            </a>
          )}
        </div>

        <a
          href={getDownloadUrl(brochure)}
          target="_blank"
          rel="noopener noreferrer"
          className="download-btn"
        >
          <Download size={16} strokeWidth={1.5} /> Download Brochure
        </a>
      </div>
    </div>
  );
};

export default BrochurePreview;