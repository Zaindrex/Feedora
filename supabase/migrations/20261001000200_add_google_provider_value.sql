ALTER TABLE public.platform_settings
  DROP CONSTRAINT IF EXISTS platform_settings_ai_provider_check;

ALTER TABLE public.platform_settings
  ADD CONSTRAINT platform_settings_ai_provider_check
  CHECK (ai_provider IN ('google', 'gemini', 'openai', 'openrouter', 'hybrid_synthesizer'));

UPDATE public.platform_settings
SET ai_provider = 'google'
WHERE ai_provider = 'gemini';