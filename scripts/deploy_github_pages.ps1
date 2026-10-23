# GitHub 저장소 생성 및 GitHub Pages 자동 배포 스크립트
$ErrorActionPreference = "Stop"
$env:Path += ";C:\Users\hyebi\AppData\Local\github-copilot-git-2.53.0-4\cmd"
$workDir = "C:\Antigravity\Site development\2026-10-23"
Set-Location $workDir

$repoName = "pnu-2026-hrd"

Write-Host "1. GitHub 로그인 상태 확인 중..." -ForegroundColor Cyan
gh auth status

Write-Host "2. GitHub Public 저장소 ($repoName) 생성 및 소스 푸시 중..." -ForegroundColor Cyan
gh repo create $repoName --public --source=. --remote=origin --push

$owner = (gh api user --jq .login).Trim()
Write-Host "3. GitHub Pages 활성화 중 ($owner/$repoName)..." -ForegroundColor Cyan
gh api -X POST "repos/$owner/$repoName/pages" -f "source[branch]=main" -f "source[path]=/"

$repoUrl = "https://github.com/$owner/$repoName"
$pagesUrl = "https://$owner.github.io/$repoName/"

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "✅ 배포 요청 완료!" -ForegroundColor Green
Write-Host "📦 저장소 주소: $repoUrl"
Write-Host "🌐 배포 URL: $pagesUrl"
Write-Host "=========================================" -ForegroundColor Green
