'use client';
import { useCart } from '../context/CartContext';
import './ToastNotification.css';

export default function ToastNotification() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="toast-notification-banner" role="status" aria-live="polite">
      <span className="toast-message-text">{toastMessage}</span>
    </div>
  );
}
