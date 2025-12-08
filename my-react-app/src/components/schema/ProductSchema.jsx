import { Helmet } from "react-helmet-async";

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parsePriceValue = (price) => {
  if (!price) return undefined;
  if (typeof price === "number") return price;
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
};

const normalizeProduct = (item = {}, baseUrl) => {
  if (!item?.name) return null;
  const priceValue = parsePriceValue(item.price);
  const urlSlug = item.slug || item.key || slugify(item.name);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.desc || item.description,
    image: item.image,
    sku: item.key || urlSlug,
    category: item.category || item.tag || "Tailor product",
    brand: {
      "@type": "Brand",
      name: "My Hiền Tailor",
    },
    url: `${baseUrl}/product/${urlSlug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: priceValue || 0,
      availability: "https://schema.org/PreOrder",
      url: `${baseUrl}/product/${urlSlug}`,
      itemCondition: "https://schema.org/NewCondition",
    },
    productionDate: item.productionDate,
    material: item.material,
  };
};

export default function ProductSchema({
  items = [],
  baseUrl = "https://my-hien-tailor.vn",
}) {
  const products = items
    .map((item) => normalizeProduct(item, baseUrl))
    .filter(Boolean);

  if (!products.length) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(products.length === 1 ? products[0] : products)}
      </script>
    </Helmet>
  );
}

