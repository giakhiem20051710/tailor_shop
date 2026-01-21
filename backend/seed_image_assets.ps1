$baseUrl = "http://localhost:8083/api/v1/image-assets"
$headers = @{ "Content-Type" = "application/json" }

$assets = @(
    @{
        url = "https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "ao_dai"
        description = "Áo dài truyền thống Tết"
        tags = @("tet", "ao_dai", "red")
    },
    @{
        url = "https://images.pexels.com/photos/6964070/pexels-photo-6964070.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "ao_dai"
        description = "Áo dài cách tân Tết 2025"
        tags = @("tet", "ao_dai", "family")
    },
    @{
        url = "https://images.pexels.com/photos/2567372/pexels-photo-2567372.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "vest"
        description = "Vest cưới chú rể"
        tags = @("wedding", "vest", "men")
    },
    @{
        url = "https://images.pexels.com/photos/3014858/pexels-photo-3014858.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "ao_dai"
        description = "Áo dài cưới cặp đôi"
        tags = @("wedding", "ao_dai", "couple")
    },
    @{
        url = "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "vest"
        description = "Vest nam công sở lịch lãm"
        tags = @("work", "office", "vest", "suit")
    },
    @{
        url = "https://images.pexels.com/photos/2983463/pexels-photo-2983463.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "vest"
        description = "Set vest nữ công sở"
        tags = @("work", "office", "women", "vest")
    },
    @{
        url = "https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "dam"
        description = "Đầm dạ hội đỏ Noel"
        tags = @("party", "year-end", "dress", "dam")
    },
    @{
        url = "https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "dam"
        description = "Đầm dự tiệc Year End Party"
        tags = @("party", "year-end", "sparkle")
    },
    @{
        url = "https://images.pexels.com/photos/2078265/pexels-photo-2078265.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "dam"
        description = "Đầm hoa nhẹ nhàng 8/3"
        tags = @("daily", "women-day", "dress")
    },
    @{
        url = "https://images.pexels.com/photos/196024/pexels-photo-196024.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "vest"
        description = "Vest tiệc sinh nhật sang trọng"
        tags = @("birthday", "party", "vest")
    },
    @{
        url = "https://images.pexels.com/photos/7130498/pexels-photo-7130498.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "mix_match"
        description = "Capsule Wardrobe Set"
        tags = @("casual", "daily", "trend")
    },
    @{
        url = "https://images.pexels.com/photos/6311651/pexels-photo-6311651.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "mix_match"
        description = "Fit Check Outfit"
        tags = @("trend", "social")
    }
)

Write-Host "Seeding $($assets.Count) image assets to $baseUrl..." -ForegroundColor Cyan

$count = 0
foreach ($asset in $assets) {
    $payload = @{
        url = $asset.url
        category = $asset.category
        type = $asset.type
        description = $asset.description
        tags = $asset.tags
        s3Key = "seed/img-$(Get-Random -Minimum 1000 -Maximum 9999)"
        thumbnailUrl = $asset.url
        largeUrl = $asset.url
    } | ConvertTo-Json -Depth 5 -Compress

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $payload -Headers $headers -ErrorAction Stop
        Write-Host "✅ Created: $($asset.description)" -ForegroundColor Green
        $count++
    }
    catch {
        Write-Host "❌ Failed: $($asset.description) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nCompleted! Successfully seeded $count/$($assets.Count) assets." -ForegroundColor Yellow
