import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import pointsService from "../services/pointsService.js";
import { isAuthenticated } from "../utils/authStorage.js";

export default function PointsRedemptionWidget({ orderTotal = 0, onApply }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsInput, setPointsInput] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isAuth = isAuthenticated();
  const balance = wallet?.balance || 0;

  useEffect(() => {
    const loadWallet = async () => {
      if (!isAuth) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await pointsService.getWallet();
        setWallet(data || null);
      } catch (err) {
        console.error("Failed to load wallet:", err);
      } finally {
        setLoading(false);
      }
    };
    loadWallet();
  }, [isAuth]);

  useEffect(() => {
    if (!usePoints) {
      setResult(null);
      setError("");
      if (onApply) onApply({ pointsUsed: 0, discountAmount: 0 });
      return;
    }

    const calc = pointsService.calculateDiscount(orderTotal, pointsInput || 0);
    setResult(calc);
    setError(calc?.canUse ? "" : calc?.reason || "");

    if (calc?.canUse && onApply) {
      onApply({ pointsUsed: calc.pointsUsed || 0, discountAmount: calc.discountAmount || 0 });
    } else if (onApply) {
      onApply({ pointsUsed: 0, discountAmount: 0 });
    }
  }, [usePoints, pointsInput, orderTotal]);

  const maxPoints = useMemo(() => {
    const calc = pointsService.calculateDiscount(orderTotal, balance);
    if (!calc?.canUse) return 0;
    return calc.maxPointsAllowed || 0;
  }, [orderTotal, balance]);

  if (!isAuth) {
    return (
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB]">
        <svg
          className="w-5 h-5 text-[#F59E0B]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[13px] text-[#111827] flex-1">
          Đăng nhập để sử dụng điểm thưởng
        </span>
        <button
          className="text-xs text-indigo-600 hover:text-indigo-700"
          onClick={() => navigate("/login")}
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#F59E0B]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-[13px] font-medium text-[#111827]">Dùng xu giảm giá</p>
            <p className="text-[12px] text-[#6B7280]">
              Số dư: {loading ? "..." : `${balance.toLocaleString()} xu`}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={`text-[12px] px-2.5 py-1 rounded-full border ${usePoints
              ? "bg-[#111827] text-white border-[#111827]"
              : "text-[#6B7280] border-[#E5E7EB]"
            }`}
          onClick={() => setUsePoints((prev) => !prev)}
        >
          {usePoints ? "Đang dùng" : "Sử dụng"}
        </button>
      </div>

      {usePoints && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={balance}
              value={pointsInput}
              onChange={(e) => setPointsInput(Math.max(0, Number(e.target.value || 0)))}
              className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Nhập số xu muốn dùng"
            />
            <button
              type="button"
              className="text-[12px] px-3 py-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB]"
              onClick={() => setPointsInput(maxPoints)}
              disabled={maxPoints <= 0}
            >
              Tối đa
            </button>
          </div>
          {error && (
            <p className="text-[12px] text-rose-600">{error}</p>
          )}
          {result?.canUse && (
            <div className="text-[12px] text-emerald-600">
              Dùng {result.pointsUsed?.toLocaleString()} xu = giảm {result.discountAmount?.toLocaleString()}đ
            </div>
          )}
        </div>
      )}
    </div>
  );
}
