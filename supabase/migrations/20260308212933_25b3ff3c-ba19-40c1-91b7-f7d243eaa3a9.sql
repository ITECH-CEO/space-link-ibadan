
SELECT cron.schedule(
  'inspection-reminder-daily',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://bnlqxfniihchhpparelz.supabase.co/functions/v1/inspection-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubHF4Zm5paWhjaGhwcGFyZWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzU2NTcsImV4cCI6MjA4Nzk1MTY1N30.Xia8uomZVMOh7S6fCErFkBG_T3jLTtUwSUoF4y3TjCY"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
)
