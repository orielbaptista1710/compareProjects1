// BrochurePreview.jsx — no react-pdf, no pdfjs-dist
import { useState } from "react";
import { Eye, Download, FileText, AlertCircle } from "lucide-react";
import "./BrochurePreview.css";

const getThumbnailUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  return url.replace("/image/upload/", "/image/upload/pg_1,w_380,q_auto,f_auto/").replace(/\.pdf$/, ".jpg");
};

const getDownloadUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/image/upload/", "/image/upload/fl_attachment/");
};

const BrochurePreview = ({ brochure, title = "Project Brochure" }) => {
  const [status, setStatus] = useState("loading");
  if (!brochure) return null;
  const thumbnailUrl = getThumbnailUrl(brochure);

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
          {thumbnailUrl && status !== "error" && (
            <img
              src={thumbnailUrl}
              alt={`${title} preview`}
              width={380}
              loading="lazy"
              className={`pdf-wrap ${status === "ready" ? "loaded" : ""}`}
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
          )}
          {status === "error" && (
            <div className="preview-error">
              <AlertCircle size={22} strokeWidth={1.5} />
              <span>Preview unavailable</span>
              <a href={brochure} target="_blank" rel="noopener noreferrer" className="preview-error__link">
                Open PDF directly
              </a>
            </div>
          )}
          {status === "ready" && (
            <a href={brochure} target="_blank" rel="noopener noreferrer" className="view-btn">
              <Eye size={15} strokeWidth={1.5} /> View
            </a>
          )}
        </div>
        <a href={getDownloadUrl(brochure)} target="_blank" rel="noopener noreferrer" className="download-btn">
          <Download size={16} strokeWidth={1.5} /> Download Brochure
        </a>
      </div>
    </div>
  );
};

export default BrochurePreview;