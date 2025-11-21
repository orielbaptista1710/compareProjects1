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
      const safePrev = {
        coverImage: prev.coverImage || null,
        galleryImages: prev.galleryImages || [],
        floorplanImages: prev.floorplanImages || [],
        mediaFiles: prev.mediaFiles || [],
      };

      switch (activeTab) {
        case 'coverImage':
          return { ...safePrev, coverImage: urls[0] };
        case 'galleryImages':
          return { ...safePrev, galleryImages: [...safePrev.galleryImages, ...urls] };
        case 'floorplanImages':
          return { ...safePrev, floorplanImages: [...safePrev.floorplanImages, ...urls] };
        case 'mediaFiles':
          return { ...safePrev, mediaFiles: [...safePrev.mediaFiles, ...urls] };
        default:
          return safePrev;
      }
    });
  };

  const renderPreview = () => {
    switch (activeTab) {
      case 'coverImage':
        return mediaData.coverImage && <img src={mediaData.coverImage} alt="Cover" />;
      case 'galleryImages':
        return (mediaData.galleryImages || []).map((img, idx) => (
          <img key={idx} src={img} alt={`Gallery ${idx + 1}`} />
        ));
      case 'floorplanImages':
        return (mediaData.floorplanImages || []).map((img, idx) => (
          <img key={idx} src={img} alt={`Floorplan ${idx + 1}`} />
        ));
      case 'mediaFiles':
        return (mediaData.mediaFiles || []).map((media, idx) =>
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
}

export default MediaUploadTabs;
