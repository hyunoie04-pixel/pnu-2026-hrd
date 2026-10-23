/**
 * 상세 페이지 (detail.html) 제어 스크립트
 */

let allCourses = [];
let currentCourse = null;

// DOM 요소
const loadingContainer = document.getElementById('detail-loading');
const errorContainer = document.getElementById('detail-error');
const errorMessageEl = document.getElementById('detail-error-message');
const contentContainer = document.getElementById('detail-content');
const refreshBtn = document.getElementById('refresh-detail-btn');
const lastUpdatedTimeEl = document.getElementById('last-updated-time');

document.addEventListener('DOMContentLoaded', () => {
  loadDetailData();

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDetailData();
    });
  }
});

// URL에서 ?code= 파라미터 추출
function getCourseCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('code') || '').trim();
}

// 데이터 로드 및 상세 화면 렌더링
async function loadDetailData() {
  const code = getCourseCodeFromUrl();

  showLoading();

  if (!code) {
    showError('과정 코드가 지정되지 않았습니다. 메인 목록에서 과정을 선택해 주세요.');
    return;
  }

  try {
    allCourses = await fetchCoursesData();
    const index = allCourses.findIndex(c => c['과정코드'] === code);

    if (index === -1) {
      showError(`요청하신 과정 코드(${code})에 해당하는 직무연수 과정을 찾을 수 없습니다.`);
      return;
    }

    currentCourse = allCourses[index];
    const prevCourse = index > 0 ? allCourses[index - 1] : null;
    const nextCourse = index < allCourses.length - 1 ? allCourses[index + 1] : null;

    renderCourseDetail(currentCourse, prevCourse, nextCourse);
    updateLastRefreshedTime();
  } catch (err) {
    showError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function updateLastRefreshedTime() {
  if (!lastUpdatedTimeEl) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lastUpdatedTimeEl.textContent = `실시간 연동: ${timeStr} 갱신됨`;
}

// 상세 페이지 렌더링
function renderCourseDetail(course, prevCourse, nextCourse) {
  const code = course['과정코드'] || '';
  const title = course['과정명'] || '';
  const category = course['분야'] || '일반';
  const target = course['대상'] || '전 직원';
  const isugubun = course['이수구분'] || '선택';
  const bangshik = course['교육방식'] || '온라인';
  const time = course['교육시간'] || '-';
  const capacity = course['정원'] || '-';
  const eduPeriod = course['교육기간'] || '상시';
  const applyPeriod = course['신청기간'] || '상시';
  const dept = course['담당부서'] || '-';
  const oneLineDesc = course['한줄소개'] || '';
  const detailDesc = course['상세소개'] || '';
  const goalsRaw = course['학습목표'] || '';
  const contentsRaw = course['주요내용'] || '';
  const applyLink = course['신청링크'] || '#';
  const contact = course['문의'] || dept;

  // 브라우저 탭 제목 변경
  document.title = `${title} (${code}) | 2026 부산대학교 직무연수`;

  // 브레드크럼 업데이트
  setText('breadcrumb-category', category);
  setText('breadcrumb-title', title);

  // 상단 헤더 배지
  const badgesContainer = document.getElementById('detail-badges');
  if (badgesContainer) {
    let isugubunBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25">${isugubun}</span>`;
    if (isugubun.includes('필수')) {
      isugubunBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-xs">★ ${isugubun} 이수과정</span>`;
    } else if (isugubun === '권장') {
      isugubunBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-sky-400 text-slate-950">${isugubun} 과정</span>`;
    }

    badgesContainer.innerHTML = `
      <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950/80 text-blue-200 border border-blue-700/60">${code}</span>
      <span class="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 border border-white/20">${category}</span>
      ${isugubunBadge}
      <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">${bangshik}</span>
    `;
  }

  // 타이틀 및 한줄소개
  setText('detail-title', title);
  setText('detail-oneline', oneLineDesc);

  // 핵심 요약 그리드 (6종)
  setText('meta-bangshik', bangshik);
  setText('meta-time', time);
  setText('meta-target', target);
  setText('meta-capacity', capacity);
  setText('meta-edu-period', eduPeriod);
  setText('meta-apply-period', applyPeriod);

  // 본문 상세소개
  setText('detail-description', detailDesc);

  // 학습목표 (' · ' 또는 '•' 구분자 분리)
  const goalsListEl = document.getElementById('detail-goals-list');
  if (goalsListEl) {
    const goals = goalsRaw.split(/\s*[·•]\s*/).map(s => s.trim()).filter(Boolean);
    if (goals.length > 0) {
      goalsListEl.innerHTML = goals.map(g => `
        <li class="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
          <div class="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
          <span class="text-sm sm:text-base font-medium text-slate-800">${g}</span>
        </li>
      `).join('');
    } else {
      goalsListEl.innerHTML = `<li class="text-sm text-slate-500">등록된 학습 목표가 없습니다.</li>`;
    }
  }

  // 주요 교육내용 (' · ' 또는 '•' 구분자 분리 -> 모듈 카드)
  const contentsListEl = document.getElementById('detail-contents-list');
  if (contentsListEl) {
    const modules = contentsRaw.split(/\s*[·•]\s*/).map(s => s.trim()).filter(Boolean);
    if (modules.length > 0) {
      contentsListEl.innerHTML = modules.map((mod, idx) => `
        <div class="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-blue-900 font-extrabold text-sm flex items-center justify-center shrink-0 border border-slate-200">
            0${idx + 1}
          </div>
          <div>
            <span class="text-xs font-semibold text-slate-400 block">MODULE 0${idx + 1}</span>
            <span class="text-sm sm:text-base font-bold text-slate-800">${mod}</span>
          </div>
        </div>
      `).join('');
    } else {
      contentsListEl.innerHTML = `<p class="text-sm text-slate-500">등록된 주요 내용이 없습니다.</p>`;
    }
  }

  // 우측 사이드바: 수강신청 카드 & 문의처
  setText('side-apply-period', applyPeriod);
  setText('side-edu-period', eduPeriod);
  setText('side-capacity', `${capacity} (${target})`);
  setText('side-dept', dept);
  setText('side-contact', contact);

  // 전화번호 추출해서 tel 링크 연결
  const phoneMatch = contact.match(/(\d{2,3}-\d{3,4}-\d{4})/);
  const callLinkEl = document.getElementById('side-call-link');
  if (callLinkEl) {
    if (phoneMatch) {
      callLinkEl.href = `tel:${phoneMatch[1]}`;
      callLinkEl.classList.remove('hidden');
    } else {
      callLinkEl.classList.add('hidden');
    }
  }

  // 수강신청 외부 링크 버튼
  const applyBtn = document.getElementById('side-apply-btn');
  const applyUrlText = document.getElementById('side-apply-url');
  if (applyBtn) {
    applyBtn.href = applyLink;
  }
  if (applyUrlText) {
    applyUrlText.textContent = applyLink;
  }

  // 이전 / 다음 과정 네비게이션
  renderPrevNextNav(prevCourse, nextCourse);

  // 같은 분야 연관 과정 렌더링
  renderRelatedCourses(course);

  // 화면 표시 전환
  loadingContainer.classList.add('hidden');
  errorContainer.classList.add('hidden');
  contentContainer.classList.remove('hidden');
}

// 이전/다음 과정 렌더링
function renderPrevNextNav(prev, next) {
  const navContainer = document.getElementById('prev-next-nav');
  if (!navContainer) return;

  const prevHtml = prev ? `
    <a href="detail.html?code=${encodeURIComponent(prev['과정코드'])}" 
      class="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
      <span class="text-xs font-semibold text-slate-400 group-hover:text-blue-700 flex items-center gap-1">
        ← 이전 연수 과정 (${prev['과정코드']})
      </span>
      <span class="text-sm sm:text-base font-bold text-slate-800 group-hover:text-blue-900 mt-1 truncate">${prev['과정명']}</span>
    </a>
  ` : `
    <div class="p-4 bg-slate-100/70 rounded-xl border border-slate-200/60 text-slate-400 flex flex-col justify-center">
      <span class="text-xs">첫 번째 과정입니다</span>
    </div>
  `;

  const nextHtml = next ? `
    <a href="detail.html?code=${encodeURIComponent(next['과정코드'])}" 
      class="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between text-right">
      <span class="text-xs font-semibold text-slate-400 group-hover:text-blue-700 flex items-center justify-end gap-1">
        다음 연수 과정 (${next['과정코드']}) →
      </span>
      <span class="text-sm sm:text-base font-bold text-slate-800 group-hover:text-blue-900 mt-1 truncate">${next['과정명']}</span>
    </a>
  ` : `
    <div class="p-4 bg-slate-100/70 rounded-xl border border-slate-200/60 text-slate-400 flex flex-col justify-center text-right">
      <span class="text-xs">마지막 과정입니다</span>
    </div>
  `;

  navContainer.innerHTML = prevHtml + nextHtml;
}

// 동일 분야 추천 과정 렌더링
function renderRelatedCourses(current) {
  const relatedContainer = document.getElementById('related-courses-grid');
  const relatedSection = document.getElementById('related-courses-section');
  if (!relatedContainer || !relatedSection) return;

  const related = allCourses
    .filter(c => c['분야'] === current['분야'] && c['과정코드'] !== current['과정코드'])
    .slice(0, 3);

  if (related.length === 0) {
    relatedSection.classList.add('hidden');
    return;
  }

  relatedSection.classList.remove('hidden');
  relatedContainer.innerHTML = related.map(c => `
    <a href="detail.html?code=${encodeURIComponent(c['과정코드'])}" 
      class="course-card bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="font-bold text-blue-800">${c['과정코드']}</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">${c['교육방식']} · ${c['교육시간']}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-base mb-1">${c['과정명']}</h4>
        <p class="text-xs text-slate-500 line-clamp-2">${c['한줄소개']}</p>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>${c['담당부서']}</span>
        <span class="font-semibold text-blue-900">보러가기 →</span>
      </div>
    </a>
  `).join('');
}

// 현재 페이지 URL 복사 기능
function copyCurrentPageUrl() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById('copy-toast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2500);
    }
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showLoading() {
  if (loadingContainer) loadingContainer.classList.remove('hidden');
  if (errorContainer) errorContainer.classList.add('hidden');
  if (contentContainer) contentContainer.classList.add('hidden');
}

function showError(msg) {
  if (loadingContainer) loadingContainer.classList.add('hidden');
  if (contentContainer) contentContainer.classList.add('hidden');
  if (errorContainer) {
    errorContainer.classList.remove('hidden');
    if (errorMessageEl) errorMessageEl.textContent = msg;
  }
}
