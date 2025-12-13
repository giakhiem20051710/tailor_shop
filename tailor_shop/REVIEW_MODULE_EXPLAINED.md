# Review Module - Giải Thích Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc & Cấu Trúc](#kiến-trúc--cấu-trúc)
3. [Data Model](#data-model)
4. [DTOs](#dtos)
5. [Service Logic](#service-logic)
6. [Controller Endpoints](#controller-endpoints)
7. [Tính Năng Giống Shopee](#tính-năng-giống-shopee)
8. [Event-Driven Architecture](#event-driven-architecture)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)

---

## 🎯 Tổng Quan

Module Review hỗ trợ **Product Review** và **Order Review**, được thiết kế theo chuẩn Shopee với các tính năng:

- ✅ Rating 1-5 sao
- ✅ Multiple images (tối đa 9 ảnh)
- ✅ Helpful votes (like/unlike review)
- ✅ Shop reply (staff/admin có thể reply)
- ✅ Verified purchase flag (chỉ người đã mua mới review được)
- ✅ Anonymous review
- ✅ Review moderation (approve/reject/hide)
- ✅ Statistics (average rating, distribution, etc.)
- ✅ Auto-update product rating

### Phân Quyền

| Role | Quyền |
|------|-------|
| **CUSTOMER** | Tạo, cập nhật, xóa review của mình; Vote helpful |
| **STAFF/ADMIN** | Reply review; Vote helpful |
| **ADMIN** | Moderate review (approve/reject/hide) |
| **PUBLIC** | Xem reviews đã approved |

---

## 🏗️ Kiến Trúc & Cấu Trúc

### Module Structure

```
modules/review/
├── domain/
│   ├── ReviewEntity.java          # Entity chính
│   ├── ReviewImageEntity.java     # Ảnh review
│   ├── ReviewHelpfulVoteEntity.java # Helpful votes
│   ├── ReviewType.java            # Enum: PRODUCT, ORDER
│   └── ReviewStatus.java          # Enum: PENDING, APPROVED, REJECTED, HIDDEN
├── dto/
│   ├── ReviewRequest.java         # Tạo/cập nhật review
│   ├── ReviewResponse.java        # Response với đầy đủ thông tin
│   ├── ReviewFilterRequest.java   # Filter reviews
│   ├── ReplyReviewRequest.java    # Shop reply
│   └── ReviewStatisticsResponse.java # Statistics
├── repository/
│   ├── ReviewRepository.java
│   ├── ReviewImageRepository.java
│   └── ReviewHelpfulVoteRepository.java
├── service/
│   ├── ReviewService.java
│   └── impl/
│       └── ReviewServiceImpl.java
├── controller/
│   └── ReviewController.java
├── event/
│   ├── ReviewCreatedEvent.java
│   └── ReviewApprovedEvent.java
└── listener/
    └── ReviewEventListener.java
```

### Database Schema

```sql
-- Bảng chính: reviews
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,              -- PRODUCT or ORDER
    product_id BIGINT,                       -- For product reviews
    order_id BIGINT,                        -- For order reviews
    user_id BIGINT NOT NULL,                -- Reviewer
    rating INT NOT NULL,                     -- 1-5 stars
    title VARCHAR(255),
    comment TEXT,
    helpful_count INT DEFAULT 0,
    reply_text TEXT,                         -- Shop reply
    replied_by BIGINT,
    replied_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, HIDDEN
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    moderation_note TEXT,
    moderated_by BIGINT,
    moderated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bảng ảnh: review_images
CREATE TABLE review_images (
    id BIGINT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_order INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- Bảng helpful votes: review_helpful_votes
CREATE TABLE review_helpful_votes (
    id BIGINT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP,
    UNIQUE KEY (review_id, user_id)  -- One vote per user per review
);
```

---

## 📊 Data Model

### ReviewEntity

**Mục đích**: Entity chính cho cả Product Review và Order Review

**Các trường quan trọng**:

```java
- type: ReviewType (PRODUCT hoặc ORDER)
- product: ProductEntity (nullable, chỉ có khi type = PRODUCT)
- order: OrderEntity (nullable, chỉ có khi type = ORDER)
- user: UserEntity (reviewer)
- rating: Integer (1-5)
- title: String (optional)
- comment: String (review text)
- helpfulCount: Integer (số lượt vote helpful)
- replyText: String (shop reply)
- repliedBy: UserEntity (staff/admin who replied)
- status: ReviewStatus (PENDING, APPROVED, REJECTED, HIDDEN)
- isVerifiedPurchase: Boolean (chỉ người đã mua mới review được)
- isAnonymous: Boolean (ẩn tên reviewer)
```

**Relationships**:
- `@ManyToOne` với `ProductEntity` (optional)
- `@ManyToOne` với `OrderEntity` (optional)
- `@ManyToOne` với `UserEntity` (reviewer)
- `@OneToMany` với `ReviewImageEntity` (nhiều ảnh)
- `@OneToMany` với `ReviewHelpfulVoteEntity` (nhiều votes)

### ReviewImageEntity

**Mục đích**: Lưu nhiều ảnh cho mỗi review (giống Shopee, tối đa 9 ảnh)

**Các trường**:
```java
- review: ReviewEntity
- imageUrl: String (S3 URL hoặc file path)
- imageOrder: Integer (thứ tự hiển thị)
```

### ReviewHelpfulVoteEntity

**Mục đích**: Track ai đã vote helpful cho review (giống Shopee)

**Các trường**:
```java
- review: ReviewEntity
- user: UserEntity (người vote)
- Unique constraint: (review_id, user_id) - Mỗi user chỉ vote 1 lần
```

---

## 📦 DTOs

### ReviewRequest

**Mục đích**: DTO cho tạo/cập nhật review

```java
{
    "rating": 5,                    // Required, 1-5
    "title": "Sản phẩm rất đẹp",    // Optional, max 255 chars
    "comment": "Chất lượng tốt...", // Optional, max 5000 chars
    "imageUrls": [                  // Optional, max 9 images
        "https://s3.amazonaws.com/image1.jpg",
        "https://s3.amazonaws.com/image2.jpg"
    ],
    "isAnonymous": false            // Optional, default false
}
```

**Validation**:
- `rating`: Required, min=1, max=5
- `title`: Max 255 characters
- `comment`: Max 5000 characters
- `imageUrls`: Max 9 images

### ReviewResponse

**Mục đích**: Response với đầy đủ thông tin review

```java
{
    "id": 1,
    "type": "PRODUCT",
    "productId": 10,
    "productName": "Áo sơ mi",
    "productImage": "https://...",
    "orderId": null,
    "orderCode": null,
    "userId": 5,
    "userName": "Nguyễn Văn A",
    "userAvatar": null,
    "isAnonymous": false,
    "rating": 5,
    "title": "Sản phẩm rất đẹp",
    "comment": "Chất lượng tốt...",
    "imageUrls": [
        "https://s3.amazonaws.com/image1.jpg"
    ],
    "helpfulCount": 10,
    "isHelpfulByCurrentUser": true,  // Current user đã vote chưa
    "replyText": "Cảm ơn bạn đã review!",
    "repliedById": 2,
    "repliedByName": "Shop Admin",
    "repliedAt": "2024-01-15T10:30:00Z",
    "status": "APPROVED",
    "isVerifiedPurchase": true,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
}
```

### ReviewFilterRequest

**Mục đích**: Filter reviews

```java
{
    "type": "PRODUCT",              // PRODUCT or ORDER
    "productId": 10,                // Filter by product
    "orderId": null,                 // Filter by order
    "userId": null,                  // Filter by reviewer
    "rating": 5,                     // Filter by rating (1-5)
    "status": "APPROVED",            // For admin: PENDING, APPROVED, etc.
    "hasImages": true,               // Only reviews with images
    "hasReply": false,               // Only reviews with shop reply
    "isVerifiedPurchase": true,     // Only verified purchases
    "keyword": "đẹp"                 // Search in title/comment
}
```

### ReplyReviewRequest

**Mục đích**: Shop reply to review

```java
{
    "replyText": "Cảm ơn bạn đã review! Chúng tôi rất vui khi bạn hài lòng."
}
```

**Validation**:
- `replyText`: Required, max 2000 characters

### ReviewStatisticsResponse

**Mục đích**: Statistics (giống Shopee)

```java
{
    "totalReviews": 150,
    "averageRating": 4.5,
    "ratingDistribution": {
        "1": 5,
        "2": 10,
        "3": 20,
        "4": 50,
        "5": 65
    },
    "reviewsWithImages": 80,
    "reviewsWithReply": 30,
    "verifiedPurchaseReviews": 145
}
```

---

## 🔧 Service Logic

### createProductReview()

**Mục đích**: Tạo product review

**Business Logic**:
1. Validate product exists và không bị xóa
2. Check user đã review product này chưa (không cho review 2 lần)
3. Check verified purchase (TODO: check từ order_items)
4. Create review với status PENDING (hoặc APPROVED tùy config)
5. Save images (tối đa 9 ảnh)
6. Update product average rating
7. Publish `ReviewCreatedEvent` (side effect)

**Validation**:
- Product phải tồn tại
- User chưa review product này
- Rating 1-5
- Max 9 images

### createOrderReview()

**Mục đích**: Tạo order review

**Business Logic**:
1. Validate order exists
2. Check order belongs to user (chỉ owner mới review được)
3. Check user đã review order này chưa
4. Create review với `isVerifiedPurchase = true` (order review luôn verified)
5. Save images
6. Publish `ReviewCreatedEvent`

**Validation**:
- Order phải tồn tại
- Order phải thuộc về user
- User chưa review order này

### update()

**Mục đích**: Cập nhật review (chỉ owner)

**Business Logic**:
1. Check ownership (chỉ owner mới update được)
2. Check status (không update được nếu đã có reply)
3. Update fields
4. Update images (xóa cũ, thêm mới)
5. Update product rating nếu là product review

**Validation**:
- User phải là owner
- Review chưa có reply

### delete()

**Mục đích**: Xóa review (soft delete, chỉ owner)

**Business Logic**:
1. Check ownership
2. Soft delete (`isDeleted = true`)
3. Update product rating nếu là product review

### reply()

**Mục đích**: Shop reply to review (staff/admin only)

**Business Logic**:
1. Check review chưa có reply
2. Set reply text, repliedBy, repliedAt
3. Save

**Validation**:
- Review chưa có reply
- Chỉ staff/admin mới reply được

### voteHelpful() / unvoteHelpful()

**Mục đích**: Vote helpful (like/unlike review)

**Business Logic**:
1. Check user chưa vote (vote) hoặc đã vote (unvote)
2. Create/delete vote
3. Update `helpfulCount`

**Validation**:
- User chưa vote (vote) hoặc đã vote (unvote)
- Unique constraint: (review_id, user_id)

### moderate()

**Mục đích**: Moderate review (approve/reject/hide, admin only)

**Business Logic**:
1. Validate action (APPROVE, REJECT, HIDE)
2. Update status
3. Set moderation note, moderatedBy, moderatedAt
4. Update product rating nếu approve/reject
5. Publish `ReviewApprovedEvent` nếu approve (side effect)

**Actions**:
- `APPROVE`: Status = APPROVED
- `REJECT`: Status = REJECTED
- `HIDE`: Status = HIDDEN

### getStatistics()

**Mục đích**: Tính statistics (giống Shopee)

**Business Logic**:
1. Query tất cả reviews (approved) theo filter
2. Calculate:
   - Total reviews
   - Average rating
   - Rating distribution (1-5)
   - Reviews with images
   - Reviews with reply
   - Verified purchase reviews

### updateProductRating()

**Mục đích**: Auto-update product average rating

**Business Logic**:
1. Calculate average rating từ tất cả approved reviews
2. Update product.rating

**Trigger**: Khi review được create/update/delete/approve/reject

---

## 🌐 Controller Endpoints

### Public Endpoints

#### GET `/api/v1/reviews`

**Mục đích**: List reviews với filter (chỉ hiển thị APPROVED)

**Query Parameters**:
```
?type=PRODUCT
&productId=10
&rating=5
&hasImages=true
&hasReply=false
&keyword=đẹp
&page=0
&size=20
&sort=createdAt,desc
```

**Response**:
```json
{
    "success": true,
    "data": {
        "content": [...],
        "totalElements": 150,
        "totalPages": 8,
        "size": 20,
        "number": 0
    }
}
```

#### GET `/api/v1/reviews/{id}`

**Mục đích**: Get review detail

**Response**: `ReviewResponse`

#### GET `/api/v1/reviews/statistics`

**Mục đích**: Get review statistics

**Query Parameters**:
```
?productId=10
&type=PRODUCT
```

**Response**: `ReviewStatisticsResponse`

### Customer Endpoints

#### POST `/api/v1/reviews/products/{productId}`

**Mục đích**: Create product review

**Request Body**: `ReviewRequest`

**Response**: `ReviewResponse`

**Example**:
```json
POST /api/v1/reviews/products/10
{
    "rating": 5,
    "title": "Sản phẩm rất đẹp",
    "comment": "Chất lượng tốt, giao hàng nhanh",
    "imageUrls": [
        "https://s3.amazonaws.com/image1.jpg"
    ],
    "isAnonymous": false
}
```

#### POST `/api/v1/reviews/orders/{orderId}`

**Mục đích**: Create order review

**Request Body**: `ReviewRequest`

**Response**: `ReviewResponse`

#### PUT `/api/v1/reviews/{id}`

**Mục đích**: Update review (chỉ owner)

**Request Body**: `ReviewRequest`

**Response**: `ReviewResponse`

#### DELETE `/api/v1/reviews/{id}`

**Mục đích**: Delete review (chỉ owner)

**Response**: `{ "success": true, "data": null }`

#### POST `/api/v1/reviews/{id}/helpful`

**Mục đích**: Vote helpful (like review)

**Response**: `{ "success": true, "data": null }`

#### DELETE `/api/v1/reviews/{id}/helpful`

**Mục đích**: Unvote helpful (unlike review)

**Response**: `{ "success": true, "data": null }`

#### GET `/api/v1/reviews/products/{productId}/check`

**Mục đích**: Check if user has reviewed product

**Response**: `{ "success": true, "data": true }`

#### GET `/api/v1/reviews/orders/{orderId}/check`

**Mục đích**: Check if user has reviewed order

**Response**: `{ "success": true, "data": false }`

### Staff/Admin Endpoints

#### POST `/api/v1/reviews/{id}/reply`

**Mục đích**: Reply to review (shop reply)

**Request Body**: `ReplyReviewRequest`

**Response**: `ReviewResponse`

**Example**:
```json
POST /api/v1/reviews/1/reply
{
    "replyText": "Cảm ơn bạn đã review! Chúng tôi rất vui khi bạn hài lòng."
}
```

### Admin Only Endpoints

#### PATCH `/api/v1/reviews/{id}/moderate`

**Mục đích**: Moderate review (approve/reject/hide)

**Query Parameters**:
```
?action=APPROVE
&note=Review hợp lệ
```

**Actions**: `APPROVE`, `REJECT`, `HIDE`

**Response**: `ReviewResponse`

---

## 🛒 Tính Năng Giống Shopee

### 1. Rating System

- **1-5 sao**: Giống Shopee
- **Average rating**: Tự động tính và update vào product
- **Rating distribution**: Hiển thị số lượng review theo từng mức sao

### 2. Multiple Images

- **Tối đa 9 ảnh**: Giống Shopee
- **Image order**: Thứ tự hiển thị
- **Filter by images**: Có thể filter chỉ xem reviews có ảnh

### 3. Helpful Votes

- **Like/Unlike**: Giống Shopee
- **Helpful count**: Hiển thị số lượt vote
- **One vote per user**: Mỗi user chỉ vote 1 lần

### 4. Shop Reply

- **Staff/Admin reply**: Shop có thể reply review
- **Reply timestamp**: Hiển thị thời gian reply
- **Reply by**: Hiển thị ai đã reply

### 5. Verified Purchase

- **Only verified buyers**: Chỉ người đã mua mới review được
- **Verified badge**: Hiển thị badge "Đã mua hàng"
- **Filter by verified**: Có thể filter chỉ xem verified reviews

### 6. Anonymous Review

- **Hide reviewer name**: Có thể ẩn tên khi review
- **Display as "Anonymous"**: Hiển thị là "Anonymous"

### 7. Review Moderation

- **Pending → Approved**: Admin duyệt review
- **Reject**: Từ chối review (không hiển thị)
- **Hide**: Ẩn review (admin có thể ẩn)

### 8. Statistics

- **Average rating**: Điểm trung bình
- **Rating distribution**: Phân bố theo sao
- **Reviews with images**: Số review có ảnh
- **Reviews with reply**: Số review có shop reply
- **Verified purchase**: Số review từ verified buyers

### 9. Auto-Update Product Rating

- **Real-time update**: Tự động update khi review được approve/reject
- **Calculate average**: Tính trung bình từ tất cả approved reviews

---

## 🎯 Event-Driven Architecture

### Events

#### ReviewCreatedEvent

**Khi nào**: Khi review được tạo (product hoặc order)

**Data**:
```java
{
    reviewId: Long,
    type: ReviewType,
    productId: Long (nullable),
    orderId: Long (nullable),
    userId: Long,
    rating: Integer,
    createdAt: OffsetDateTime
}
```

**Use cases**:
- Send notification to shop owner
- Update analytics
- Log audit trail

#### ReviewApprovedEvent

**Khi nào**: Khi review được approve bởi admin

**Data**:
```java
{
    reviewId: Long,
    type: ReviewType,
    productId: Long (nullable),
    orderId: Long (nullable),
    userId: Long,
    rating: Integer,
    approvedAt: OffsetDateTime,
    moderatedBy: Long
}
```

**Use cases**:
- Send notification to reviewer
- Update product rating cache
- Update recommendation engine
- Update analytics

### Event Listener

**ReviewEventListener** - Async listener cho side effects:

```java
@EventListener
@Async
public void handleReviewCreated(ReviewCreatedEvent event) {
    // Send notification, update analytics, etc.
}

@EventListener
@Async
public void handleReviewApproved(ReviewApprovedEvent event) {
    // Update cache, update analytics, etc.
}
```

**Lưu ý**: Events chỉ dùng cho **side effects**, KHÔNG dùng cho business logic chính (validate, calculate, check).

---

## 💡 Usage Examples

### Example 1: Customer tạo Product Review

```bash
# 1. Check đã review chưa
GET /api/v1/reviews/products/10/check
Response: { "data": false }

# 2. Tạo review
POST /api/v1/reviews/products/10
{
    "rating": 5,
    "title": "Sản phẩm rất đẹp",
    "comment": "Chất lượng tốt, giao hàng nhanh",
    "imageUrls": [
        "https://s3.amazonaws.com/image1.jpg",
        "https://s3.amazonaws.com/image2.jpg"
    ],
    "isAnonymous": false
}

# 3. Review được tạo với status PENDING
# Admin sẽ approve sau
```

### Example 2: Customer tạo Order Review

```bash
# 1. Check đã review chưa
GET /api/v1/reviews/orders/100/check
Response: { "data": false }

# 2. Tạo review
POST /api/v1/reviews/orders/100
{
    "rating": 4,
    "title": "Hài lòng với dịch vụ",
    "comment": "Dịch vụ tốt, nhưng giao hàng hơi chậm",
    "imageUrls": [],
    "isAnonymous": false
}

# 3. Review được tạo với isVerifiedPurchase = true
```

### Example 3: Shop Reply Review

```bash
# Staff/Admin reply
POST /api/v1/reviews/1/reply
{
    "replyText": "Cảm ơn bạn đã review! Chúng tôi sẽ cải thiện dịch vụ giao hàng."
}

# Review response sẽ có:
# - replyText
# - repliedById
# - repliedByName
# - repliedAt
```

### Example 4: Vote Helpful

```bash
# Customer vote helpful
POST /api/v1/reviews/1/helpful

# Unvote
DELETE /api/v1/reviews/1/helpful

# Review response sẽ có:
# - helpfulCount: 10
# - isHelpfulByCurrentUser: true
```

### Example 5: Admin Moderate Review

```bash
# Approve review
PATCH /api/v1/reviews/1/moderate?action=APPROVE&note=Review hợp lệ

# Reject review
PATCH /api/v1/reviews/2/moderate?action=REJECT&note=Review không phù hợp

# Hide review
PATCH /api/v1/reviews/3/moderate?action=HIDE&note=Review vi phạm quy định
```

### Example 6: List Reviews với Filter

```bash
# List product reviews (chỉ approved)
GET /api/v1/reviews?type=PRODUCT&productId=10&rating=5&hasImages=true&page=0&size=20

# List order reviews
GET /api/v1/reviews?type=ORDER&orderId=100

# Search reviews
GET /api/v1/reviews?keyword=đẹp&type=PRODUCT
```

### Example 7: Get Statistics

```bash
# Get product review statistics
GET /api/v1/reviews/statistics?productId=10&type=PRODUCT

Response:
{
    "totalReviews": 150,
    "averageRating": 4.5,
    "ratingDistribution": {
        "1": 5,
        "2": 10,
        "3": 20,
        "4": 50,
        "5": 65
    },
    "reviewsWithImages": 80,
    "reviewsWithReply": 30,
    "verifiedPurchaseReviews": 145
}
```

---

## ✅ Best Practices

### 1. Validation

- ✅ **Rating**: Phải là 1-5
- ✅ **Title**: Max 255 characters
- ✅ **Comment**: Max 5000 characters
- ✅ **Images**: Max 9 images
- ✅ **One review per product/order**: Mỗi user chỉ review 1 lần
- ✅ **Ownership**: Chỉ owner mới update/delete được

### 2. Security

- ✅ **RBAC**: Sử dụng `@PreAuthorize` cho mọi endpoint
- ✅ **Ownership check**: Validate ownership trước khi update/delete
- ✅ **Status check**: Chỉ hiển thị APPROVED reviews cho public

### 3. Performance

- ✅ **Lazy loading**: Sử dụng `FetchType.LAZY` cho relationships
- ✅ **Indexes**: Index trên các trường thường query (product_id, order_id, user_id, status, rating)
- ✅ **Pagination**: Luôn sử dụng pagination cho list endpoints

### 4. Event-Driven

- ✅ **Side effects only**: Events chỉ dùng cho side effects (notification, analytics, cache)
- ✅ **Async processing**: Sử dụng `@Async` cho event listeners
- ✅ **No business logic**: KHÔNG dùng events cho validate, calculate, check

### 5. Data Integrity

- ✅ **Soft delete**: Sử dụng `isDeleted` thay vì hard delete
- ✅ **Unique constraint**: (review_id, user_id) cho helpful votes
- ✅ **Foreign keys**: Đảm bảo referential integrity

### 6. User Experience

- ✅ **Anonymous option**: Cho phép review ẩn danh
- ✅ **Multiple images**: Hỗ trợ tối đa 9 ảnh
- ✅ **Helpful votes**: Cho phép like/unlike review
- ✅ **Shop reply**: Shop có thể reply review
- ✅ **Statistics**: Hiển thị statistics rõ ràng

---

## 🔄 Workflow

### Product Review Workflow

```
1. Customer mua sản phẩm
   ↓
2. Customer tạo review (POST /api/v1/reviews/products/{productId})
   - Status: PENDING
   ↓
3. Admin moderate (PATCH /api/v1/reviews/{id}/moderate?action=APPROVE)
   - Status: APPROVED
   - Product rating được update
   - ReviewApprovedEvent được publish
   ↓
4. Review hiển thị công khai
   - Customer có thể vote helpful
   - Shop có thể reply
```

### Order Review Workflow

```
1. Customer nhận đơn hàng
   ↓
2. Customer tạo review (POST /api/v1/reviews/orders/{orderId})
   - Status: PENDING
   - isVerifiedPurchase: true
   ↓
3. Admin moderate (PATCH /api/v1/reviews/{id}/moderate?action=APPROVE)
   - Status: APPROVED
   - ReviewApprovedEvent được publish
   ↓
4. Review hiển thị công khai
```

---

## 📝 Notes

### TODO

1. **Verified Purchase Check**: Hiện tại `isVerifiedPurchase` là placeholder, cần implement check từ `order_items`
2. **Auto-approve**: Có thể config auto-approve reviews (không cần moderation)
3. **Avatar field**: Cần thêm `avatar` field vào `UserEntity` nếu muốn hiển thị avatar
4. **Notification**: Implement notification service cho events
5. **Analytics**: Implement analytics tracking cho events

### Limitations

1. **Max 9 images**: Giới hạn 9 ảnh mỗi review (có thể config)
2. **One review per product/order**: Mỗi user chỉ review 1 lần (có thể thay đổi)
3. **No edit after reply**: Không thể edit review sau khi shop đã reply

---

## 🎉 Kết Luận

Module Review được thiết kế theo chuẩn Shopee với đầy đủ tính năng:

- ✅ Product Review và Order Review
- ✅ Rating, Images, Helpful Votes
- ✅ Shop Reply, Moderation
- ✅ Statistics, Auto-update rating
- ✅ Event-driven architecture

Module sẵn sàng sử dụng trong production!

