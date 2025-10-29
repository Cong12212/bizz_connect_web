import React from "react";

const COUNTRIES = [
    { code: "VN", name: "Vietnam" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CN", name: "China" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "South Korea" },
    { code: "TH", name: "Thailand" },
    { code: "SG", name: "Singapore" },
    { code: "MY", name: "Malaysia" },
    { code: "ID", name: "Indonesia" },
    { code: "PH", name: "Philippines" },
    { code: "AU", name: "Australia" },
    { code: "CA", name: "Canada" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

export default function CountrySelect({
    value,
    onChange
}: {
    value?: string;
    onChange: (value: string) => void;
}) {
    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
        >
            <option value="">Select Country</option>
            {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                    {country.name}
                </option>
            ))}
        </select>
    );
}
