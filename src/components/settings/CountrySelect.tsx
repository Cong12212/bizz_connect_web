import React, { useEffect, useState } from "react";
import { getCountries, type Country } from "@/services/location";

export default function CountrySelect({
    value,
    onChange
}: {
    value?: string;
    onChange: (value: string) => void;
}) {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCountries();
    }, []);

    async function loadCountries() {
        try {
            const data = await getCountries();
            setCountries(data);
        } catch (e) {
            console.error("Failed to load countries:", e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <select disabled className="w-full rounded-md border px-3 py-2 bg-slate-100">
                <option>Loading...</option>
            </select>
        );
    }

    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
        >
            <option value="">Select Country</option>
            {countries.map((country) => (
                <option key={country.code} value={country.code}>
                    {country.name}
                </option>
            ))}
        </select>
    );
}
