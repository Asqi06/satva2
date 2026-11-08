import { Shield, Droplets, Feather, Truck, RotateCcw } from 'lucide-react';
import './TrustStrip.css';

export default function TrustStrip() {
  const pillars = [
    {
      icon: <Shield size={18} strokeWidth={1.5} />,
      title: "Anti-tarnish 18k gold",
      desc: "316L surgical steel with vacuum PVD bonding",
    },
    {
      icon: <Droplets size={18} strokeWidth={1.5} />,
      title: "Waterproof by design",
      desc: "Engineered for shower, workout, and daily wear",
    },
    {
      icon: <Feather size={18} strokeWidth={1.5} />,
      title: "Hypoallergenic",
      desc: "Nickel-free and cadmium-free for sensitive skin",
    },
    {
      icon: <Truck size={18} strokeWidth={1.5} />,
      title: "Free shipping over ₹499",
      desc: "Dispatched from Mumbai within 24 hours",
    },
    {
      icon: <RotateCcw size={18} strokeWidth={1.5} />,
      title: "7-day doorstep returns",
      desc: "Cash on delivery available across India",
    },
  ];

  return (
    <section className="atelier-trust-strip" aria-label="Brand standards">
      <div className="container trust-strip-inner">
        {pillars.map((pillar, idx) => (
          <div key={idx} className="trust-pillar-cell">
            <span className="trust-icon-frame" aria-hidden="true">
              {pillar.icon}
            </span>
            <div className="trust-copy">
              <h4 className="trust-title">{pillar.title}</h4>
              <p className="trust-caption">{pillar.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
