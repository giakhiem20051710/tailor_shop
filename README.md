# 👔 Tailor Shop - E-Commerce Platform for Custom Tailoring

<div align="center">

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**A full-stack e-commerce platform for custom tailoring services with AI-powered features**

[Demo](#-screenshots) • [Installation](#️-installation) • [API Docs](#-api-documentation) • [Architecture](#-architecture)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#️-installation)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)

---

## ✨ Features

### 🛍️ E-Commerce Core
- **Product Catalog** - Browse custom suits, dresses, and traditional wear (Áo dài)
- **Advanced Filtering** - Filter by category, occasion, budget, and style
- **Shopping Cart** - Persistent cart with real-time updates
- **Order Management** - Full order lifecycle with status tracking
- **Favorites** - Save products, fabrics, and image assets

### 🧵 Custom Tailoring
- **Fabric Selection** - 100+ fabric types with detailed specifications
- **Measurement Guide** - Step-by-step measurement instructions
- **Tailoring Orders** - Custom specifications for each order
- **Fitting Appointments** - Schedule and manage fittings

### 🔥 Flash Sales
- **Time-limited Deals** - Countdown timers with real-time stock
- **Inventory Locking** - Prevent overselling with Redis atomic operations
- **Reservation System** - Hold items during checkout

### 🤖 AI-Powered Features
- **Gemini Vision AI** - Automatic image analysis and tagging
- **Smart Categorization** - AI-detected clothing types and occasions
- **Bulk Image Processing** - Process 200+ images with AI metadata

### 🔐 Security & Performance
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Redis Caching** - 5-30 minute TTL for product data
- **Rate Limiting** - 100 requests/minute per IP
- **Role-based Access** - Admin, Customer, Staff roles

### 📊 Admin Dashboard
- **Product Management** - CRUD with bulk upload support
- **Order Analytics** - Track sales and order status
- **Customer Management** - User administration
- **Fabric Inventory** - Stock management and alerts

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 21** | Core language with latest features |
| **Spring Boot 3.3** | Framework for REST API |
| **Spring Security** | Authentication & Authorization |
| **Spring Data JPA** | Database ORM |
| **MySQL 8** | Primary database |
| **Redis 7** | Caching & Rate limiting |
| **AWS S3** | Image storage |
| **Gemini AI** | Image analysis |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **React Router 6** | Navigation |
| **Axios** | HTTP client |
| **CSS3** | Styling (custom design system) |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD pipeline |
| **Prometheus** | Metrics collection |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│                   (Web Browser / Mobile)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 18)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Products │  │  Orders  │  │  Fabrics │  │  Admin   │       │
│  │   Page   │  │   Page   │  │   Page   │  │Dashboard │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                         Port: 5173                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (Spring Boot 3.3)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  API Layer (Controllers)                 │   │
│  │   /products  /orders  /fabrics  /auth  /flash-sales     │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │                  Business Logic (Services)               │   │
│  │  ProductService | OrderService | FabricService | etc.   │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │                  Data Layer (Repositories)               │   │
│  │         JPA Repositories + Custom Queries                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         Port: 8083                              │
└───────┬──────────────────────────────────┬──────────────────────┘
        │                                  │
        ▼                                  ▼
┌───────────────┐                  ┌───────────────┐
│    MySQL 8    │                  │    Redis 7    │
│   (Primary)   │                  │   (Cache)     │
│   Port: 3306  │                  │   Port: 6379  │
└───────────────┘                  └───────────────┘
        │
        │ External Services
        ▼
┌───────────────┐  ┌───────────────┐
│    AWS S3     │  │  Gemini AI    │
│   (Storage)   │  │   (Vision)    │
└───────────────┘  └───────────────┘
```

### Module Structure
```
tailor_shop/
├── modules/
│   ├── auth/           # Authentication & JWT
│   ├── product/        # Product catalog
│   ├── order/          # Order management
│   ├── fabric/         # Fabric inventory
│   ├── flashsale/      # Flash sales
│   ├── favorite/       # Favorites system
│   ├── review/         # Product reviews
│   ├── customer/       # Customer profiles
│   └── event/          # Event-driven architecture
├── config/
│   ├── security/       # JWT & Security config
│   ├── redis/          # Redis & Caching
│   ├── ratelimit/      # Rate limiting
│   └── storage/        # S3 configuration
└── shared/             # Shared utilities
```

---

## ⚙️ Installation

### Prerequisites
- **Java 21** or higher
- **Node.js 18** or higher
- **Docker & Docker Compose**
- **MySQL 8** (or use Docker)

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/tailor-shop.git
cd tailor-shop

# 2. Copy environment file
cp env.example .env

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:80
# Backend:  http://localhost:8083
# Swagger:  http://localhost:8083/swagger-ui.html
```

### Development Setup

#### Backend
```bash
cd tailor_shop

# Install dependencies & run
./mvnw spring-boot:run

# Or with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Frontend
```bash
cd my-react-app

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_URL=jdbc:mysql://localhost:3306/tailor_shop
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-256-bit-secret-key-min-32-chars

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 (Optional)
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# Gemini AI (Optional)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8083/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8083/v3/api-docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/products` | List products with filters |
| `GET` | `/api/v1/products/{key}` | Get product details |
| `POST` | `/api/v1/orders` | Create new order |
| `GET` | `/api/v1/fabrics` | List available fabrics |
| `POST` | `/api/v1/auth/login` | User authentication |
| `GET` | `/api/v1/flash-sales/active` | Get active flash sales |

### Authentication
```bash
# Login
curl -X POST http://localhost:8083/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "0123456789", "password": "password123"}'

# Use token in subsequent requests
curl http://localhost:8083/api/v1/orders \
  -H "Authorization: Bearer <your_token>"
```

---

## 📁 Project Structure

```
tailor-shop/
├── tailor_shop/              # Backend (Spring Boot)
│   ├── src/main/java/
│   │   └── com/example/tailor_shop/
│   │       ├── modules/      # Feature modules
│   │       ├── config/       # Configuration
│   │       └── shared/       # Shared utilities
│   ├── src/main/resources/
│   │   ├── application.yml   # Main config
│   │   └── db/migration/     # Flyway migrations
│   └── Dockerfile
│
├── my-react-app/             # Frontend (React)
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API services
│   │   └── hooks/            # Custom hooks
│   └── Dockerfile
│
├── docs/                     # Documentation
│   ├── index.html            # Docs homepage
│   ├── Redis_Deep_Dive.html  # Redis guide
│   └── *_Diagram.html        # Service diagrams
│
├── docker-compose.yml        # Docker orchestration
├── .github/workflows/        # CI/CD pipelines
└── README.md                 # This file
```

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Product Catalog
![Products Page](docs/screenshots/products-page.png)

### Product Detail
![Product Detail](docs/screenshots/product-detail.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Flash Sale
![Flash Sale](docs/screenshots/flash-sale.png)

</details>

> 💡 **Note**: Add your screenshots to `docs/screenshots/` folder

---

## 🧪 Testing

### Run Backend Tests
```bash
cd tailor_shop
./mvnw test
```

### Run Frontend Tests
```bash
cd my-react-app
npm test
```

### Test Coverage
```bash
# Generate coverage report
./mvnw test jacoco:report

# View report at: target/site/jacoco/index.html
```

---

## 🚀 Deployment

### Docker Production Build
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
See [HUONG_DAN_DEPLOY.md](HUONG_DAN_DEPLOY.md) for detailed instructions.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style
- Follow Java Google Style Guide
- Use ESLint/Prettier for JavaScript
- Write meaningful commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

<div align="center">

⭐ **Star this repository if you find it helpful!** ⭐

</div>
