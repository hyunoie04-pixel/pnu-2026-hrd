/**
 * 부산대학교 직무연수 구글 시트 연동 API 모듈
 * Google Sheets GViz CSV 엔드포인트 + PapaParse 실시간 파싱
 */

const SHEET_CONFIG = {
  sheetId: '1yR6YWV91O3v-h5RMRTGm5MNYJ7SfPXcVWLBRT3jywRE',
  sheetName: 'data',
  // headers=1 파라미터를 추가하여 1행만 헤더로 인식하도록 최적화
  baseUrl: 'https://docs.google.com/spreadsheets/d/1yR6YWV91O3v-h5RMRTGm5MNYJ7SfPXcVWLBRT3jywRE/gviz/tq?tqx=out:csv&sheet=data&headers=1'
};

/**
 * 구글 시트에서 최신 직무연수 데이터를 실시간으로 가져옵니다.
 * @returns {Promise<Array<Object>>} 과정 데이터 객체 배열
 */
async function fetchCoursesData() {
  const cacheBuster = `&_t=${Date.now()}`;
  const url = `${SHEET_CONFIG.baseUrl}${cacheBuster}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`구글 시트 데이터를 가져오는 데 실패했습니다. (HTTP ${response.status})`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          // 유효한 과정코드(PNU-)가 있는 데이터만 필터링
          const validCourses = results.data
            .map(row => {
              const cleaned = {};
              for (const key in row) {
                cleaned[key.trim()] = (row[key] || '').trim();
              }
              return cleaned;
            })
            .filter(item => item['과정코드'] && item['과정코드'].startsWith('PNU-'));
          
          resolve(validCourses);
        },
        error: (error) => {
          reject(new Error(`CSV 파싱 오류: ${error.message}`));
        }
      });
    });
  } catch (err) {
    console.error('fetchCoursesData Error:', err);
    throw err;
  }
}
