'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Loader2, Check, X, Image as ImageIcon } from 'lucide-react';
import './CloudinaryUploadButton.css';

export default function CloudinaryUploadButton({
  value,
  onChange,
  folder = 'satvastones/products',
  label = 'Product Image',
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, or AVIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 8MB. Please upload a smaller image.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Upload failed. Please check network or Cloudinary settings.');
      }

      onChange(data.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setErrorMsg(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearImage = () => {
    onChange('');
    setErrorMsg('');
    setUploadSuccess(false);
  };

  return (
    <div className="cloudinary-uploader-container">
      <div className="uploader-header-row">
        <label className="uploader-label">{label}</label>
        {value && (
          <button
            type="button"
            className="uploader-remove-btn"
            onClick={handleClearImage}
            title="Remove image"
          >
            <X size={13} style={{ marginRight: 3 }} /> Clear Image
          </button>
        )}
      </div>

      <div className="uploader-action-area">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,image/avif"
          style={{ display: 'none' }}
        />

        {/* Upload Trigger Button */}
        <button
          type="button"
          className={`uploader-trigger-btn ${isUploading ? 'is-loading' : ''} ${uploadSuccess ? 'is-success' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="uploader-spin" style={{ marginRight: 8 }} />
              Uploading to Cloudinary...
            </>
          ) : uploadSuccess ? (
            <>
              <Check size={16} style={{ marginRight: 8, color: '#245738' }} />
              Uploaded to Cloudinary!
            </>
          ) : (
            <>
              <UploadCloud size={16} style={{ marginRight: 8 }} />
              Upload Image to Cloudinary
            </>
          )}
        </button>

        <span className="uploader-divider-text">or paste direct image URL</span>

        {/* Manual URL Input */}
        <div className="uploader-input-wrapper">
          <input
            type="url"
            placeholder="https://res.cloudinary.com/dqguetjwm/... or image link"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="uploader-url-input"
          />
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && <p className="uploader-error-text">{errorMsg}</p>}

      {/* Live Preview Stage */}
      {value && (
        <div className="uploader-preview-stage">
          <div className="preview-image-box">
            <Image
              src={value}
              alt="Uploaded Preview"
              fill
              sizes="120px"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className="preview-meta-info">
            <span className="preview-status-pill">
              {value.includes('cloudinary.com') ? 'Cloudinary Hosted' : 'External / Local'}
            </span>
            <p className="preview-url-display">{value}</p>
          </div>
        </div>
      )}
    </div>
  );
}
