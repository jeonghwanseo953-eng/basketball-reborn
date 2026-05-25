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

Write-Host "Seeding RE:BORN dev data into $BaseUrl"

$members = @()

$memberSeeds = @(
    @{ name = "김성호"; birthYear = 1980; height = 177; region = "관악"; position = "포워드"; role = "PRESIDENT"; status = "REGULAR"; memo = "" },
    @{ name = "한을"; birthYear = 1985; height = 182; region = "미상"; position = "가드"; role = "TREASURER"; status = "REGULAR"; memo = "" },
    @{ name = "강지문"; birthYear = 1980; height = 181; region = "서초구"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "홍통치"; birthYear = 1981; height = 180; region = "송파"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "강인구"; birthYear = 1978; height = 184; region = "다산"; position = "센터"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "권용"; birthYear = 1982; height = 183; region = "위례"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "임문규"; birthYear = 1993; height = 181; region = "송파"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "전성훈"; birthYear = 1974; height = 170; region = "강남구"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "서민균"; birthYear = 1981; height = 172; region = "강남구"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "곽호승"; birthYear = 1998; height = 177; region = "문정"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "서정환"; birthYear = 1995; height = 178; region = "송파"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "정지학"; birthYear = 1975; height = 177; region = "송파"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "황지환"; birthYear = 1995; height = 177; region = "송파"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "한경원"; birthYear = 1996; height = 190; region = "송파"; position = "센터"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "서윤서"; birthYear = 1976; height = 170; region = "광진구"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "오민형"; birthYear = 1997; height = 167; region = "미상"; position = "가드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "김웅기"; birthYear = 1989; height = 185; region = "미상"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "김창수"; birthYear = 1973; height = 178; region = "석촌"; position = "포워드"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "이성기"; birthYear = 1984; height = 185; region = "미상"; position = "센터"; role = "NONE"; status = "REGULAR"; memo = "" },
    @{ name = "유채훈"; birthYear = 1982; height = 179; region = "송파"; position = "포워드"; role = "NONE"; status = "RESTING"; restUntilDate = "2026-07-31"; memo = "손가락 재활" },
    @{ name = "장우식"; birthYear = 1995; height = 180; region = "광진구"; position = "포워드"; role = "NONE"; status = "RESTING"; restUntilDate = "2026-08-31"; memo = "부상 회복 중" },
    @{ name = "박류찬"; birthYear = 1997; height = 179; region = "성남"; position = "가드"; role = "NONE"; status = "WITHDRAWN"; memo = "부산 이사" }
)

foreach ($memberSeed in $memberSeeds) {
    $members += Invoke-RebornApi -Method POST -Path "/api/members" -Body @{
        name = $memberSeed.name
        birthYear = $memberSeed.birthYear
        height = $memberSeed.height
        position = $memberSeed.position
        region = $memberSeed.region
        role = $memberSeed.role
        status = $memberSeed.status
        restUntilDate = $memberSeed.restUntilDate
        memo = $memberSeed.memo
    }
}

$completedAprilGameDay1 = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-04-21"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "THREE_WAY"
    gameType = "REGULAR"
    status = "COMPLETED"
    memo = ""
}

$completedAprilGameDay2 = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-04-28"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "THREE_WAY"
    gameType = "REGULAR"
    status = "COMPLETED"
    memo = ""
}

$holidayGameDay = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-05-05"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "THREE_WAY"
    gameType = "REGULAR"
    status = "HOLIDAY"
    memo = ""
}

$completedRegularGameDay1 = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-05-12"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "THREE_WAY"
    gameType = "REGULAR"
    status = "COMPLETED"
    memo = ""
}

$completedRegularGameDay2 = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-05-19"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "THREE_WAY"
    gameType = "REGULAR"
    status = "COMPLETED"
    memo = ""
}

$completedExchangeGameDay = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-05-21"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "TWO_WAY"
    gameType = "EXCHANGE"
    status = "COMPLETED"
    memo = "가비아"
}

$gameDay = Invoke-RebornApi -Method POST -Path "/api/game-days" -Body @{
    gameDate = "2026-05-26"
    place = "송파청소년센터"
    startTime = "19:00"
    endTime = "21:00"
    mode = "THREE_WAY"
    gameType = "REGULAR"
    status = "SCHEDULED"
    memo = ""
}

Invoke-RebornApi -Method POST -Path "/api/attendance-votes" -Body @{
    gameDayId = $gameDay.id
    memberId = $members[0].id
    status = "ATTENDING"
    memo = "attending"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/attendance-votes" -Body @{
    gameDayId = $gameDay.id
    memberId = $members[1].id
    status = "ATTENDING"
    memo = "attending"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/attendance-votes" -Body @{
    gameDayId = $gameDay.id
    memberId = $members[2].id
    status = "UNDECIDED"
    memo = "needs confirmation"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/attendance-votes" -Body @{
    gameDayId = $gameDay.id
    voterName = "Guest A"
    status = "ABSENT"
    memo = "absent"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/teams" -Body @{
    gameDayId = $gameDay.id
    name = "BLACK"
    captainMemberId = $null
    memo = "black team"
    members = @(
        @{ memberId = $members[0].id },
        @{ memberId = $members[1].id }
    )
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/teams" -Body @{
    gameDayId = $gameDay.id
    name = "RED"
    captainMemberId = $null
    memo = "red team"
    members = @(
        @{ memberId = $members[2].id },
        @{ memberId = $members[3].id }
    )
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/game-results" -Body @{
    gameDayId = $gameDay.id
    matchNo = 1
    quarterNo = 1
    team1Name = "BLACK"
    team2Name = "RED"
    team1Score = 12
    team2Score = 10
    memo = "sample quarter 1"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/game-results" -Body @{
    gameDayId = $gameDay.id
    matchNo = 1
    quarterNo = 2
    team1Name = "BLACK"
    team2Name = "RED"
    team1Score = 8
    team2Score = 11
    memo = "sample quarter 2"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/notices" -Body @{
    title = "Fee Notice"
    content = "Please check this month fee and guest fee."
    authorName = "Treasurer"
    pinned = $true
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/notices" -Body @{
    title = "Next Game Schedule"
    content = "The next game will be held at Guro Gym."
    authorName = "Admin"
    pinned = $false
} | Out-Null

$feeMonth = Invoke-RebornApi -Method POST -Path "/api/fee-months" -Body @{
    year = [int](Get-Date).ToString("yyyy")
    month = [int](Get-Date).ToString("MM")
    roundCount = 4
    regularFeeAmount = 40000
    guestFeeAmount = 10000
    memo = "dev fee month"
}

Invoke-RebornApi -Method POST -Path "/api/fee-payments" -Body @{
    feeMonthId = $feeMonth.id
    memberId = $members[0].id
    amount = 40000
    status = "PAID"
    paidDate = (Get-Date).ToString("yyyy-MM-dd")
    memo = "regular payment"
} | Out-Null

Invoke-RebornApi -Method POST -Path "/api/fee-expenses" -Body @{
    feeMonthId = $feeMonth.id
    title = "Court Rental"
    amount = 30000
    expenseDate = (Get-Date).ToString("yyyy-MM-dd")
    memo = "gym rental"
} | Out-Null

Write-Host "Done."
Write-Host "Dashboard: $BaseUrl/api/dashboard"
Write-Host "Frontend:  http://127.0.0.1:5173"
