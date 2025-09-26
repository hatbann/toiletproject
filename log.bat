@echo off
REM 간단한 Obsidian 로깅 명령어

if "%~1"=="" (
    echo 사용법:
    echo   log "노트명" "로그 메시지"
    echo   log start          ^(세션 시작^)
    echo   log end            ^(세션 종료^)
    echo.
    echo 예시:
    echo   log "백엔드개발" "API 완성했음"
    echo   log start
    exit /b
)

if "%~1"=="start" (
    powershell -ExecutionPolicy Bypass -File ".\claude-obsidian-logger.ps1" -StartSession
    exit /b
)

if "%~1"=="end" (
    powershell -ExecutionPolicy Bypass -File ".\claude-obsidian-logger.ps1" -EndSession
    exit /b
)

if "%~2"=="" (
    echo 오류: 로그 메시지가 필요합니다.
    echo 사용법: log "노트명" "로그 메시지"
    exit /b
)

powershell -ExecutionPolicy Bypass -File ".\claude-obsidian-logger.ps1" -NoteName "%~1" -LogMessage "%~2"