# Script Phân Loại Ảnh Tự Động

Dựa trên các mô tả ảnh bạn đã gửi, đây là phân tích và phân loại tự động:

## Phân Loại Theo Category

### Templates (Mẫu quần áo)
- Áo sơ mi, Blouse
- Quần tây, Trousers, Jeans
- Vest, Blazer, Jacket
- Váy, Đầm, Dress
- Áo dài (Traditional)
- Pantsuit, Jumpsuit
- Kebaya (Traditional Indonesian)

### Fabrics (Vải - texture/pattern)
- Tweed
- Lace
- Satin/Silk
- Denim
- Cotton
- Leather
- Knit
- Corduroy
- Batik

### Styles (Kiểu dáng)
- Gothic
- Vintage
- Modern
- Traditional
- Streetwear
- Formal
- Casual

## Phân Loại Theo Type (Loại quần áo)

1. **ao_so_mi** - Áo sơ mi, Blouse
2. **ao_dai** - Áo dài truyền thống
3. **ao_khoac** - Áo khoác, Jacket, Blazer, Cardigan
4. **vest** - Vest, Suit, Pantsuit
5. **quan_tay** - Quần tây, Trousers
6. **quan_jean** - Quần jean
7. **quan_short** - Quần short
8. **vay** - Váy
9. **vay_dam** - Đầm, Dress, Gown
10. **jumpsuit** - Jumpsuit
11. **ao_truyen_thong** - Áo truyền thống (Kebaya, Batik)

## Phân Loại Theo Gender

- **male** - Nam
- **female** - Nữ  
- **unisex** - Cả hai

## Cách Sử Dụng

### 1. Upload ảnh lên S3
```bash
# Upload từng ảnh hoặc bulk upload
aws s3 cp ./images/ s3://your-bucket/images/ --recursive
```

### 2. Gọi API để phân loại tự động
```bash
POST /api/v1/image-assets/upload
{
  "file": <multipart-file>,
  "description": "Áo sơ mi nam màu trắng",
  "category": "template",  # optional, sẽ tự động detect
  "type": "ao_so_mi",      # optional, sẽ tự động detect
  "gender": "male"         # optional, sẽ tự động detect
}
```

### 3. Filter ảnh theo category/type/gender
```bash
GET /api/v1/image-assets/filter?category=template&type=ao_so_mi&gender=male
```

### 4. Bulk Import từ danh sách ảnh
Sử dụng `BulkImageClassificationService` để phân loại hàng loạt:

```java
Map<String, String> imageDescriptions = new HashMap<>();
imageDescriptions.put("ao-so-mi-1.jpg", "Áo sơ mi nam màu trắng");
imageDescriptions.put("quan-tay-1.jpg", "Quần tây nam màu đen");
// ... thêm các ảnh khác

Map<String, ImageClassificationResult> results = 
    bulkService.classifyBatch(imageDescriptions);

// Tạo ImageAsset requests
List<ImageAssetRequest> requests = bulkService.createImageAssetRequests(
    results, s3Keys, urls);

// Lưu vào database
for (ImageAssetRequest request : requests) {
    imageAssetService.create(request);
}
```

## Ví Dụ Phân Loại Tự Động

| File Name | Description | Category | Type | Gender | Tags |
|-----------|------------|----------|------|--------|------|
| ao-so-mi-1.jpg | Áo sơ mi nam màu trắng | template | ao_so_mi | male | casual |
| quan-tay-1.jpg | Quần tây nam màu đen | template | quan_tay | male | formal |
| vay-dam-1.jpg | Đầm nữ màu hồng | template | vay_dam | female | elegant |
| tweed-fabric-1.jpg | Vải tweed màu be | fabric | unknown | unisex | tweed, textured |
| gothic-style-1.jpg | Phong cách gothic | style | unknown | unisex | gothic, dark |

## Lưu Ý

1. **Tên file nên có format chuẩn**: `{type}_{gender}_{color}_{index}.jpg`
   - Ví dụ: `ao_so_mi_male_white_001.jpg`
   - Hệ thống sẽ tự động parse và phân loại

2. **Nếu không có mô tả**: Hệ thống sẽ dựa vào tên file để phân loại

3. **Manual override**: Bạn có thể override category/type/gender khi upload nếu hệ thống phân loại sai

4. **Bulk upload**: Khi upload 1000+ ảnh, nên:
   - Chia nhỏ thành batch (100-200 ảnh/batch)
   - Kiểm tra kết quả phân loại trước khi lưu
   - Sử dụng `ClassificationSummary` để xem tổng quan

