# Claude Code - Obsidian Integration Logger
# 프로젝트별 일자별 노트 자동 생성 및 로깅

param(
    [string]$ObsidianVaultPath = "C:\Users\hhbbcho\Documents\Obsidian\MyVault",
    [string]$ProjectName = (Split-Path -Leaf (Get-Location)),
    [string]$NoteName,
    [switch]$StartSession,
    [switch]$EndSession,
    [string]$LogMessage
)

# 설정
$ProjectsFolder = Join-Path $ObsidianVaultPath "Projects"
$ProjectFolder = Join-Path $ProjectsFolder $ProjectName
# 노트명 결정 (NoteName이 지정되면 사용, 아니면 날짜)
if ($NoteName) {
    $NoteFile = "$NoteName.md"
} else {
    $Today = Get-Date -Format "yyyy-MM-dd"
    $NoteFile = "$Today.md"
}
$NoteFilePath = Join-Path $ProjectFolder $NoteFile
$TemplateFile = Join-Path $ObsidianVaultPath "Templates\claude-session-template.md"

# 프로젝트 폴더 생성
if (!(Test-Path $ProjectFolder)) {
    New-Item -ItemType Directory -Path $ProjectFolder -Force | Out-Null
    Write-Host "Project folder created: $ProjectName"
}

# 템플릿 생성 (존재하지 않을 경우)
if (!(Test-Path $TemplateFile)) {
    $TemplateDir = Split-Path $TemplateFile
    if (!(Test-Path $TemplateDir)) {
        New-Item -ItemType Directory -Path $TemplateDir -Force | Out-Null
    }

    $TemplateContent = @"
# Claude Code Session - {{date}}

## Project: {{project}}
## Date: {{date}}
## Working Directory: {{pwd}}

---

## Session Log

### {{time}} - Session Started

"@
    Set-Content -Path $TemplateFile -Value $TemplateContent -Encoding UTF8
    Write-Host "Template file created"
}

# 노트 초기화 (존재하지 않을 경우)
if (!(Test-Path $NoteFilePath)) {
    $TemplateContent = Get-Content $TemplateFile -Raw -Encoding UTF8
    $CurrentDate = Get-Date -Format "yyyy-MM-dd"
    $NoteTitle = if ($NoteName) { $NoteName } else { $CurrentDate }
    $NoteContent = $TemplateContent -replace "{{date}}", $CurrentDate -replace "{{project}}", $ProjectName -replace "{{pwd}}", (Get-Location) -replace "{{time}}", (Get-Date -Format "HH:mm")

    # 노트 제목을 템플릿에서 실제 노트명으로 변경
    $NoteContent = $NoteContent -replace "# Claude Code Session - {{date}}", "# $NoteTitle"

    Set-Content -Path $NoteFilePath -Value $NoteContent -Encoding UTF8
    Write-Host "Note created: $NoteFile"
}

# 세션 시작
if ($StartSession) {
    $StartMessage = @"

### $(Get-Date -Format "HH:mm") - New Claude Session Started
**Command**: ``claude``
**Working Directory**: ``$(Get-Location)``

"@
    Add-Content -Path $NoteFilePath -Value $StartMessage -Encoding UTF8
    Write-Host "Claude session started - logged"
}

# 세션 종료
if ($EndSession) {
    $EndMessage = @"

### $(Get-Date -Format "HH:mm") - Claude Session Ended

---

"@
    Add-Content -Path $NoteFilePath -Value $EndMessage -Encoding UTF8
    Write-Host "Claude session ended - logged"
}

# 로그 메시지 추가
if ($LogMessage) {
    $LogEntry = @"

#### $(Get-Date -Format "HH:mm:ss")
```
$LogMessage
```

"@
    Add-Content -Path $NoteFilePath -Value $LogEntry -Encoding UTF8
    Write-Host "Log message added"
}

# 정보 출력
Write-Host "Project: $ProjectName"
Write-Host "Note path: $NoteFilePath"
Write-Host "Usage:"
Write-Host "  Start session: .\claude-obsidian-logger.ps1 -StartSession"
Write-Host "  End session: .\claude-obsidian-logger.ps1 -EndSession"
Write-Host "  Add log: .\claude-obsidian-logger.ps1 -NoteName 'note-name' -LogMessage 'work content'"