@echo off
REM Claude Code 세션 시작 + Obsidian 로깅

echo 🚀 Claude Code 세션을 시작합니다...
echo 📝 Obsidian에 세션 로그를 기록합니다...

REM Obsidian 로거 실행 (세션 시작)
powershell -ExecutionPolicy Bypass -File ".\claude-obsidian-logger.ps1" -StartSession

REM 여기에 실제 claude 명령어 대신 안내 메시지
echo.
echo ✅ 로깅 준비 완료!
echo 💡 이제 다음 명령어로 Claude Code를 시작하세요:
echo    claude
echo.
echo 📝 작업 내용을 로그에 남기려면:
echo    .\claude-obsidian-logger.ps1 -LogMessage "작업 내용"
echo.
echo 🔚 세션 종료시:
echo    .\claude-obsidian-logger.ps1 -EndSession
echo.

pause