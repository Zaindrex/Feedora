import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Shield, Save } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { DEFAULT_PLATFORM_SETTINGS } from '../../config';
import { PlatformSettings } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';

export const AdminSettingsPage: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void databaseService.getSettings().then((savedSettings) => {
      if (active) setSettings(savedSettings);
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not load platform settings.'));
    return () => { active = false; };
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await databaseService.saveSettings(settings);
      setIsSaving(false);
      toast.success('Platform configurations saved successfully.');
    } catch (error) {
      setIsSaving(false);
      toast.error(error instanceof Error ? error.message : 'Could not save platform settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global branding parameters, AI synthesis rules, and data maintenance
          </p>
        </div>

      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding & Appearance */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-slate-900">Branding & White-Label</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Application Brand Name"
              value={settings.productName}
              onChange={(e) => setSettings({ ...settings, productName: e.target.value })}
              helperText="Shown in headers, customer review pages, and emails."
              required
            />
            <Input
              label="Primary Hex Color"
              value={settings.primaryColor}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              helperText="Default brand accent color (#0F917D)."
            />
          </div>
        </Card>

        {/* AI Synthesis Configuration */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-slate-900">AI Review Generator Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Active AI Provider"
              value={settings.aiProvider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  aiProvider: e.target.value as PlatformSettings['aiProvider'],
                })
              }
              options={[
                { value: 'gemini', label: 'Google Gemini (server-side)' },
                { value: 'openai', label: 'OpenAI (server-side)' },
              ]}
              helperText="AI provider settings are applied by the server-side review function."
            />

            <Input
              label="Model Identifier"
              value={settings.aiModel}
              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
              placeholder="gemini-2.5-flash"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                <span>Creativity / Temperature</span>
                <span>{settings.aiTemperature}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.1"
                value={settings.aiTemperature}
                onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                className="w-full accent-primary h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Recommended 0.7 for natural, non-repetitive customer tone.
              </p>
            </div>

            <Input
              label="Max Output Token Characters"
              type="number"
              value={settings.maxOutputLength}
              onChange={(e) => setSettings({ ...settings, maxOutputLength: parseInt(e.target.value, 10) || 350 })}
              helperText="Enforces concise, punchy Google-style reviews."
            />
          </div>
        </Card>

        {/* Security & Audit Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-900">Security & Compliance</h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="text-xs font-semibold text-slate-800">Immutable Audit Logging</p>
              <p className="text-[11px] text-slate-500">
                Record all owner creation, password resets, and venue updates to public.audit_logs
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAuditLogging}
              onChange={(e) => setSettings({ ...settings, enableAuditLogging: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-slate-300 accent-primary cursor-pointer"
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Platform Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
