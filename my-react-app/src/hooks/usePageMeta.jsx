import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

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

const PageMetaContext = createContext({
  setMeta: () => {},
});

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(defaultMeta);

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
        {mergedMeta.canonical && (
          <link rel="canonical" href={mergedMeta.canonical} />
        )}
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>
      {children}
    </PageMetaContext.Provider>
  );
}

/**
 * Hook dùng trong từng page để cập nhật meta hiện tại.
 * Giữ nguyên API cũ để không phải thay đổi mọi page.
 */
export default function usePageMeta(metaConfig = {}) {
  const { setMeta } = useContext(PageMetaContext);
  useEffect(() => {
    if (!setMeta) return;
    setMeta((prev) => ({
      ...prev,
      ...metaConfig,
      ogTitle: metaConfig.ogTitle || metaConfig.title || prev.ogTitle,
      ogDescription:
        metaConfig.ogDescription || metaConfig.description || prev.ogDescription,
    }));
  }, [setMeta, JSON.stringify(metaConfig)]);
}

