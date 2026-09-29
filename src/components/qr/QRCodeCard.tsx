import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { Business } from '../../types';

export interface QRCodeCardProps {
  business: Business;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ business }) => {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrSize, setQrSize] = useState<number>(240);
  const [showBorder, setShowBorder] = useState<boolean>(true);
  const [frameColor, setFrameColor] = useState<string>('#0F917D');

  const configuredAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  const appOrigin = import.meta.env.DEV || !configuredAppUrl
    ? window.location.origin
    : configuredAppUrl.replace(/\/+$/, '');
  const reviewUrl = `${appOrigin}/review/${encodeURIComponent(business.slug)}`;
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reviewUrl);
    setCopiedLink(true);
    toast.success('Review link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${business.slug}-review-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
    toast.success('QR Code SVG downloaded successfully.');
  };

  const handleDownloadPNG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = qrSize * 2; // High-DPI export
    canvas.height = qrSize * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${business.slug}-review-qr.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('High-resolution QR Code PNG downloaded.');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* QR Code Presentation Box */}
      <div className="lg:col-span-7 flex justify-center">
        <div
          id="printable-qr-area"
          className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/90 shadow-float text-center flex flex-col items-center"
          style={{ borderColor: showBorder ? frameColor : '#E2E8F0' }}
        >
          {/* Business Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm mb-3 border border-slate-100"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-sm"
                style={{ backgroundColor: frameColor }}
              >
                {business.name.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-900">{business.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{business.category}</p>
          </div>

          {/* QR Code Area */}
          <div
            ref={qrRef}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-subtle flex items-center justify-center transition-all duration-300"
          >
            <QRCodeSVG
              value={reviewUrl}
              size={qrSize}
              level="H"
              includeMargin={false}
              fgColor="#0F172A"
              imageSettings={
                business.logo_url
                  ? {
                      src: business.logo_url,
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>

          <div className="mt-6 flex flex-col items-center">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ backgroundColor: `${frameColor}15`, color: frameColor }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Scan to share your experience
            </span>
            <p className="text-xs text-slate-400">
              Point your smartphone camera to quickly leave a review
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Customization */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">QR Code Actions</h3>
            <p className="text-xs text-slate-500 mt-1">
              Download digital assets or print tabletop display stands for your venue.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-center"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownloadPNG}
            >
              Download High-Res PNG
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownloadSVG}
            >
              Download Vector SVG
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print Table Stand
            </Button>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Public Customer URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={reviewUrl}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 select-all"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Customization Options */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customize Display
            </h4>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>QR Display Size</span>
                <span className="font-semibold">{qrSize}px</span>
              </div>
              <input
                type="range"
                min="180"
                max="320"
                step="10"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-1.5">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                {['#0F917D', '#2563EB', '#7C3AED', '#EA580C', '#0F172A'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setFrameColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      frameColor === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                    }`}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-700">Display colored accent border</span>
              <input
                type="checkbox"
                checked={showBorder}
                onChange={(e) => setShowBorder(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-slate-300 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
