export default function MeasurementsDisplay({ measurements }) {
  if (!measurements || Object.keys(measurements).length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        Chưa có số đo
      </div>
    );
  }

  const measurementLabels = {
    chest: "Vòng ngực (cm)",
    waist: "Vòng eo (cm)",
    hip: "Vòng mông (cm)",
    shoulder: "Vòng vai (cm)",
    sleeveLength: "Dài tay (cm)",
    shirtLength: "Dài áo (cm)",
    pantsLength: "Dài quần (cm)",
    neck: "Vòng cổ (cm)",
    armhole: "Vòng nách (cm)",
    inseam: "Dài đũng quần (cm)",
    thigh: "Vòng đùi (cm)",
    cuff: "Vòng cổ tay (cm)",
    waistband: "Vòng lưng quần (cm)",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Số đo
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(measurements).map(([key, value]) => {
          if (!value) return null;
          return (
            <div key={key} className="bg-gray-50 p-3 rounded-lg">
              <label className="text-xs text-gray-500 block mb-1">
                {measurementLabels[key] || key}
              </label>
              <p className="text-gray-700 font-medium">{value} cm</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

