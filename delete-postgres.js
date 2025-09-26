// Railway GraphQL API로 PostgreSQL 서비스 삭제 시도
const fetch = require('node-fetch');

const RAILWAY_TOKEN = '885817b1-fc08-4410-ba4d-144834c33cc9';
const API_ENDPOINT = 'https://backboard.railway.com/graphql/v2';

async function introspectSchema() {
  console.log('=== Railway GraphQL API 스키마 확인 ===');

  // GraphQL Introspection Query
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        mutationType {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: introspectionQuery
      })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ API 오류:', result.errors);
      return;
    }

    // 삭제 관련 mutation 찾기
    const mutations = result.data.__schema.mutationType.fields;
    const deleteMutations = mutations.filter(m =>
      m.name.toLowerCase().includes('delete') ||
      m.name.toLowerCase().includes('remove') ||
      m.name.toLowerCase().includes('destroy')
    );

    console.log('🔍 삭제 관련 Mutations:');
    deleteMutations.forEach(mutation => {
      console.log(`  - ${mutation.name}: ${mutation.description || '설명 없음'}`);
    });

    // 서비스 관련 mutation 찾기
    const serviceMutations = mutations.filter(m =>
      m.name.toLowerCase().includes('service')
    );

    console.log('🔧 서비스 관련 Mutations:');
    serviceMutations.forEach(mutation => {
      console.log(`  - ${mutation.name}: ${mutation.description || '설명 없음'}`);
    });

  } catch (error) {
    console.error('❌ 연결 오류:', error.message);
  }
}

async function deletePostgresService() {
  console.log('\n=== PostgreSQL 서비스 삭제 시도 ===');

  // Railway 대시보드에서 얻어야 할 정보
  // Project Token으로는 서비스 ID를 직접 조회할 수 없음
  console.log('⚠️  서비스 삭제를 위해 필요한 정보:');
  console.log('1. SERVICE_ID - Railway 대시보드에서 PostgreSQL 서비스 URL에서 확인');
  console.log('2. 예시: https://railway.app/project/PROJECT_ID/service/SERVICE_ID');
  console.log('');

  // PostgreSQL 서비스 ID를 수동으로 입력해야 함
  // 실제 서비스 ID를 알면 이 부분을 사용
  const POSTGRES_SERVICE_ID = 'REPLACE_WITH_ACTUAL_SERVICE_ID';

  if (POSTGRES_SERVICE_ID === 'REPLACE_WITH_ACTUAL_SERVICE_ID') {
    console.log('❌ PostgreSQL 서비스 ID가 필요합니다.');
    console.log('💡 Railway 대시보드 → Postgres 서비스 → URL에서 서비스 ID 복사');
    return;
  }

  const deleteMutation = `
    mutation DeleteService($serviceId: String!) {
      serviceDelete(id: $serviceId)
    }
  `;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: deleteMutation,
        variables: {
          serviceId: POSTGRES_SERVICE_ID
        }
      })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ 삭제 실패:', result.errors);
      return;
    }

    if (result.data.serviceDelete) {
      console.log('✅ PostgreSQL 서비스가 성공적으로 삭제되었습니다!');
    } else {
      console.log('❌ 삭제 결과를 확인할 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 연결 오류:', error.message);
  }
}

// 실행
async function main() {
  await introspectSchema();
  await deletePostgresService();
}

main();