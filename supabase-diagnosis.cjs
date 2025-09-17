const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return envVars;
  } catch (error) {
    console.error('❌ .env.local 파일을 읽을 수 없습니다:', error.message);
    return {};
  }
}

const env = loadEnvFile();
const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  console.error('📁 .env.local 파일을 확인하세요.');
  process.exit(1);
}

console.log('🔍 Supabase 진단 시작...');
console.log(`📡 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicConnection() {
  console.log('\n1️⃣ 기본 연결 테스트...');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      console.log('✅ REST API 연결 성공!');
      return true;
    } else {
      console.log('❌ REST API 연결 실패:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 네트워크 연결 실패:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n2️⃣ 테이블 존재 확인...');

  const tables = ['categories', 'shortcuts'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 존재함`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

async function testPermissions() {
  console.log('\n3️⃣ 데이터베이스 권한 테스트...');

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ SELECT 권한 실패:', error.message);
      return false;
    } else {
      console.log('✅ SELECT 권한 정상');

      const testId = 'test-' + Date.now();
      const { error: insertError } = await supabase
        .from('categories')
        .insert({
          id: testId,
          name: 'TEST_CATEGORY',
          user_id: 'test-user'
        });

      if (insertError) {
        console.log('❌ INSERT 권한 실패:', insertError.message);
        return false;
      } else {
        console.log('✅ INSERT 권한 정상');
        await supabase.from('categories').delete().eq('id', testId);
        console.log('🧹 테스트 데이터 정리됨');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ 권한 테스트 실패:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Supabase 완전 진단!\n');

  const connectionOk = await testBasicConnection();

  if (!connectionOk) {
    console.log('\n🚨 기본 연결에 실패했습니다.');
    process.exit(1);
  }

  await checkTables();
  const permissionsOk = await testPermissions();

  console.log('\n🎉 진단 완료!');

  if (connectionOk && permissionsOk) {
    console.log('🎉 모든 테스트 통과!');
    console.log('✅ Supabase 환경이 완벽하게 설정되었습니다!');
    console.log('🚀 이제 애플리케이션을 시작할 수 있습니다.');
  } else {
    console.log('⚠️ 일부 문제가 있습니다.');
  }

  process.exit(0);
}

main().catch(console.error);