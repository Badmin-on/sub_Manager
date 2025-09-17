// 고급 Supabase 연결 진단
import { createClient } from '@supabase/supabase-js'

const configs = [
  {
    name: 'Current Test Config',
    url: 'https://mevtbqtqfaczvwbyrzlx.supabase.co',
    key: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzAzMjgzOCwiZXhwIjoyMDUyNjA4ODM4LCJhdWQiOiJzdXBhYmFzZSIsImlzcyI6InN1cGFiYXNlIn0.APP_Pp2jfOmdT1p1MEfjOLozvWhUOYjbZdR_Lx8hH3U'
  },
  {
    name: 'Alternative Config',
    url: 'https://mpvtbptqfozxwbyeyzix.supabase.co',
    key: 'YOUR_SUPABASE_ANON_KEY_HERE'
  }
];

async function testConnection(config) {
  console.log(`\n🔗 Testing ${config.name}...`);
  console.log(`📡 URL: ${config.url}`);
  console.log(`🔑 Key: ${config.key.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(config.url, config.key, {
      global: {
        fetch: (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        },
      },
    });

    // 1. Health check
    console.log('  🏥 Health check...');
    const response = await fetch(`${config.url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
      },
    });
    
    if (response.ok) {
      console.log('  ✅ REST API is accessible');
    } else {
      console.log(`  ❌ REST API failed: ${response.status} ${response.statusText}`);
      return false;
    }

    // 2. Simple query
    console.log('  📊 Testing table access...');
    const { data, error, status, statusText } = await supabase
      .from('categories')
      .select('count', { count: 'exact' });

    if (error) {
      console.log(`  ❌ Table access failed: ${error.message}`);
      console.log(`  📝 Error details:`, error);
      return false;
    }

    console.log(`  ✅ Table access successful!`);
    console.log(`  📊 Status: ${status} ${statusText}`);
    return true;

  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.message}`);
    if (error.cause) {
      console.log(`  🔍 Cause: ${error.cause.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Advanced Supabase Connection Diagnostic\n');
  
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) {
      console.log(`\n🎉 SUCCESS: ${config.name} is working!`);
      break;
    }
  }
  
  console.log('\n📋 Next steps if all tests fail:');
  console.log('1. Check if Supabase project is active');
  console.log('2. Verify API keys are correct');
  console.log('3. Check if tables exist in database');
  console.log('4. Review RLS (Row Level Security) policies');
  console.log('5. Ensure project is not paused/suspended');
}

runTests();