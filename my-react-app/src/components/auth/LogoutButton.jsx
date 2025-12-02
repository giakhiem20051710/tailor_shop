import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth data if exists, but not required
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("userData");
    navigate("/", { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 rounded-lg bg-green-800 hover:bg-green-700 transition text-white text-sm font-medium mt-4"
    >
      Đăng xuất
    </button>
  );
}

