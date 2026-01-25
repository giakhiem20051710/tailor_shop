# Pencil Designs - Tailor Shop

Thư mục này chứa các file thiết kế Pencil cho dự án My Hiền Tailor.

## Cấu trúc file

```
designs/
├── design-system.pencil   # Design tokens & components
├── home.pencil            # Trang chủ
├── product-detail.pencil  # Chi tiết sản phẩm
├── dashboard.pencil       # Dashboard
└── README.md
```

## Cách sử dụng

### 1. Mở file thiết kế
- Click đúp vào file `.pencil` trong VS Code
- Pencil canvas sẽ mở trong tab mới

### 2. Các lệnh Pencil
Nhấn `Ctrl+Shift+P` và tìm:
- `Pencil: Open Canvas` - Mở canvas thiết kế
- `Pencil: Generate Code` - Xuất code React/HTML
- `Pencil: Sync with Figma` - Đồng bộ từ Figma

### 3. Tích hợp MCP
Pencil hỗ trợ MCP tools, cho phép AI tương tác với canvas:
- Tạo components từ prompt
- Chỉnh sửa layout
- Xuất code tự động

## Import từ Figma

1. Mở Figma và copy frame/component (`Ctrl+C`)
2. Trong Pencil canvas, paste (`Ctrl+V`)
3. Pencil sẽ chuyển đổi vectors, text và styles

## Design Tokens

Xem file `design-system.pencil` để biết:
- Color palette
- Typography scale
- Spacing system
- Border radius
- Shadows

## Xuất code

Pencil xuất code React + TailwindCSS phù hợp với cấu trúc dự án:
- Components → `src/components/`
- Styles → sử dụng Tailwind classes
