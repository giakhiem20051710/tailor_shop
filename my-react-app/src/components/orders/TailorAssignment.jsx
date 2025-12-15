import { useState, useEffect } from "react";
import { userService, orderService } from "../../services";
import { ROLES, getCurrentUser } from "../../utils/authStorage";

export default function TailorAssignment({ order, onUpdate }) {
  const [tailors, setTailors] = useState([]);
  const [selectedTailor, setSelectedTailor] = useState(order?.assignedTailor || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadTailors = async () => {
      try {
        const res = await userService.listTailors({ page: 0, size: 200 });
        const data = res?.data ?? res?.responseData ?? res;
        const ok =
          res?.success === true ||
          res?.responseStatus?.responseCode === "200" ||
          !!data?.content;
        if (ok && data) {
          setTailors(data.content || data.items || []);
        }
      } catch (error) {
        console.error("Error loading tailors:", error);
      }
    };
    loadTailors();
  }, []);

  const handleAssign = async () => {
    if (!order) return;
    try {
      await orderService.updateStatus(order.id, { assignedTailor: selectedTailor });
      if (onUpdate) {
        onUpdate({ ...order, assignedTailor: selectedTailor });
      }
    } catch (error) {
      console.error("Error assigning tailor:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const getTailorName = (tailorId) => {
    if (!tailorId) return null;
    const tailor = tailors.find(t => t.username === tailorId || t.id === tailorId);
    return tailor ? tailor.name : tailorId;
  };

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Thợ may được phân công</label>
            <p className="text-gray-700 font-medium">
              {getTailorName(order?.assignedTailor) || "Chưa phân công"}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            {order?.assignedTailor ? "Thay đổi" : "Phân công"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <label className="text-sm text-gray-500 block mb-2">Phân công thợ may</label>
      <div className="flex gap-2">
        <select
          value={selectedTailor}
          onChange={(e) => setSelectedTailor(e.target.value)}
          className="flex-1 p-2 border rounded-lg focus:ring-green-500"
        >
          <option value="">-- Chọn thợ may --</option>
          {tailors.map((tailor) => (
            <option key={tailor.username || tailor.id} value={tailor.username || tailor.id}>
              {tailor.name} ({tailor.username || tailor.id})
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Lưu
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setSelectedTailor(order?.assignedTailor || "");
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

