import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import "./BrochurePreview.css";

// Use local worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const BrochurePreview = ({
  brochure = "/imageslcp/real_estate_data_specification.pdf",
  title = "Project Brochure",
}) => {
  const getFileName = (url) => url.split("/").pop() || "brochure.pdf";

  return (
    <div className="brochure-section">
      <h2 className="brochure-title">{title}</h2>

      <div className="brochure-card">
        <div className="preview-box">
          <Document file={brochure}>
            <Page
              pageNumber={1}
              width={200}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        <div className="brochure-actions">
          <a href={brochure} target="_blank" rel="noopener noreferrer" className="btn view-btn">
            <FontAwesomeIcon icon={faEye} /> View
          </a>
          <a href={brochure} download={getFileName(brochure)} className="btn download-btn">
            <FontAwesomeIcon icon={faDownload} /> Download
          </a>
        </div>
      </div>
    </div>
  );
};

export default BrochurePreview;
