import api from "./api";

export interface Country {
    id: number;
    code: string;
    name: string;
}

export interface State {
    id: number;
    country_id: number;
    code: string;
    name: string;
}

export interface City {
    id: number;
    state_id: number;
    code: string;
    name: string;
}

export async function getCountries(): Promise<Country[]> {
    const { data } = await api.get("/countries");
    return data;
}

export async function getStates(countryCode: string): Promise<State[]> {
    const { data } = await api.get(`/countries/${countryCode}/states`);
    return data;
}

export async function getCities(stateCode: string): Promise<City[]> {
    const { data } = await api.get(`/states/${stateCode}/cities`);
    return data;
}
