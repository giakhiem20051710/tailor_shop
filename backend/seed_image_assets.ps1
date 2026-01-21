$baseUrl = "http://localhost:8083/api/v1/image-assets"

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
        category = "style"
        type = "vest"
        description = "Vest nam công sở lịch lãm"
        tags = @("work", "office", "vest", "suit")
    },
    @{
        url = "https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "template"
        type = "dam"
        description = "Đầm dạ hội đỏ Noel"
        tags = @("party", "year-end", "dress", "dam")
    },
    @{
        url = "https://images.pexels.com/photos/7130498/pexels-photo-7130498.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "style"
        type = "mix_match"
        description = "Capsule Wardrobe Set"
        tags = @("casual", "daily", "trend")
    },
    @{
        url = "https://images.pexels.com/photos/6311651/pexels-photo-6311651.jpeg?auto=compress&cs=tinysrgb&w=1200"
        category = "style"
        type = "mix_match"
        description = "Fit Check Outfit"
        tags = @("trend", "social")
    }
)

Write-Host "Seeding $($assets.Count) assets..."

foreach ($asset in $assets) {
    try {
        $body = $asset | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ Created: $($asset.description)"
    } catch {
        Write-Host "❌ Failed: $($asset.description) - $_"
    }
}
