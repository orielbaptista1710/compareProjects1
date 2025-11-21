import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Eye, Download } from "lucide-react"; // 👈 Lucide icons
import "./BrochurePreview.css";

// Use local worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const BrochurePreview = ({ brochure = "/fallback.pdf", title = "Project Brochure" }) => {
  const getFileName = (url) => url.split("/").pop() || "brochure.pdf";

  return (
    <div className="brochure-section">
      <h2 className="brochure-title">{title}</h2>

      <div className="brochure-card">
        <div className="preview-box">
          <Document file={brochure}>
            <Page
              pageNumber={1}
              width={400}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          <a
            href={brochure}
            target="_blank"
            rel="noopener noreferrer"
            className="view-btn"
          >
            <Eye size={18} strokeWidth={1.5} /> View Brochure
          </a>
        </div>

        <a
          href={brochure}
          download={getFileName(brochure)}
          className="download-btn"
        >
          <Download size={18} strokeWidth={1.5} /> Download Brochure
        </a>
      </div>
    </div>
  );
};

export default BrochurePreview;
