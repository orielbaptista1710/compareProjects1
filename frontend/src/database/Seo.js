// src/components/Seo.js
import React from "react";
import { Title, Meta, Link } from "react-head";



const Seo = ({ 
  title, 
  description, 
  url, 
  image, 
  type = "website" 
}) => {
  return (
    <>
      {/* Basic SEO */}
      <Title>{title}</Title>
      <Meta name="description" content={description} />

      {/* Canonical + OpenGraph */}
      {url && <Link rel="canonical" href={url} />}
      {url && <Meta property="og:url" content={url} />}
      {image && <Meta property="og:image" content={image} />}

      <Meta property="og:title" content={title} />
      <Meta property="og:description" content={description} />
      <Meta property="og:type" content={type} />

      {/* Twitter (optional but good for social sharing) */}
      {/* {image && <Meta name="twitter:card" content="summary_large_image" />}
      <Meta name="twitter:title" content={title} />
      <Meta name="twitter:description" content={description} />
      {image && <Meta name="twitter:image" content={image} />} */}
    </>
  );
};

export default Seo;
