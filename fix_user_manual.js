// Manual fix for user subscription state
const fixUserSubscription = async () => {
  const response = await fetch('https://ywzplutpijvwktwqurox.supabase.co/functions/v1/fix-subscription-state', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3enBsdXRwaWp2d2t0d3F1cm94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTQzNDc0MywiZXhwIjoyMDM1MDEwNzQzfQ.YqfGaKCCfJPUJdNHZfD9YAMQOqhq4o2YNgU6fBd4TUg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730'
    })
  });
  
  const result = await response.json();
  console.log('Fix result:', result);
};

fixUserSubscription();