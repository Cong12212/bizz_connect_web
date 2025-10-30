import React, { useEffect, useState } from "react";
import { getCities, type City } from "@/services/location";

export default function CitySelect({
    state,
    value,
    onChange
}: {
    state?: string;
    value?: string;
    onChange: (value: string) => void;
}) {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (state) {
            loadCities();
        } else {
            setCities([]);
        }
    }, [state]);

    async function loadCities() {
        try {
            setLoading(true);
            const data = await getCities(state!);
            setCities(data);
        } catch (e) {
            console.error('Failed to load cities:', e);
            setCities([]);
        } finally {
            setLoading(false);
        }
    }

    if (!state) {
        return (
            <input
                disabled
                placeholder="Select state first"
                className="w-full rounded-md border px-3 py-2 bg-slate-100"
            />
        );
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
            <option value="">Select City/District</option>
            {cities.map((city) => (
                <option key={city.id} value={city.code}>
                    {city.name}
                </option>
            ))}
        </select>
    );
}
