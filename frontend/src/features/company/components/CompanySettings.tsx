import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { companyService } from '../services/company.service';
import type { ICompany } from '../services/company.service';
import { LogoUpload } from './LogoUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Palette, Globe, Building2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const companySettingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

export function CompanySettings() {
  const [company, setCompany] = useState<ICompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
  });

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setIsLoading(true);
      const data = await companyService.getCompany();
      setCompany(data);
      setLogoUrl(data.logo);
      reset({
        name: data.name,
        domain: data.domain || '',
        primaryColor: data.primaryColor || '#3B82F6',
        secondaryColor: data.secondaryColor || '#1A1F2E',
      });
    } catch (error) {
      console.error('Failed to load company settings', error);
      showToast({
        title: 'Failed to load settings',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanySettingsFormData) => {
    try {
      setIsSaving(true);
      const updated = await companyService.updateCompany({
        name: data.name,
        domain: data.domain || null,
        logo: logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      });
      setCompany(updated);
      showToast({
        title: 'Settings saved',
        description: 'Company settings have been updated successfully',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to save company settings', error);
      showToast({
        title: 'Failed to save settings',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUploaded = (url: string) => {
    setLogoUrl(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading company settings...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Company Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your company branding and white-label settings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Company Information</CardTitle>
              </div>
              <CardDescription>Basic company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input
                  id="domain"
                  {...register('domain')}
                  placeholder="example.com"
                  className={errors.domain ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Set a custom domain for your company portal
                </p>
                {errors.domain && (
                  <p className="text-sm text-destructive">{errors.domain.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Company Logo</CardTitle>
              </div>
              <CardDescription>Upload your company logo</CardDescription>
            </CardHeader>
            <CardContent>
              <LogoUpload currentLogo={logoUrl} onUploaded={handleLogoUploaded} />
            </CardContent>
          </Card>

          {/* Branding Colors */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Branding Colors</CardTitle>
              </div>
              <CardDescription>Customize your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      {...register('primaryColor')}
                      className={errors.primaryColor ? 'border-destructive' : ''}
                    />
                    <div
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                      style={{ backgroundColor: primaryColor || '#3B82F6' }}
                      onClick={() => {
                        const input = document.getElementById('primaryColor') as HTMLInputElement;
                        input?.click();
                        input?.setAttribute('type', 'color');
                      }}
                    />
                    <Input
                      type="color"
                      value={primaryColor || '#3B82F6'}
                      onChange={(e) => setValue('primaryColor', e.target.value)}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                  </div>
                  {errors.primaryColor && (
                    <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      {...register('secondaryColor')}
                      className={errors.secondaryColor ? 'border-destructive' : ''}
                    />
                    <div
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                      style={{ backgroundColor: secondaryColor || '#1A1F2E' }}
                      onClick={() => {
                        const input = document.getElementById('secondaryColor') as HTMLInputElement;
                        input?.click();
                        input?.setAttribute('type', 'color');
                      }}
                    />
                    <Input
                      type="color"
                      value={secondaryColor || '#1A1F2E'}
                      onChange={(e) => setValue('secondaryColor', e.target.value)}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                  </div>
                  {errors.secondaryColor && (
                    <p className="text-sm text-destructive">{errors.secondaryColor.message}</p>
                  )}
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: secondaryColor || '#1A1F2E' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: primaryColor || '#3B82F6' }}
                  >
                    {company?.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="text-white font-medium">{company?.name || 'Company Name'}</div>
                    <div className="text-white/70 text-sm">Brand Preview</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={loadCompany} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

