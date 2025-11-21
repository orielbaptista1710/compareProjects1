import React from "react";
import { Star } from "lucide-react";
import { testimonials } from "../../../database/interiorsData";
import "./TestimonialsSection.css";
export default function TestimonialsSection() {
  return (
    <section className="interiors-testimonials-section">
      <div className="interiors-testimonials-bg"></div>

      <div className="interiors-testimonials-content">
        <p className="interiors-section-label light">Testimonials</p>
        <h2 className="interiors-section-heading light">What Our Clients Say</h2>

        <div className="interiors-testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.id} className="interiors-testimonial-card">
              <div className="interiors-testimonial-stars">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={18} />
                ))}
              </div>

              <p className="interiors-testimonial-content">"{t.content}"</p>

              <div className="interiors-testimonial-author">
                <h4>{t.name}</h4>
                <span>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
