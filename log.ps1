# 간단한 Obsidian 로깅 명령어 (PowerShell 버전)
param(
    [string]$NoteName,
    [string]$Message
)

if (-not $NoteName) {
    Write-Host "사용법:"
    Write-Host "  .\log.ps1 '노트명' '메시지'"
    Write-Host "  .\log.ps1 start"
    Write-Host "  .\log.ps1 end"
    Write-Host ""
    Write-Host "예시:"
    Write-Host "  .\log.ps1 '백엔드개발' 'API 완성'"
    Write-Host "  .\log.ps1 start"
    exit
}

if ($NoteName -eq "start") {
    .\claude-obsidian-logger.ps1 -StartSession
    exit
}

if ($NoteName -eq "end") {
    .\claude-obsidian-logger.ps1 -EndSession
    exit
}

if (-not $Message) {
    Write-Host "오류: 메시지가 필요합니다."
    Write-Host "사용법: .\log.ps1 '노트명' '메시지'"
    exit
}

.\claude-obsidian-logger.ps1 -NoteName $NoteName -LogMessage $Message