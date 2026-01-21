import React, { useState } from "react";
import { X, Plus } from "lucide-react";

export default function TagInput({
    label,
    value = [],
    onChange,
    placeholder = "Nhập và nhấn Enter...",
    suggestions = [],
}) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const trimmed = input.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
            setInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(value.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition">
                {value.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-emerald-100 text-emerald-800"
                    >
                        {tag}
                        <button
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 hover:text-emerald-900 focus:outline-none"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm p-1"
                    placeholder={value.length === 0 ? placeholder : ""}
                />
            </div>
            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => {
                                if (!value.includes(s)) onChange([...value, s]);
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
                        >
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
