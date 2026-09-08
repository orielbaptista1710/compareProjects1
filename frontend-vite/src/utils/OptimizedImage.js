// // src/components/common/OptimizedImage/OptimizedImage.jsx

// import { useEffect, useState } from "react";
// import { fallbackImg } from "../../../utils/propertyHelpers";

// const OptimizedImage = ({
//   src,
//   alt = "",
//   fallbackSrc = fallbackImg,
//   className = "",
//   wrapperClassName = "",
//   loading = "lazy",
//   priority = false,
//   width,
//   height,
//   sizes,
//   srcSet,
//   onLoad,
//   onError,
//   ...props
// }) => {
//   const initialSrc = src || fallbackSrc;

//   const [imageSrc, setImageSrc] = useState(initialSrc);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [hasError, setHasError] = useState(false);

//   // Reset state when the image changes
//   useEffect(() => {
//     setImageSrc(src || fallbackSrc);
//     setIsLoaded(false);
//     setHasError(false);
//   }, [src, fallbackSrc]);

//   const handleLoad = (event) => {
//     setIsLoaded(true);
//     onLoad?.(event);
//   };

//   const handleError = (event) => {
//     // Prevent infinite fallback loop
//     if (!hasError && imageSrc !== fallbackSrc) {
//       setHasError(true);
//       setImageSrc(fallbackSrc);
//       setIsLoaded(false);
//     }

//     onError?.(event);
//   };

//   return (
//     <div
//       className={`image-wrapper ${
//         isLoaded ? "is-loaded" : ""
//       } ${wrapperClassName}`}
//     >
//       {!isLoaded && (
//         <div
//           className="image-skeleton"
//           aria-hidden="true"
//         />
//       )}

//       <img
//         {...props}
//         src={imageSrc}
//         srcSet={!hasError ? srcSet : undefined}
//         sizes={!hasError ? sizes : undefined}
//         alt={alt}
//         width={width}
//         height={height}
//         loading={priority ? "eager" : loading}
//         fetchPriority={priority ? "high" : "auto"}
//         decoding="async"
//         onLoad={handleLoad}
//         onError={handleError}
//         className={className}
//       />
//     </div>
//   );
// };

// export default OptimizedImage;