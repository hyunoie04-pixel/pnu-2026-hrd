/**
 * 메인 페이지 (index.html) 제어 스크립트
 */

let allCourses = [];
let currentCategory = 'all';

// DOM 요소
const searchInput = document.getElementById('search-input');
const isugubunSelect = document.getElementById('isugubun-select');
const bangshikSelect = document.getElementById('bangshik-select');
const daesangSelect = document.getElementById('daesang-select');
const sortSelect = document.getElementById('sort-select');
const categoryChipsContainer = document.getElementById('category-chips');
const courseGrid = document.getElementById('course-grid');
const resultCountEl = document.getElementById('result-count');
const resetBtn = document.getElementById('reset-filters-btn');
const refreshDataBtn = document.getElementById('refresh-data-btn');
const lastUpdatedTimeEl = document.getElementById('last-updated-time');

// 통계 지표 요소
const statTotalEl = document.getElementById('stat-total');
const statRequiredEl = document.getElementById('stat-required');
const statOnlineEl = document.getElementById('stat-online');
const statOfflineEl = document.getElementById('stat-offline');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  bindEvents();
});

// 데이터 로드
async function loadData() {
  showSkeletons();
  try {
    allCourses = await fetchCoursesData();
    renderStats(allCourses);
    renderCategoryChips(allCourses);
    applyFiltersAndRender();
    updateLastRefreshedTime();
  } catch (error) {
    showError(error.message);
  }
}

// 최종 갱신 시간 표시
function updateLastRefreshedTime() {
  if (!lastUpdatedTimeEl) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lastUpdatedTimeEl.textContent = `실시간 연동: ${timeStr} 갱신됨`;
}

// 핵심 통계 렌더링
function renderStats(courses) {
  const total = courses.length;
  const required = courses.filter(c => (c['이수구분'] || '').includes('필수')).length;
  const online = courses.filter(c => (c['교육방식'] || '').includes('온라인')).length;
  const offline = courses.filter(c => (c['교육방식'] || '').includes('집합') || (c['교육방식'] || '').includes('혼합')).length;

  if (statTotalEl) statTotalEl.textContent = `${total}개`;
  if (statRequiredEl) statRequiredEl.textContent = `${required}개`;
  if (statOnlineEl) statOnlineEl.textContent = `${online}개`;
  if (statOfflineEl) statOfflineEl.textContent = `${offline}개`;
}

// 분야 칩 동적 생성
function renderCategoryChips(courses) {
  if (!categoryChipsContainer) return;
  
  const categories = Array.from(new Set(courses.map(c => c['분야']).filter(Boolean)));

  let html = `
    <button type="button" data-category="all" 
      class="chip-btn px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap bg-blue-900 text-white shadow-sm border border-blue-900">
      전체 보기 (${courses.length})
    </button>
  `;

  categories.forEach(cat => {
    const count = courses.filter(c => c['분야'] === cat).length;
    html += `
      <button type="button" data-category="${cat}" 
        class="chip-btn px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-900 border border-slate-200">
        ${cat} <span class="text-xs opacity-75 ml-1">(${count})</span>
      </button>
    `;
  });

  categoryChipsContainer.innerHTML = html;

  // 칩 클릭 이벤트
  categoryChipsContainer.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selected = btn.getAttribute('data-category');
      currentCategory = selected;

      // 액티브 스타일 변경
      categoryChipsContainer.querySelectorAll('.chip-btn').forEach(b => {
        b.className = 'chip-btn px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-900 border border-slate-200';
      });
      btn.className = 'chip-btn px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap bg-blue-900 text-white shadow-sm border border-blue-900';

      applyFiltersAndRender();
    });
  });
}

// 이벤트 바인딩
function bindEvents() {
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyFiltersAndRender();
      }, 200);
    });
  }

  [isugubunSelect, bangshikSelect, daesangSelect, sortSelect].forEach(select => {
    if (select) {
      select.addEventListener('change', applyFiltersAndRender);
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (isugubunSelect) isugubunSelect.value = 'all';
      if (bangshikSelect) bangshikSelect.value = 'all';
      if (daesangSelect) daesangSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'code-asc';
      
      currentCategory = 'all';
      if (categoryChipsContainer) {
        categoryChipsContainer.querySelectorAll('.chip-btn').forEach(b => {
          if (b.getAttribute('data-category') === 'all') {
            b.className = 'chip-btn px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap bg-blue-900 text-white shadow-sm border border-blue-900';
          } else {
            b.className = 'chip-btn px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-900 border border-slate-200';
          }
        });
      }
      applyFiltersAndRender();
    });
  }

  if (refreshDataBtn) {
    refreshDataBtn.addEventListener('click', () => {
      loadData();
    });
  }
}

// 필터 적용 및 카드 렌더링
function applyFiltersAndRender() {
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const isugubun = isugubunSelect ? isugubunSelect.value : 'all';
  const bangshik = bangshikSelect ? bangshikSelect.value : 'all';
  const daesang = daesangSelect ? daesangSelect.value : 'all';
  const sort = sortSelect ? sortSelect.value : 'code-asc';

  let filtered = allCourses.filter(course => {
    // 1. 분야 필터
    if (currentCategory !== 'all' && course['분야'] !== currentCategory) {
      return false;
    }

    // 2. 이수구분 필터
    if (isugubun !== 'all') {
      if (isugubun === '필수' && !course['이수구분'].includes('필수')) return false;
      if (isugubun === '권장' && course['이수구분'] !== '권장') return false;
      if (isugubun === '선택' && course['이수구분'] !== '선택') return false;
    }

    // 3. 교육방식 필터
    if (bangshik !== 'all' && course['교육방식'] !== bangshik) {
      return false;
    }

    // 4. 대상 필터
    if (daesang !== 'all') {
      if (!course['대상'].includes(daesang)) return false;
    }

    // 5. 검색어 필터 (과정명, 한줄소개, 담당부서, 과정코드)
    if (query) {
      const matchName = (course['과정명'] || '').toLowerCase().includes(query);
      const matchDesc = (course['한줄소개'] || '').toLowerCase().includes(query);
      const matchDept = (course['담당부서'] || '').toLowerCase().includes(query);
      const matchCode = (course['과정코드'] || '').toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchDept && !matchCode) {
        return false;
      }
    }

    return true;
  });

  // 정렬
  filtered.sort((a, b) => {
    if (sort === 'code-asc') {
      return (a['과정코드'] || '').localeCompare(b['과정코드'] || '');
    } else if (sort === 'name-asc') {
      return (a['과정명'] || '').localeCompare(b['과정명'] || '');
    } else if (sort === 'time-desc') {
      const timeA = parseInt((a['교육시간'] || '0').replace(/[^0-9]/g, '')) || 0;
      const timeB = parseInt((b['교육시간'] || '0').replace(/[^0-9]/g, '')) || 0;
      return timeB - timeA;
    }
    return 0;
  });

  // 결과 수 표기
  if (resultCountEl) {
    resultCountEl.innerHTML = `총 <strong class="text-blue-900 font-bold">${filtered.length}</strong>개의 직무연수 과정이 있습니다.`;
  }

  // 카드 렌더링
  if (filtered.length === 0) {
    courseGrid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
        <svg class="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-slate-800">조건에 일치하는 과정이 없습니다.</h3>
        <p class="text-sm text-slate-500 mt-1">검색어를 변경하거나 필터를 초기화해 보세요.</p>
        <button onclick="document.getElementById('reset-filters-btn').click()" class="mt-4 px-4 py-2 bg-blue-50 text-blue-900 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-colors">
          필터 초기화
        </button>
      </div>
    `;
    return;
  }

  courseGrid.innerHTML = filtered.map(course => createCourseCardHtml(course)).join('');
}

// 개별 카드 HTML 생성
function createCourseCardHtml(course) {
  const code = course['과정코드'] || '';
  const title = course['과정명'] || '';
  const category = course['분야'] || '기타';
  const isugubun = course['이수구분'] || '선택';
  const bangshik = course['교육방식'] || '온라인';
  const time = course['교육시간'] || '-';
  const target = course['대상'] || '전 직원';
  const desc = course['한줄소개'] || '';
  const period = course['교육기간'] || '상시';
  const dept = course['담당부서'] || '';

  // 이수구분 배지 스타일
  let isugubunBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${isugubun}</span>`;
  if (isugubun.includes('필수')) {
    isugubunBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">★ ${isugubun}</span>`;
  } else if (isugubun === '권장') {
    isugubunBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">${isugubun}</span>`;
  }

  // 교육방식 배지
  let bangshikColor = 'bg-slate-100 text-slate-700';
  if (bangshik === '온라인') bangshikColor = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  if (bangshik === '집합') bangshikColor = 'bg-indigo-50 text-indigo-800 border border-indigo-200';
  if (bangshik === '혼합') bangshikColor = 'bg-purple-50 text-purple-800 border border-purple-200';

  return `
    <article class="course-card bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-blue-300">
      <div class="p-6">
        <!-- 상단 태그 영역 -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs font-semibold text-blue-700 tracking-wider">${code}</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${isugubunBadge}
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bangshikColor}">${bangshik}</span>
          </div>
        </div>

        <!-- 분야 & 과정명 -->
        <div class="mb-2">
          <span class="text-xs font-medium text-slate-500">${category}</span>
          <h3 class="text-lg font-bold text-slate-900 mt-1 leading-snug hover:text-blue-900 transition-colors">
            <a href="detail.html?code=${encodeURIComponent(code)}">${title}</a>
          </h3>
        </div>

        <!-- 한줄 소개 -->
        <p class="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed min-h-[2.5rem]">
          ${desc}
        </p>

        <!-- 세부 메타 정보 -->
        <div class="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">교육 시간 / 대상</span>
            <span class="font-medium text-slate-800">${time} · ${target}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">교육 기간</span>
            <span class="font-medium text-slate-800 truncate max-w-[180px]" title="${period}">${period}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">주관 부서</span>
            <span class="font-medium text-slate-800">${dept}</span>
          </div>
        </div>
      </div>

      <!-- 카드 하단 버튼 -->
      <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500">실시간 연동 완료</span>
        <a href="detail.html?code=${encodeURIComponent(code)}" 
          class="inline-flex items-center gap-1 text-sm font-semibold text-blue-900 hover:text-blue-700 transition-colors">
          상세보기
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  `;
}

// 스켈레톤 로딩 렌더링
function showSkeletons() {
  if (!courseGrid) return;
  const skeletons = Array(6).fill(0).map(() => `
    <div class="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-center mb-4">
          <div class="h-4 w-20 rounded skeleton"></div>
          <div class="h-5 w-16 rounded-full skeleton"></div>
        </div>
        <div class="h-3 w-16 rounded skeleton mb-2"></div>
        <div class="h-6 w-4/5 rounded skeleton mb-4"></div>
        <div class="space-y-2">
          <div class="h-3 w-full rounded skeleton"></div>
          <div class="h-3 w-3/4 rounded skeleton"></div>
        </div>
        <div class="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div class="h-3 w-full rounded skeleton"></div>
          <div class="h-3 w-full rounded skeleton"></div>
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between">
        <div class="h-4 w-16 rounded skeleton"></div>
        <div class="h-4 w-20 rounded skeleton"></div>
      </div>
    </div>
  `).join('');
  courseGrid.innerHTML = skeletons;
}

// 에러 화면 표시
function showError(message) {
  if (!courseGrid) return;
  courseGrid.innerHTML = `
    <div class="col-span-full py-16 text-center bg-red-50 rounded-2xl border border-red-200 p-8">
      <svg class="mx-auto h-12 w-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="text-lg font-bold text-red-800">데이터를 불러오는 중 문제가 발생했습니다</h3>
      <p class="text-sm text-red-600 mt-1">${message}</p>
      <button onclick="loadData()" class="mt-4 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
        다시 시도하기
      </button>
    </div>
  `;
}
