import React from "react";

const STATES: Record<string, { code: string; name: string }[]> = {
    VN: [
        { code: "HN", name: "Hà Nội" },
        { code: "HCM", name: "Hồ Chí Minh" },
        { code: "DN", name: "Đà Nẵng" },
        { code: "HP", name: "Hải Phòng" },
        { code: "CT", name: "Cần Thơ" },
        // Add more Vietnamese provinces
    ],
    US: [
        { code: "CA", name: "California" },
        { code: "NY", name: "New York" },
        { code: "TX", name: "Texas" },
        { code: "FL", name: "Florida" },
        // Add more US states
    ],
    // Add more countries' states/provinces
};

export default function StateSelect({
    country,
    value,
    onChange
}: {
    country?: string;
    value?: string;
    onChange: (value: string) => void;
}) {
    const states = country ? STATES[country] || [] : [];

    if (states.length === 0) {
        // Free text input if no states defined
        return (
            <input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                placeholder="State/Province"
            />
        );
    }

    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
        >
            <option value="">Select State/Province</option>
            {states.map((state) => (
                <option key={state.code} value={state.code}>
                    {state.name}
                </option>
            ))}
        </select>
    );
}
