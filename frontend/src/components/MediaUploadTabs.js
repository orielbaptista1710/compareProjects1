import React, { useState } from 'react';
import './MediaUploadTabs.css';

const tabOptions = [
  { label: 'Cover Image', key: 'coverImage' },
  { label: 'Gallery Images', key: 'galleryImages' },
  { label: 'Floor Plan', key: 'floorplanImages' },
  { label: 'Media Files', key: 'mediaFiles' },
];

const MediaUploadTabs = ({ mediaData, setMediaData }) => {
  const [activeTab, setActiveTab] = useState('coverImage');
  const [isExclusive, setIsExclusive] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const urls = files.map((f) =>
      activeTab === 'mediaFiles'
        ? { type: f.type.includes('video') ? 'video' : 'image', src: URL.createObjectURL(f) }
        : URL.createObjectURL(f)
    );

    setMediaData((prev) => {
      switch (activeTab) {
        case 'coverImage':
          return { ...prev, coverImage: urls[0] };
        case 'galleryImages':
          return { ...prev, galleryImages: [...prev.galleryImages, ...urls] };
        case 'floorplanImages':
          return { ...prev, floorplanImages: [...prev.floorplanImages, ...urls] };
        case 'mediaFiles':
          return { ...prev, mediaFiles: [...prev.mediaFiles, ...urls] };
        default:
          return prev;
      }
    });
  };

  const renderPreview = () => {
    switch (activeTab) {
      case 'coverImage':
        return mediaData.coverImage && <img src={mediaData.coverImage} alt="Cover" />;
      case 'galleryImages':
        return mediaData.galleryImages.map((img, idx) => (
          <img key={idx} src={img} alt={`Gallery ${idx + 1}`} />
        ));
      case 'floorplanImages':
        return mediaData.floorplanImages.map((img, idx) => (
          <img key={idx} src={img} alt={`Floorplan ${idx + 1}`} />
        ));
      case 'mediaFiles':
        return mediaData.mediaFiles.map((media, idx) =>
          media.type === 'video' ? (
            <video key={idx} src={media.src} controls />
          ) : (
            <img key={idx} src={media.src} alt={`Media ${idx + 1}`} />
          )
        );
      default:
        return null;
    }
  };

  return (
    <div className="media-upload-tabs">
      {/* Tabs */}
      <nav className="tabs" role="tablist">
        {tabOptions.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Upload area */}
      <section className="upload-area">
        <label className="upload-label">
          Click or Drag files here
          <input
            type="file"
            accept={activeTab === 'mediaFiles' ? 'image/*,video/*' : 'image/*'}
            multiple={activeTab !== 'coverImage'}
            onChange={handleFileChange}
            hidden
          />
        </label>

        <div className="preview-gallery">{renderPreview()}</div>
      </section>

      {/* Guidelines */}
      <section className="guidelines">
        <p>
          <strong>Accepted formats:</strong> .jpg, .gif, .bmp, .png — Max size: 20MB, Min dimension: 600×400 px
        </p>
        <p>
          You can also email images to{' '}
          <a href="mailto:photos@magicbricks.com">photos@magicbricks.com</a>
        </p>

        <div className="image-guidelines">
          {[
            { src: '/images/accepted.jpg', alt: 'Accepted', valid: true },
            { src: '/images/text-image.jpg', alt: 'Image with text', valid: false },
            { src: '/images/blurry.jpg', alt: 'Blurry', valid: false },
            { src: '/images/watermark.jpg', alt: 'Watermark', valid: false },
          ].map(({ src, alt, valid }, idx) => (
            <div key={idx}>
              <img src={src} alt={alt} />
              <div className={valid ? 'tick' : 'cross'}>{valid ? '✔' : '✘'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Checkboxes */}
      <section className="checkboxes">
        <label>
          <input
            type="checkbox"
            checked={isExclusive}
            onChange={() => setIsExclusive(!isExclusive)}
          />{' '}
          I am posting this property <strong>'exclusively'</strong> on Magicbricks
        </label>
        <label>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={() => setAgreeTerms(!agreeTerms)}
          />{' '}
          I agree to Magicbricks T&C, Privacy Policy, & Cookie Policy
        </label>
        <label>
          <input
            type="checkbox"
            checked={whatsapp}
            onChange={() => setWhatsapp(!whatsapp)}
          />{' '}
          I want to receive responses on <span style={{ color: 'green' }}>🟢 WhatsApp</span>
        </label>
      </section>
    </div>
  );
};

export default MediaUploadTabs;
