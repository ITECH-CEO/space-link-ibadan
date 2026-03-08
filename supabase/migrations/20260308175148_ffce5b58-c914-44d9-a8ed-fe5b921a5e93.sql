
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS walkability_rating integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS distance_to_campus_km numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transport_options jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS utility_rating jsonb DEFAULT NULL;

COMMENT ON COLUMN public.properties.walkability_rating IS 'Rating 1-5 for walkability/trekability';
COMMENT ON COLUMN public.properties.distance_to_campus_km IS 'Distance to campus in kilometers';
COMMENT ON COLUMN public.properties.transport_options IS 'Array of {mode, cost_estimate, duration} objects';
COMMENT ON COLUMN public.properties.utility_rating IS '{power: 1-5, water: 1-5} reliability ratings';
