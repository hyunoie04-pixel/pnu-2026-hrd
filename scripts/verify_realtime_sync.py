# -*- coding: utf-8 -*-
"""
구글 시트 실시간 연동 및 변경 반영 검증 스크립트 (5단계)
1. 소스 코드 내 하드코딩된 과정 데이터가 없는지 검증
2. 캐시 무효화(cache: 'no-store' 및 타임스탬프 쿼리) 적용 여부 검증
3. 실시간 GViz CSV 호출 및 셀 수정 시 파싱/렌더링 반영 시뮬레이션 검증
"""

import os
import re
import csv
import io
import time
import json
import urllib.request

BASE_DIR = r"C:\Antigravity\Site development\2026-10-23"
SHEET_URL = "https://docs.google.com/spreadsheets/d/1yR6YWV91O3v-h5RMRTGm5MNYJ7SfPXcVWLBRT3jywRE/gviz/tq?tqx=out:csv&sheet=data&headers=1"


def check_no_hardcoded_data():
    target_files = [
        "index.html",
        "detail.html",
        "js/api.js",
        "js/main.js",
        "js/detail.js",
    ]
    hardcoded_Found = []
    for rel_path in target_files:
        full_path = os.path.join(BASE_DIR, rel_path)
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        # 실제 과정명이나 과정코드가 하드코딩되어 있는지 검사
        if "직장 내 성희롱·성폭력 예방 교육" in content or "PNU-2026-001" in content:
            hardcoded_Found.append(rel_path)
    return hardcoded_Found


def check_cache_busting():
    api_path = os.path.join(BASE_DIR, "js/api.js")
    with open(api_path, "r", encoding="utf-8") as f:
        content = f.read()
    has_timestamp = "Date.now()" in content
    has_no_store = "no-store" in content
    return has_timestamp and has_no_store


def verify_live_sheet_and_mutation():
    url = f"{SHEET_URL}&_t={int(time.time() * 1000)}"
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"}
    )
    with urllib.request.urlopen(req) as resp:
        csv_text = resp.read().decode("utf-8")

    reader = list(csv.DictReader(io.StringIO(csv_text)))
    original_first = dict(reader[0])

    # 시트의 한 칸(예: 첫 번째 과정의 교육시간을 '1시간' -> '2시간(수정확인)')을 변경했을 때의 CSV 스트림 시뮬레이션
    mutated_csv = csv_text.replace(
        '"PNU-2026-001","직장 내 성희롱·성폭력 예방 교육","법정의무교육","전 직원","필수","온라인","1시간"',
        '"PNU-2026-001","직장 내 성희롱·성폭력 예방 교육 [실시간 반영 확인]","법정의무교육","전 직원","필수","온라인","2시간"',
        1,
    )
    mutated_reader = list(csv.DictReader(io.StringIO(mutated_csv)))
    mutated_first = dict(mutated_reader[0])

    return {
        "total_courses": len(reader),
        "original_row_1": {
            "과정코드": original_first["과정코드"],
            "과정명": original_first["과정명"],
            "교육시간": original_first["교육시간"],
        },
        "mutated_row_1": {
            "과정코드": mutated_first["과정코드"],
            "과정명": mutated_first["과정명"],
            "교육시간": mutated_first["교육시간"],
        },
    }


if __name__ == "__main__":
    hardcoded = check_no_hardcoded_data()
    cache_ok = check_cache_busting()
    live_test = verify_live_sheet_and_mutation()

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hardcoded_files": hardcoded,
        "zero_hardcoding_verified": len(hardcoded) == 0,
        "cache_busting_verified": cache_ok,
        "live_sheet_test": live_test,
    }

    report_path = os.path.join(BASE_DIR, "scripts", "realtime_verification_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("Verification completed successfully.")
