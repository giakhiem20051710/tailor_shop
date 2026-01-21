import requests
import json
import random

BASE_URL = "http://localhost:8083/api/v1/image-assets"

# Data to seed
assets = [
    # TET
    {
        "url": "https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "ao_dai", "description": "Áo dài truyền thống Tết", "tags": ["tet", "ao_dai", "red"]
    },
    {
        "url": "https://images.pexels.com/photos/6964070/pexels-photo-6964070.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "ao_dai", "description": "Áo dài cách tân Tết 2025", "tags": ["tet", "ao_dai", "family"]
    },
    # WEDDING
    {
        "url": "https://images.pexels.com/photos/2567372/pexels-photo-2567372.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "vest", "description": "Vest cưới chú rể", "tags": ["wedding", "vest", "men"]
    },
    {
        "url": "https://images.pexels.com/photos/3014858/pexels-photo-3014858.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "ao_dai", "description": "Áo dài cưới cặp đôi", "tags": ["wedding", "ao_dai", "couple"]
    },
    # OFFICE / WORK
    {
        "url": "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "style", "type": "vest", "description": "Vest nam công sở lịch lãm", "tags": ["work", "office", "vest", "suit"]
    },
    {
        "url": "https://images.pexels.com/photos/2983463/pexels-photo-2983463.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "style", "type": "vest", "description": "Set vest nữ công sở", "tags": ["work", "office", "women", "vest"]
    },
    # PARTY / YEAR END
    {
        "url": "https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "dam", "description": "Đầm dạ hội đỏ Noel", "tags": ["party", "year-end", "dress", "dam"]
    },
    {
        "url": "https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "dam", "description": "Đầm dự tiệc Year End Party", "tags": ["party", "year-end", "sparkle"]
    },
    # CASUAL / WOMEN DAY
    {
        "url": "https://images.pexels.com/photos/2078265/pexels-photo-2078265.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "dam", "description": "Đầm hoa nhẹ nhàng 8/3", "tags": ["daily", "women-day", "dress"]
    },
     # BIRTHDAY
    {
        "url": "https://images.pexels.com/photos/196024/pexels-photo-196024.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "template", "type": "vest", "description": "Vest tiệc sinh nhật sang trọng", "tags": ["birthday", "party", "vest"]
    },
    # EXTRA
    {
        "url": "https://images.pexels.com/photos/7130498/pexels-photo-7130498.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "style", "type": "mix_match", "description": "Capsule Wardrobe Set", "tags": ["casual", "daily", "trend"]
    },
    {
        "url": "https://images.pexels.com/photos/6311651/pexels-photo-6311651.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "category": "style", "type": "mix_match", "description": "Fit Check Outfit", "tags": ["trend", "social"]
    }
]

def seed():
    print(f"Seeding {len(assets)} image assets to {BASE_URL}...")
    count = 0
    for asset in assets:
        try:
            # Construct payload
            payload = {
                "url": asset["url"],
                "category": asset["category"],
                "type": asset["type"],
                "description": asset["description"],
                "tags": asset["tags"],
                # Add recommended default fields if needed by backend
                "s3Key": f"seed/img-{random.randint(1000,9999)}", 
                "thumbnailUrl": asset["url"],
                "largeUrl": asset["url"]
            }
            
            headers = {'Content-Type': 'application/json'}
            response = requests.post(BASE_URL, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                print(f"✅ Created: {asset['description']}")
                count += 1
            else:
                print(f"❌ Failed: {asset['description']} - Status: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")

    print(f"\nCompleted! Successfully seeded {count}/{len(assets)} assets.")

if __name__ == "__main__":
    seed()
