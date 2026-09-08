// src/pages/<CustomerFolder>/CustomerProfilePage/tabs/OffersTab.jsx
import { Gift, Handshake, BadgePercent, Phone, Banknote, Clock, Home as HomeIcon } from "lucide-react";

const OFFERS = [
  { icon: Gift, title: "Exclusive Discounts", desc: "Save on select projects and launches" },
  { icon: Handshake, title: "Bulk Booking Benefits", desc: "Special pricing when booking multiple units" },
  { icon: BadgePercent, title: "Zero Brokerage", desc: "No brokerage fees on any transaction" },
  { icon: Phone, title: "Direct Developer Access", desc: "Speak directly with project developers" },
  { icon: Banknote, title: "Free Loan Guidance", desc: "Expert home loan assistance at no cost" },
  { icon: Clock, title: "Early Bird Offers", desc: "Access to pre-launch pricing windows" },
  { icon: HomeIcon, title: "Interior & Fitout Services", desc: "Exclusive rates on home interiors" },
];

const OffersTab = () => (
  <div className="tab-panel">
    <div className="panel-header">
      <h2>Exclusive Benefits</h2>
      <p className="panel-subtitle">Member-only perks available to you</p>
    </div>

    <div className="offers-grid">
      {OFFERS.map(({ icon: Icon, title, desc }) => (
        <div className="offer-card" key={title}>
          <div className="offer-icon">
            <Icon size={22} strokeWidth={1.75} />
          </div>
          <div className="offer-text">
            <strong>{title}</strong>
            <span>{desc}</span>
          </div>
          <div className="offer-arrow">›</div>
        </div>
      ))}
    </div>
  </div>
);

export default OffersTab;