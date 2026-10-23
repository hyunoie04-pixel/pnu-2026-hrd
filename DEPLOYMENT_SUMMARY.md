# 2026 부산대학교 직무연수 웹사이트 배포 결과 정리

- **작업 일자**: 2026-10-23
- **작업 폴더**: `C:\Antigravity\Site development\2026-10-23`

## 1. GitHub 저장소 및 배포 URL

| 구분 | 주소 (URL) | 상태 |
|---|---|---|
| **GitHub 저장소 (Public)** | https://github.com/hyunoie04-pixel/pnu-2026-hrd | 정상 업로드 완료 |
| **메인 페이지 (GitHub Pages)** | https://hyunoie04-pixel.github.io/pnu-2026-hrd/ | HTTP 200 (접속 정상) |
| **상세 페이지 예시 (`PNU-2026-001`)** | https://hyunoie04-pixel.github.io/pnu-2026-hrd/detail.html?code=PNU-2026-001 | HTTP 200 (접속 정상) |
| **연동 구글 시트** | https://docs.google.com/spreadsheets/d/1yR6YWV91O3v-h5RMRTGm5MNYJ7SfPXcVWLBRT3jywRE/edit | 실시간 연동 완료 |

## 2. 폴더 내 최종 파일 구조

- `PLAN.md`: 작업 기획서 (폴더 구조, 페이지별 컴포넌트, 구글 시트 연동/검색/필터 기능 분해)
- `DEPLOYMENT_SUMMARY.md`: 배포 URL 및 저장소 주소 최종 정리 문서
- `index.html`: 메인 페이지 (2026년 직무연수 전체 개요, 통계 대시보드, 검색·다중 필터, 카드 그리드)
- `detail.html`: 상세 페이지 (과정별 상세 소개, 학습목표 체크리스트, 커리큘럼 모듈, 수강신청 바로가기, 문의처)
- `css/style.css`: Pretendard 폰트 및 부산대학교(PNU Blue) 디자인 시스템 스타일시트
- `js/api.js`: 구글 시트 GViz CSV 실시간 패치 (`headers=1` 및 캐시 무효화) + PapaParse 파싱 모듈
- `js/main.js`: 메인 페이지 상태 관리, 다중 필터링, 디바운스 검색 및 카드 렌더링 스크립트
- `js/detail.js`: 상세 페이지 URL 파라미터(`?code=`) 파싱 및 상세 데이터 바인딩 스크립트
- `scripts/`: 데이터 검증, 실시간 반영 확인 스크립트(`verify_realtime_sync.py`), 자동 배포 스크립트(`deploy_github_pages.ps1`) 및 중간 분석 파일 일체
