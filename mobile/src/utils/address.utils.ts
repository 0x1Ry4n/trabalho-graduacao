export interface AddressData {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
}

export interface CoordinatesData {
    latitude: number;
    longitude: number;
}

interface BrasilApiCepV2Response {
    cep: string;
    state: string;
    city: string;
    neighborhood?: string;
    street?: string;
    location?: {
        coordinates?: {
            longitude?: string | number;
            latitude?: string | number;
        };
    };
}

interface AwesomeApiCepResponse {
    lat?: string;
    lng?: string;
}

interface NominatimResponse {
    lat: string;
    lon: string;
}

export function cleanCep(cep: string): string {
    return cep.replace(/\D/g, '');
}

export function isCompleteCep(cep: string): boolean {
    return cleanCep(cep).length === 8;
}

export async function fetchAddressByCep(cep: string): Promise<AddressData | null> {
    try {
        const cepDigits = cleanCep(cep);

        if (cepDigits.length !== 8) {
            throw new Error('CEP deve ter 8 digitos');
        }

        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);

        if (!response.ok) {
            throw new Error('Erro na requisicao');
        }

        const data: AddressData = await response.json();

        if (data.erro) {
            return null;
        }

        return data;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        throw error;
    }
}

function parseCoordinates(latitude?: string | number, longitude?: string | number): CoordinatesData | null {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { latitude: lat, longitude: lng };
}

async function fetchCoordinatesFromBrasilApi(cleanCep: string): Promise<CoordinatesData | null> {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);

    if (!response.ok) return null;

    const data: BrasilApiCepV2Response = await response.json();
    return parseCoordinates(
        data.location?.coordinates?.latitude,
        data.location?.coordinates?.longitude
    );
}

async function fetchCoordinatesFromAwesomeApi(cleanCep: string): Promise<CoordinatesData | null> {
    const response = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);

    if (!response.ok) return null;

    const data: AwesomeApiCepResponse = await response.json();
    return parseCoordinates(data.lat, data.lng);
}

async function fetchCoordinatesFromAddress(addressData: AddressData): Promise<CoordinatesData | null> {
    const query = [
        addressData.logradouro,
        addressData.bairro,
        addressData.localidade,
        addressData.uf,
        addressData.cep,
        'Brasil',
    ].filter(Boolean).join(', ');

    if (!query.trim()) return null;

    const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'br',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);

    if (!response.ok) return null;

    const data: NominatimResponse[] = await response.json();
    const firstResult = data[0];

    return firstResult ? parseCoordinates(firstResult.lat, firstResult.lon) : null;
}

export async function fetchCoordinatesByCep(
    cep: string,
    addressData?: AddressData | null
): Promise<CoordinatesData | null> {
    try {
        const cepDigits = cleanCep(cep);

        if (cepDigits.length !== 8) {
            throw new Error('CEP deve ter 8 digitos');
        }

        const awesomeApiCoordinates = await fetchCoordinatesFromAwesomeApi(cepDigits);
        if (awesomeApiCoordinates) return awesomeApiCoordinates;

        const brasilApiCoordinates = await fetchCoordinatesFromBrasilApi(cepDigits);
        if (brasilApiCoordinates) return brasilApiCoordinates;

        const data = addressData ?? await fetchAddressByCep(cepDigits);
        return data ? await fetchCoordinatesFromAddress(data) : null;
    } catch (error) {
        console.error('Erro ao buscar coordenadas do CEP:', error);
        return null;
    }
}

export function useCepAddress() {
    const fillAddressFromCep = async (
        cep: string,
        setAddress: (value: string) => void,
        setNeighborhood: (value: string) => void,
        setCity: (value: string) => void,
        setState?: (value: string) => void
    ): Promise<boolean> => {
        try {
            const addressData = await fetchAddressByCep(cep);

            if (addressData) {
                setAddress(addressData.logradouro || '');
                setNeighborhood(addressData.bairro || '');
                setCity(addressData.localidade || '');
                if (setState) {
                    setState(addressData.uf || '');
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erro ao preencher endereco:', error);
            return false;
        }
    };

    return { fillAddressFromCep };
}
