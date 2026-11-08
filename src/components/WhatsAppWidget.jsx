'use client';
import { MessageCircle } from 'lucide-react';
import './WhatsAppWidget.css';

export default function WhatsAppWidget() {
  const phoneNumber = "919876543210";
  const message = encodeURIComponent("Hello Satvastones. I would like assistance with choosing an anti-tarnish piece.");

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="atelier-concierge-trigger"
      aria-label="Contact styling concierge on WhatsApp"
    >
      <MessageCircle size={18} strokeWidth={1.75} className="concierge-icon" aria-hidden="true" />
      <span className="concierge-text hide-on-mobile">Styling Concierge</span>
    </a>
  );
}
