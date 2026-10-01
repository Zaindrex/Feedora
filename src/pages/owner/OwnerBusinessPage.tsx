import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ExternalLink, Save } from 'lucide-react';
import { databaseService, isDirectGoogleReviewUrl, isOptionalHttpUrl } from '../../services/databaseService';
import { Business } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';

interface OwnerContextType {
  business: Business | null;
  setBusiness: (biz: Business) => void;
}

export const OwnerBusinessPage: React.FC = () => {
  const context = useOutletContext<OwnerContextType>();
  const activeBusiness = context?.business;
  const setBusiness = context?.setBusiness;
  const toast = useToast();

  const [formData, setFormData] = useState<Partial<Business>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setFormData(activeBusiness);
    }
  }, [activeBusiness]);

  const handleChange = (field: keyof Business, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !formData.name || !isDirectGoogleReviewUrl(formData.google_review_url || '')) {
      toast.error('Business name and a direct Google write-review URL are required.');
      return;
    }
    if (!isOptionalHttpUrl(formData.custom_review_url)) {
      toast.error('Custom Review Website URL must be an absolute HTTP or HTTPS URL.');
      return;
    }

    setIsSaving(true);
    const updatedBiz = {
      ...activeBusiness,
      ...formData,
      custom_review_url: formData.custom_review_url?.trim() || null,
      updated_at: new Date().toISOString(),
    } as Business;

    try {
      const savedBusiness = await databaseService.saveBusiness(updatedBiz);
      setFormData(savedBusiness);
      setBusiness?.(savedBusiness);
      setIsSaving(false);
      toast.success('Business profile updated successfully!');
    } catch (error) {
      setIsSaving(false);
      toast.error(error instanceof Error ? error.message : 'Could not save business profile.');
    }
  };

  const handleTestGoogleLink = () => {
    if (!isDirectGoogleReviewUrl(formData.google_review_url || '')) {
      toast.error('Enter a direct Google write-review URL first.');
      return;
    }
    window.open(formData.google_review_url, '_blank', 'noopener,noreferrer');
  };

  if (!activeBusiness) {
    return <div className="text-center py-12 text-slate-500">Loading business profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Venue Profile & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your business information, contact details, and Google Review URL
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Information Card */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            General Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            <Select
              label="Industry / Category"
              value={formData.category || 'Bar & Restaurant'}
              onChange={(e) => handleChange('category', e.target.value)}
              options={[
                { value: 'Bar & Restaurant', label: 'Bar & Restaurant' },
                { value: 'Cafe & Bakery', label: 'Cafe & Bakery' },
                { value: 'Hotel & Hospitality', label: 'Hotel & Hospitality' },
                { value: 'Salon & Spa', label: 'Salon & Spa' },
                { value: 'Clinic & Medical', label: 'Clinic & Medical' },
                { value: 'Retail Store', label: 'Retail Store' },
                { value: 'Gym & Fitness', label: 'Gym & Fitness' },
                { value: 'Services & Trades', label: 'Services & Trades' },
              ]}
            />
          </div>

          <Input
            label="Logo URL"
            value={formData.logo_url || ''}
            onChange={(e) => handleChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
            helperText="Provide a public URL to your venue's logo image."
          />

          <Textarea
            label="Venue Description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief tagline or description shown to patrons..."
            rows={3}
          />
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Custom Review Website
          </h3>
          <Input
            label="Custom Review Website URL"
            placeholder="https://example.com/reviews"
            value={formData.custom_review_url || ''}
            onChange={(e) => handleChange('custom_review_url', e.target.value)}
            helperText="Optional. Customers will be able to post their review on this website."
            type="url"
          />
        </Card>

        {/* Google Review URL Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Google Business Profile Review Link
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The exact destination where customers post their reviews
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={handleTestGoogleLink}
            >
              Test Review Link
            </Button>
          </div>

          <Input
            label="Direct Google Write-a-Review URL"
            value={formData.google_review_url || ''}
            onChange={(e) => handleChange('google_review_url', e.target.value)}
            placeholder="https://search.google.com/local/writereview?placeid=..."
            helperText="Use the direct Google write-review link for this business, not its Maps listing or reviews page."
            required
          />

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <p className="text-xs font-semibold text-slate-800">
              How to find your Google review link:
            </p>
            <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1">
              <li>Open your Google Business Profile dashboard or search your venue on Google.</li>
              <li>Click on "Ask for reviews" or "Get more reviews".</li>
              <li>Copy the short review link provided by Google and paste it above.</li>
            </ol>
          </div>
        </Card>

        {/* Location & Contact Details */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Location & Contact
          </h3>

          <Input
            label="Physical Address"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="412 Subterranean Ave, New York, NY 10012"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (212) 555-0199"
            />

            <Input
              label="Website"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://yourvenue.com"
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Venue Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
