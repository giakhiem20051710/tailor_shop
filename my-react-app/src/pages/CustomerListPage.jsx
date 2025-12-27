import React, { useEffect, useState } from 'react';
import CustomerApi from '../services/api/CustomerApi';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.size]);

  // Debug: Log khi customers state thay đổi
  useEffect(() => {
    console.log('[CustomerListPage] ⚡ Customers state changed:', customers.length, 'items');
    if (customers.length > 0) {
      console.log('[CustomerListPage] First customer:', customers[0]);
    }
  }, [customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await CustomerApi.getCustomers({
        page: pagination.page,
        size: pagination.size
      });

      // Debug: Log response để kiểm tra cấu trúc
      console.log('[CustomerListPage] ========== DEBUG START ==========');
      console.log('[CustomerListPage] Raw API Response:', response);
      console.log('[CustomerListPage] Response type:', typeof response);
      console.log('[CustomerListPage] Is Array:', Array.isArray(response));
      if (response && typeof response === 'object') {
        console.log('[CustomerListPage] Response keys:', Object.keys(response));
        console.log('[CustomerListPage] Response stringified:', JSON.stringify(response, null, 2));
      }

      // Handle multiple response structures:
      // 1. Direct array: [...]
      // 2. CommonResponse: { responseData: { content: [...], totalElements: ..., totalPages: ... } }
      // 3. PageResponse: { content: [...], totalElements: ..., totalPages: ... }
      // 4. Wrapped in data property: { data: [...] }
      
      let customersList = [];
      let totalElements = 0;
      let totalPages = 0;

      if (!response) {
        console.warn('[CustomerListPage] Response is null or undefined');
        setCustomers([]);
        setLoading(false);
        return;
      }

      // Case 1: Direct array response
      if (Array.isArray(response)) {
        customersList = response;
        totalElements = response.length;
        totalPages = Math.ceil(response.length / pagination.size);
        console.log('[CustomerListPage] ✅ Using direct array, count:', customersList.length);
      } 
      // Case 2: CommonResponse wrapper
      else if (response?.responseData) {
        const pageData = response.responseData;
        // Lấy content từ pageData
        if (Array.isArray(pageData.content)) {
          customersList = pageData.content;
        } else if (Array.isArray(pageData)) {
          customersList = pageData;
        } else {
          customersList = [];
        }
        // Lấy pagination info
        totalElements = pageData.totalElements !== undefined ? pageData.totalElements : customersList.length;
        totalPages = pageData.totalPages !== undefined && pageData.totalPages > 0 
          ? pageData.totalPages 
          : (customersList.length > 0 ? Math.ceil(customersList.length / pagination.size) : 1);
        console.log('[CustomerListPage] ✅ Using CommonResponse wrapper');
        console.log('[CustomerListPage]   - customersList.length:', customersList.length);
        console.log('[CustomerListPage]   - totalElements:', totalElements);
        console.log('[CustomerListPage]   - totalPages:', totalPages);
      } 
      // Case 3: PageResponse (Spring Data Page)
      else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
        totalElements = response.totalElements || customersList.length;
        totalPages = response.totalPages || Math.ceil(customersList.length / pagination.size);
        console.log('[CustomerListPage] ✅ Using PageResponse, count:', customersList.length);
      }
      // Case 4: Wrapped in data property
      else if (response?.data) {
        if (Array.isArray(response.data)) {
          customersList = response.data;
          totalElements = response.data.length;
          totalPages = Math.ceil(response.data.length / pagination.size);
          console.log('[CustomerListPage] ✅ Using data property, count:', customersList.length);
        } else if (response.data?.content && Array.isArray(response.data.content)) {
          customersList = response.data.content;
          totalElements = response.data.totalElements || customersList.length;
          totalPages = response.data.totalPages || Math.ceil(customersList.length / pagination.size);
          console.log('[CustomerListPage] ✅ Using data.content, count:', customersList.length);
        }
      }
      // Case 5: Try to find any array property
      else if (typeof response === 'object') {
        // Tìm property nào là array
        for (const key in response) {
          if (Array.isArray(response[key])) {
            customersList = response[key];
            totalElements = customersList.length;
            totalPages = Math.ceil(customersList.length / pagination.size);
            console.log('[CustomerListPage] ✅ Found array in property "' + key + '", count:', customersList.length);
            break;
          }
        }
      }

      // Fallback: empty array
      if (customersList.length === 0 && response && typeof response === 'object' && !Array.isArray(response)) {
        console.warn('[CustomerListPage] ⚠️ No array found in response structure');
        console.warn('[CustomerListPage] Response structure:', Object.keys(response));
      }

      console.log('[CustomerListPage] Final customers list:', customersList.length, 'items');
      console.log('[CustomerListPage] Sample customer:', customersList[0]);
      console.log('[CustomerListPage] Pagination - totalElements:', totalElements, 'totalPages:', totalPages);
      console.log('[CustomerListPage] ========== DEBUG END ==========');
      
      // Set state
      console.log('[CustomerListPage] Setting customers state with', customersList.length, 'items');
      setCustomers(customersList);
      setPagination(prev => {
        const newPagination = {
          ...prev,
          totalElements: totalElements,
          totalPages: totalPages || 1
        };
        console.log('[CustomerListPage] Setting pagination:', newPagination);
        return newPagination;
      });
    } catch (error) {
      console.error("[CustomerListPage] Failed to fetch customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-emerald-700" />
            Khách hàng
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Quản lý thông tin khách hàng và lịch sử may đo</p>
        </div>

        <button className="group flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-lg shadow-emerald-700/20 transition-all duration-300 transform hover:-translate-y-1">
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span className="font-medium">Thêm khách hàng</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SĐT..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 text-gray-700 placeholder-gray-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl transition-colors font-medium">
          <Filter className="w-5 h-5" />
          Bộ lọc
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Khách hàng</th>
                <th className="p-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Liên hệ</th>
                <th className="p-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                <th className="p-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="p-5 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                customers.map((user) => (
                  <tr key={user.id} className="group hover:bg-emerald-50/30 transition-colors duration-200">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {user.name || 'Chưa cập nhật tên'}
                          </p>
                          <p className="text-sm text-gray-500">ID: #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone || '---'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email || '---'}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {user.roleCode || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <p className="text-sm text-gray-500">
            Hiển thị <span className="font-semibold text-gray-900">{customers.length}</span> trên tổng số <span className="font-semibold text-gray-900">{pagination.totalElements}</span> khách hàng
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 0}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Trang {pagination.page + 1} / {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
