import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

interface LogoUploadProps {
  currentLogo?: string | null;
  onUploaded: (url: string) => void;
}

export function LogoUpload({ currentLogo, onUploaded }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        status: 'error',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast({
        title: 'File too large',
        description: 'Logo must be less than 2MB',
        status: 'error',
      });
      return;
    }

    // Upload file
    try {
      setIsUploading(true);

      // Convert to base64 for storage
      // In production, you'd upload to a file storage service (S3, etc.)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setPreview(result);
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update company logo
      const response = await axios.put('/company', {
        logo: base64,
      });

      onUploaded(response.data.data.logo);
      showToast({
        title: 'Logo uploaded',
        description: 'Company logo has been updated successfully',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to upload logo', error);
      showToast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
      setPreview(currentLogo || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    try {
      await axios.put('/company', {
        logo: null,
      });
      setPreview(null);
      onUploaded('');
      showToast({
        title: 'Logo removed',
        description: 'Company logo has been removed',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to remove logo', error);
      showToast({
        title: 'Failed to remove logo',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Preview */}
      {preview && (
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
            <img
              src={preview}
              alt="Company logo"
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Upload Button */}
      <div className="space-y-2">
        <Label>Upload Logo</Label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : preview ? 'Change Logo' : 'Upload Logo'}
          </Button>
          {!preview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>PNG, JPG up to 2MB</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended: Square image, at least 200x200px. Logo will be displayed in the header and email templates.
        </p>
      </div>
    </div>
  );
}

