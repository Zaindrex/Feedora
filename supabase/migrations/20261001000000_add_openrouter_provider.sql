ALTER TABLE public.platform_settings
  DROP CONSTRAINT IF EXISTS platform_settings_ai_provider_check;

ALTER TABLE public.platform_settings
  ADD CONSTRAINT platform_settings_ai_provider_check
  CHECK (ai_provider IN ('gemini', 'openai', 'openrouter', 'hybrid_synthesizer'));

UPDATE public.platform_settings
SET ai_provider = 'openrouter',
    ai_model = 'qwen/qwen3.8-27b:free'
WHERE id = 'default'
  AND ai_provider = 'gemini'
  AND ai_model = 'gemini-2.5-flash';