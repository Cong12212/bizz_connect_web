import { useEffect, useState } from "react";

export default function useMediaQuery(query: string) {
    const get = () =>
        typeof window !== "undefined" ? window.matchMedia(query).matches : false;

    const [matches, setMatches] = useState<boolean>(get);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);

        // init + subscribe (compat old Safari)
        onChange();
        // @ts-ignore
        mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
        return () => {
            // @ts-ignore
            mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
        };
    }, [query]);

    return matches;
}
