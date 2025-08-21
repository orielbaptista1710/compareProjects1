import React, { useState } from "react";
import Modal from "react-modal";
import "./PropertyGallery.css";

// import local images
import mainImg from "../images/banner.jpg";
import poolImg from "../images/bg_image.jpg";
import livingRoomImg from "../images/house.jpg";
import bedroomImg from "../images/house.jpg";
import gymImg from "../images/house.jpg";

const dummyMedia = [
  { src: mainImg, type: "image" },
  { src: poolImg, type: "image" },
  { src: livingRoomImg, type: "image" },
  { src: bedroomImg, type: "image" },
  { src: gymImg, type: "image" },
];

const PropertyGallery = ({ media }) => {
  if (!media || media.length === 0) {
    media = dummyMedia;
  }

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (mediaItem) => {
    if (!mediaItem) return;
    setSelectedMedia(mediaItem);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedMedia(null);
  };

  return (
    <div className="property-gallery">
      <div className="gallery-left">
        <img
          src={media[0].src}
          alt="Main"
          onClick={() => openModal(media[0])}
          className="main-image"
        />
      </div>

      <div className="gallery-right">
        {media.slice(1, 5).map((item, idx) => (
          <div
            key={idx}
            className={`thumbnail ${idx === 4 ? "show-more" : ""}`}
            onClick={() => openModal(item)}
          >
            <img src={item.src} alt={`Thumbnail ${idx + 1}`} />
            {idx === 4 && <div className="overlay">Show more photos</div>}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        className="lightbox"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        <button className="close-btn" onClick={closeModal} aria-label="Close modal">
          ×
        </button>

        <img src={selectedMedia?.src} alt="Large View" />
      </Modal>
    </div>
  );
};

export default PropertyGallery;
