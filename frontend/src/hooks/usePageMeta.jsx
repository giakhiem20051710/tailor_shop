import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

// --- CẤU HÌNH MẶC ĐỊNH ---
const defaultMeta = {
  title: "My Hiền Tailor Studio",
  description:
    "My Hiền Tailor đồng hành cùng bạn trong hành trình may đo cá nhân hoá – áo dài, vest, đầm dạ hội và kho vải chọn lọc.",
  ogTitle: "My Hiền Tailor Studio",
  ogDescription:
    "My Hiền Tailor đồng hành cùng bạn trong hành trình may đo cá nhân hoá – áo dài, vest, đầm dạ hội và kho vải chọn lọc.",
  ogImage:
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&auto=format&fit=crop&q=80",
  ogType: "website",
  robots: "index,follow",
  keywords: "may đo, áo dài, vest, đầm dạ hội, vải cao cấp, My Hiền",
};

// --- SCHEMA JSON-LD ---
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Tailor",
  name: "My Hiền • Fashion Design Studio",
  url: "https://my-hien-tailor.vn",
  logo: "https://my-hien-tailor.vn/logo.png",
  image:
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&auto=format&fit=crop&q=80",
  description:
    "Tiệm may My Hiền chuyên may đo áo dài, vest, đầm dạ hội và cung cấp kho vải chọn lọc.",
  telephone: "+84-901-134-256",
  email: "dvkh@camfashion.vn",
  priceRange: "₫₫₫",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Nguyễn Thị Minh Khai, Quận 1",
    addressLocality: "TP. Hồ Chí Minh",
    postalCode: "700000",
    addressCountry: "VN",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "07:00",
      closes: "23:00",
    },
  ],
  sameAs: [
    "https://www.facebook.com/myhienfashionstudio",
    "https://www.instagram.com/myhien.tailor",
  ],
};

// --- CONTEXT ---
const PageMetaContext = createContext(null);

// --- PROVIDER COMPONENT (Dùng trong main.jsx) ---
export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(defaultMeta);

  // Merge meta hiện tại với default để đảm bảo luôn có đủ field
  const mergedMeta = useMemo(
    () => ({
      ...defaultMeta,
      ...meta,
    }),
    [meta]
  );

  const contextValue = useMemo(
    () => ({
      setMeta,
    }),
    [setMeta]
  );

  return (
    <PageMetaContext.Provider value={contextValue}>
      <Helmet prioritizeSeoTags>
        {/* Basic Meta */}
        <title>{mergedMeta.title}</title>
        {mergedMeta.description && (
          <meta name="description" content={mergedMeta.description} />
        )}
        {mergedMeta.keywords && (
          <meta name="keywords" content={mergedMeta.keywords} />
        )}
        {mergedMeta.robots && (
          <meta name="robots" content={mergedMeta.robots} />
        )}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={mergedMeta.ogType || "website"} />
        <meta
          property="og:title"
          content={mergedMeta.ogTitle || mergedMeta.title}
        />
        <meta
          property="og:description"
          content={
            mergedMeta.ogDescription || mergedMeta.description || undefined
          }
        />
        {mergedMeta.ogImage && (
          <meta property="og:image" content={mergedMeta.ogImage} />
        )}
        {mergedMeta.ogUrl && (
          <meta property="og:url" content={mergedMeta.ogUrl} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={mergedMeta.ogTitle || mergedMeta.title}
        />
        {mergedMeta.ogDescription && (
          <meta name="twitter:description" content={mergedMeta.ogDescription} />
        )}
        {mergedMeta.ogImage && (
          <meta name="twitter:image" content={mergedMeta.ogImage} />
        )}

        {/* Canonical */}
        {mergedMeta.canonical && (
          <link rel="canonical" href={mergedMeta.canonical} />
        )}

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>
      {children}
    </PageMetaContext.Provider>
  );
}

// --- HOOK (Dùng trong các Page Component) ---
export default function usePageMeta(metaConfig = {}) {
  const context = useContext(PageMetaContext);
  
  // Kiểm tra nếu hook được dùng ngoài Provider
  if (!context) {
    console.warn("usePageMeta must be used within a PageMetaProvider");
    return;
  }

  const { setMeta } = context;

  useEffect(() => {
    if (!setMeta) return;

    // Cập nhật meta khi component mount
    setMeta((prev) => ({
      ...prev,
      ...metaConfig,
      // Ưu tiên các giá trị cụ thể nếu có
      ogTitle: metaConfig.ogTitle || metaConfig.title || prev.ogTitle,
      ogDescription:
        metaConfig.ogDescription || metaConfig.description || prev.ogDescription,
    }));

    // Cleanup (Optional): Reset về default khi unmount nếu muốn
    // return () => setMeta(defaultMeta); 
  }, [
    setMeta,
    metaConfig.title,
    metaConfig.description,
    metaConfig.ogTitle,
    metaConfig.ogDescription,
    metaConfig.ogImage,
    metaConfig.ogUrl,
    metaConfig.canonical,
    metaConfig.keywords,
    metaConfig.robots,
  ]);
}