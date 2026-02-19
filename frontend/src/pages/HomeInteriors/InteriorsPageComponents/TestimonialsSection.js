// import React from "react";
// import { Star } from "lucide-react";
// import { testimonials } from "../../../database/interiorsData";
// import "./TestimonialsSection.css";

// const TestimonialsSection = () => {
//   return (
//     <section 
//       className="interiors-testimonials-section"
//       aria-labelledby="testimonials-heading"
//     >
//       {/* Background Overlay */}
//       <div 
//         className="interiors-testimonials-bg" 
//         role="presentation"
//         aria-hidden="true"
//       />

//       <div className="interiors-testimonials-content">
//         {/* Header */}
//         <p className="interiors-section-label light">Testimonials</p>
//         <h2 
//           id="testimonials-heading" 
//           className="interiors-section-heading light"
//         >
//           What Our Clients Say
//         </h2>

//         {/* Testimonials Grid */}
//         <div 
//           className="interiors-testimonials-grid"
//           role="list"
//           aria-label="Customer testimonials"
//         >
//           {testimonials.map((testimonial) => (
//             <article 
//               key={testimonial.id} 
//               className="interiors-testimonial-card"
//               role="listitem"
//             >
//               {/* Star Rating */}
//               <div 
//                 className="interiors-testimonial-stars"
//                 role="img"
//                 aria-label={`${testimonial.rating} out of 5 stars`}
//               >
//                 {[...Array(testimonial.rating)].map((_, index) => (
//                   <Star 
//                     key={index} 
//                     size={18} 
//                     fill="currentColor"
//                     aria-hidden="true"
//                   />
//                 ))}
//               </div>

//               {/* Testimonial Content */}
//               <blockquote className="interiors-testimonial-content">
//                 "{testimonial.content}"
//               </blockquote>

//               {/* Author Info */}
//               <div className="interiors-testimonial-author">
//                 <h4>{testimonial.name}</h4>
//                 {testimonial.role && <span>{testimonial.role}</span>}
//               </div>
//             </article>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default React.memo(TestimonialsSection);