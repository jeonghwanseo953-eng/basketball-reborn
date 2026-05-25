$ErrorActionPreference = "Stop"

$BaseUrl = $env:REBORN_API_BASE_URL
if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = "http://localhost:8081"
}

function Invoke-RebornApi {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Method,

        [Parameter(Mandatory = $true)]
        [string] $Path,

        [object] $Body
    )

    $uri = "$BaseUrl$Path"

    if ($null -eq $Body) {
        return Invoke-RestMethod -Method $Method -Uri $uri
    }

    $json = $Body | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return Invoke-RestMethod -Method $Method -Uri $uri -ContentType "application/json; charset=utf-8" -Body $bytes
}

function Remove-ExistingGameData {
    param([long] $GameDayId)

    $results = Invoke-RebornApi -Method GET -Path "/api/game-results?gameDayId=$GameDayId"
    foreach ($result in @($results)) {
        Invoke-RebornApi -Method DELETE -Path "/api/game-results/$($result.id)" | Out-Null
    }

    $teams = Invoke-RebornApi -Method GET -Path "/api/teams?gameDayId=$GameDayId"
    foreach ($team in @($teams)) {
        Invoke-RebornApi -Method DELETE -Path "/api/teams/$($team.id)" | Out-Null
    }
}

function Split-Members {
    param(
        [array] $Members,
        [int] $TeamCount,
        [int] $Offset
    )

    $groups = @()
    for ($i = 0; $i -lt $TeamCount; $i++) {
        $groups += ,@()
    }

    for ($i = 0; $i -lt $Members.Count; $i++) {
        $member = $Members[($i + $Offset) % $Members.Count]
        $groups[$i % $TeamCount] += $member
    }

    return $groups
}

function New-Team {
    param(
        [long] $GameDayId,
        [string] $Name,
        [array] $Members
    )

    Invoke-RebornApi -Method POST -Path "/api/teams" -Body @{
        gameDayId = $GameDayId
        name = $Name
        captainMemberId = $null
        memo = ""
        members = @($Members | ForEach-Object { @{ memberId = $_.id } })
    } | Out-Null
}

function New-ResultSet {
    param(
        [long] $GameDayId,
        [int] $MatchNo,
        [string] $Team1Name,
        [string] $Team2Name,
        [int] $Team1Final,
        [int] $Team2Final
    )

    $team1Scores = @(
        [Math]::Max(1, [Math]::Floor($Team1Final * 0.27)),
        [Math]::Max(1, [Math]::Floor($Team1Final * 0.51)),
        [Math]::Max(1, [Math]::Floor($Team1Final * 0.76)),
        $Team1Final
    )
    $team2Scores = @(
        [Math]::Max(1, [Math]::Floor($Team2Final * 0.25)),
        [Math]::Max(1, [Math]::Floor($Team2Final * 0.52)),
        [Math]::Max(1, [Math]::Floor($Team2Final * 0.74)),
        $Team2Final
    )

    for ($quarter = 1; $quarter -le 4; $quarter++) {
        Invoke-RebornApi -Method POST -Path "/api/game-results" -Body @{
            gameDayId = $GameDayId
            matchNo = $MatchNo
            quarterNo = $quarter
            team1Name = $Team1Name
            team2Name = $Team2Name
            team1Score = $team1Scores[$quarter - 1]
            team2Score = $team2Scores[$quarter - 1]
            memo = ""
        } | Out-Null
    }
}

function Seed-RegularResults {
    param(
        [object] $GameDay,
        [int] $Index
    )

    if ($GameDay.mode -eq "TWO_WAY") {
        New-ResultSet -GameDayId $GameDay.id -MatchNo 1 -Team1Name "BLACK" -Team2Name "WHITE" -Team1Final (42 + $Index) -Team2Final (38 + ($Index % 5))
        return
    }

    New-ResultSet -GameDayId $GameDay.id -MatchNo 1 -Team1Name "BLACK" -Team2Name "RED" -Team1Final (36 + $Index) -Team2Final (31 + ($Index % 4))
    New-ResultSet -GameDayId $GameDay.id -MatchNo 2 -Team1Name "BLACK" -Team2Name "WHITE" -Team1Final (34 + ($Index % 6)) -Team2Final (39 + $Index)
    New-ResultSet -GameDayId $GameDay.id -MatchNo 3 -Team1Name "WHITE" -Team2Name "RED" -Team1Final (40 + ($Index % 5)) -Team2Final (35 + $Index)
}

Write-Host "Seeding team/result test data into $BaseUrl"

$members = @()
foreach ($member in @(Invoke-RebornApi -Method GET -Path "/api/members")) {
    if ($member.status -eq "REGULAR") {
        $members += $member
    }
}

$gameDays = @()
foreach ($gameDay in @(Invoke-RebornApi -Method GET -Path "/api/game-days")) {
    $gameDays += $gameDay
}
$gameDays = @($gameDays | Sort-Object gameDate)

if ($members.Count -lt 6) {
    throw "At least 6 regular members are required to seed team test data."
}

$seedableGameDays = @($gameDays | Where-Object { $_.status -ne "HOLIDAY" -and $_.status -ne "CLOSED" })
$gameIndex = 0

foreach ($gameDay in $seedableGameDays) {
    $gameIndex++
    Write-Host " - $($gameDay.gameDate) $($gameDay.gameType) $($gameDay.mode)"

    Remove-ExistingGameData -GameDayId $gameDay.id

    $teamNames = if ($gameDay.mode -eq "TWO_WAY") { @("BLACK", "WHITE") } else { @("BLACK", "WHITE", "RED") }
    $groups = Split-Members -Members $members -TeamCount $teamNames.Count -Offset ($gameIndex - 1)

    for ($i = 0; $i -lt $teamNames.Count; $i++) {
        New-Team -GameDayId $gameDay.id -Name $teamNames[$i] -Members $groups[$i]
    }

    if ($gameDay.gameType -eq "REGULAR") {
        Seed-RegularResults -GameDay $gameDay -Index $gameIndex
    }
}

Write-Host "Done."
