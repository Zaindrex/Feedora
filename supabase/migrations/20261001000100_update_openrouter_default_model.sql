UPDATE public.platform_settings
SET ai_model = 'inclusionai/ling-3.0-flash-sante:free'
WHERE id = 'default'
  AND ai_provider = 'openrouter'
  AND ai_model = 'qwen/qwen3.8-27b:free';