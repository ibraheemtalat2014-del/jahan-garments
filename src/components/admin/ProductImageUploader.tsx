import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Star,
  Plus,
  Image as ImageIcon,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Maximize2,
} from 'lucide-react';

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

// Curated high-res Pakistani men's and boys' garment sample pictures
const PAKISTANI_CLOTHES_PRESETS = [
  {
    label: 'White Boski Suit',
    category: 'Shalwar Kameez',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Charcoal Kurta Pajama',
    category: 'Kurta',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Navy Embroidered Waistcoat',
    category: 'Waistcoat',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Emerald Green Festive Kurta',
    category: 'Kurta',
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Off-White Cotton Latha',
    category: 'Latha Cotton',
    url: 'https://images.unsplash.com/photo-1618886614638-80e3c15cd819?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Maroon Velvet Prince Coat',
    category: 'Formal / Wedding',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
  },
];

/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Keeps output under 1000x1200px at 0.82 JPEG quality (~40-80KB).
 */
function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images = [],
  onChange,
  maxImages = 6,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Handle uploaded files (either from click or drag & drop)
  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const compressedResults: string[] = [];
      for (const file of validFiles) {
        if (images.length + compressedResults.length >= maxImages) break;
        const dataUrl = await compressImageFile(file);
        compressedResults.push(dataUrl);
      }

      const updated = [...images, ...compressedResults].slice(0, maxImages);
      onChange(updated);
    } catch (err) {
      console.error('Error compressing image:', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Add via direct URL
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setUrlError('Please enter a valid HTTP/HTTPS image URL');
      return;
    }

    if (images.includes(trimmed)) {
      setUrlError('This picture is already added');
      return;
    }

    setUrlError('');
    onChange([...images, trimmed].slice(0, maxImages));
    setUrlInput('');
  };

  // Set image as primary (index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  };

  // Remove image
  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // Move image position
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    onChange(newImages);
  };

  // Add preset sample image
  const handleAddPreset = (url: string) => {
    if (images.includes(url)) {
      // If already added, make it primary
      const idx = images.indexOf(url);
      handleSetPrimary(idx);
      return;
    }
    onChange([...images, url].slice(0, maxImages));
  };

  return (
    <div className="space-y-3" id="admin-product-image-uploader">
      <div className="flex items-center justify-between">
        <div>
          <label className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">
            Garment Pictures & Imagery *
          </label>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Upload from your device, paste an image link, or select from curated Pakistani wear samples.
          </p>
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            images.length > 0
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {images.length}/{maxImages} pictures
        </span>
      </div>

      {/* Drag & Drop / Click Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:border-amber-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
            }
          }}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-3 space-y-2">
            <div className="w-7 h-7 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Optimizing and preparing pictures...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Click to browse photo from computer or phone, or drag & drop here
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Supports JPG, PNG, WEBP. Automatically auto-compressed for ultra-fast customer loading.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 shadow-2xs">
              <Plus className="w-3 h-3 text-amber-600" />
              <span>Select File(s)</span>
            </div>
          </div>
        )}
      </div>

      {/* Alternative: Add Image by Direct URL */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (urlError) setUrlError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="Or paste an image web URL (e.g. https://...)"
            className="w-full py-2 pl-3 pr-8 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          {urlInput && (
            <button
              type="button"
              onClick={() => setUrlInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleAddUrl()}
          disabled={!urlInput.trim() || images.length >= maxImages}
          className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add URL</span>
        </button>
      </div>
      {urlError && <p className="text-[11px] text-rose-600 font-medium">{urlError}</p>}

      {/* Curated Pakistani Garment Presets */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Quick Presets (Pakistani Clothes Library)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PAKISTANI_CLOTHES_PRESETS.map((preset) => {
            const isSelected = images.includes(preset.url);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleAddPreset(preset.url)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:border-amber-600 dark:text-amber-200 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:border-amber-300 dark:hover:border-zinc-700'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-zinc-400" />
                )}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Picture Gallery Thumbnails & Manager */}
      {images.length > 0 && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Current Photos ({images.length}) — Click star to set primary display photo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className={`group relative rounded-2xl border overflow-hidden transition-all bg-white dark:bg-zinc-900 ${
                    isPrimary
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Image container */}
                  <div className="aspect-3/4 w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={`Product preview ${index + 1}`}
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />

                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-zinc-950" />
                        <span>Primary</span>
                      </div>
                    )}

                    {/* Photo number tag */}
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white font-mono text-[10px] backdrop-blur-xs">
                      #{index + 1}
                    </div>

                    {/* Top right action buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalImg(imgUrl);
                        }}
                        title="Zoom preview"
                        className="p-1 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(index);
                        }}
                        title="Remove picture"
                        className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-700 text-white transition-colors shadow-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom overlay controls */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                      {!isPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(index)}
                          className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <Star className="w-3 h-3" />
                          <span>Make Primary</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-300">Catalog Cover</span>
                      )}

                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'left')}
                            title="Move earlier"
                            className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-[10px]"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'right')}
                            title="Move later"
                            className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-[10px]"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full preview modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-lg w-full bg-zinc-900 rounded-3xl overflow-hidden p-2">
            <button
              type="button"
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImg}
              alt="Full Preview"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
