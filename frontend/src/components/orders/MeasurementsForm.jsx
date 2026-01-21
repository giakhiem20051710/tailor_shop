export default function MeasurementsForm({ measurements, onChange }) {
  const measurementFields = [
    { key: "chest", label: "Vòng ngực (cm)" },
    { key: "waist", label: "Vòng eo (cm)" },
    { key: "hip", label: "Vòng mông (cm)" },
    { key: "shoulder", label: "Vòng vai (cm)" },
    { key: "sleeveLength", label: "Dài tay (cm)" },
    { key: "shirtLength", label: "Dài áo (cm)" },
    { key: "pantsLength", label: "Dài quần (cm)" },
    { key: "neck", label: "Vòng cổ (cm)" },
    { key: "armhole", label: "Vòng nách (cm)" },
    { key: "inseam", label: "Dài đũng quần (cm)" },
    { key: "thigh", label: "Vòng đùi (cm)" },
    { key: "cuff", label: "Vòng cổ tay (cm)" },
  ];

  const handleChange = (key, value) => {
    const updated = { ...measurements, [key]: value };
    onChange(updated);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
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
        {measurementFields.map((field) => (
          <div key={field.key}>
            <label className="text-sm text-gray-600">{field.label}</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="w-full p-2 mt-1 border rounded-lg focus:ring-green-500 focus:border-green-500"
              value={measurements[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

