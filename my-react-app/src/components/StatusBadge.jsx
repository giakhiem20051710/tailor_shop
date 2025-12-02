export default function StatusBadge({ status, luxury }) {
  const base =
    "px-3 py-1 text-xs rounded-full font-medium " +
    (luxury ? "shadow-sm" : "");

  const styles = {
    "Mới": luxury
      ? "bg-[#E4F7E8] text-[#256D3A]"
      : "bg-green-100 text-green-700",

    "Đang may": luxury
      ? "bg-[#FFF4D8] text-[#C78A00]"
      : "bg-yellow-100 text-yellow-700",

    "Hoàn thành": luxury
      ? "bg-[#E2E8FF] text-[#3B5CCC]"
      : "bg-blue-100 text-blue-700",

    "Hủy": luxury
      ? "bg-[#EFEFEF] text-[#555]"
      : "bg-gray-200 text-gray-600",
  };

  return <span className={base + " " + styles[status]}>{status}</span>;
}
