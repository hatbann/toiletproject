@echo off
REM Claude Code 세션 종료 + Obsidian 로깅

echo 🔚 Claude Code 세션을 종료합니다...
echo 📝 Obsidian에 종료 로그를 기록합니다...

REM Obsidian 로거 실행 (세션 종료)
powershell -ExecutionPolicy Bypass -File ".\claude-obsidian-logger.ps1" -EndSession

echo.
echo ✅ 세션 종료 로깅 완료!
echo 📁 Obsidian에서 오늘의 노트를 확인하세요.
echo.

pause