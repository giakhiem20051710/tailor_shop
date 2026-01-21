import { useState, useEffect } from "react";
import { LayoutGrid, List as ListIcon, Search, Filter, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import ProductForm from "../components/products/ProductForm";
import ProductService from "../services/productService";
import StyleModal from "../components/StyleModal";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80";

export default function ProductManagerPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("table"); // 'grid' | 'table'
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // For detail modal

    // Filters
    const [filters, setFilters] = useState({
        keyword: "",
        category: "",
        minPrice: "",
        maxPrice: "",
    });

    useEffect(() => {
        fetchProducts();
    }, [filters]); // Debounce usually handled here or in handler

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Clean filters
            const params = {};
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.category) params.category = filters.category;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const response = await ProductService.list(params, { size: 50, sort: "createdAt,desc" });
            const data = ProductService.parseResponse(response);
            setProducts(Array.isArray(data) ? data : data?.content || []);
        } catch (error) {
            console.error("Error loading products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        try {
            if (data.id) {
                await ProductService.update(data.key, data);
            } else {
                await ProductService.create(data);
            }
            fetchProducts();
            setShowAdd(false);
            setEditItem(null);
        } catch (error) {
            alert("Lỗi lưu sản phẩm: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (key) => {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            try {
                await ProductService.delete(key);
                fetchProducts();
            } catch (error) {
                alert("Lỗi xóa sản phẩm");
            }
        }
    };

    // --- Render Helpers ---

    const FilterBar = () => (
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    placeholder="Tìm kiếm tên, mã sản phẩm..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={filters.keyword}
                    onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                />
            </div>

            <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <select
                    className="p-2 border rounded-lg outline-none cursor-pointer bg-white"
                    value={filters.category}
                    onChange={e => setFilters({ ...filters, category: e.target.value })}
                >
                    <option value="">Tất cả danh mục</option>
                    <option value="vest">Vest / Comple</option>
                    <option value="ao_dai">Áo dài</option>
                    <option value="vay">Váy / Đầm</option>
                    <option value="somi">Sơ mi</option>
                </select>
            </div>

            <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <ListIcon size={20} />
                </button>
            </div>

            <button
                onClick={() => setShowAdd(true)}
                className="ml-auto px-4 py-2 bg-emerald-700 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-800 shadow-sm"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Thêm sản phẩm</span>
            </button>
        </div>
    );

    const TableView = () => (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-gray-600 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 pl-6">Sản phẩm</th>
                            <th className="p-4">Danh mục</th>
                            <th className="p-4">Giá bán</th>
                            <th className="p-4">Thông số may</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-right pr-6">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 group transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={item.image || FALLBACK_IMAGE}
                                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 border"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{item.key}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 font-medium">
                                        {item.category || "N/A"}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                    {Number(item.price).toLocaleString()} đ
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {item.specifications ? (
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span>⏱ {item.specifications.tailoringTime}</span>
                                            <span>✂ {item.specifications.fittingCount}</span>
                                        </div>
                                    ) : <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.isDeleted ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.isDeleted ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                        {item.isDeleted ? "Ngừng KD" : "Đang bán"}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setSelectedItem(item)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Xem chi tiết"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditItem(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.key)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-500">
                        Không tìm thấy sản phẩm nào phù hợp.
                    </div>
                )}
            </div>
        </div>
    );

    const GridView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((item) => (
                <div key={item.id} className="group bg-white rounded-2xl border hover:shadow-xl transition-all overflow-hidden flex flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <img
                            src={item.image || FALLBACK_IMAGE}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                            {Number(item.price).toLocaleString()} đ
                        </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{item.category}</p>

                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setEditItem(item)}
                                className="py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700"
                            >
                                Sửa
                            </button>
                            <button
                                onClick={() => setSelectedItem(item)}
                                className="py-2 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium"
                            >
                                Chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                    <p className="text-gray-500 text-sm mt-1">{products.length} sản phẩm đang hiển thị</p>
                </div>
            </div>

            <FilterBar />

            {loading ? (
                <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
            ) : viewMode === 'table' ? <TableView /> : <GridView />}

            {/* Modals */}
            {(showAdd || editItem) && (
                <ProductForm
                    item={editItem}
                    onClose={() => { setShowAdd(false); setEditItem(null); }}
                    onSave={handleSave}
                />
            )}

            {selectedItem && (
                <StyleModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
}
