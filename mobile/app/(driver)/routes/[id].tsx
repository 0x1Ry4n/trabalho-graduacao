import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Box, VStack, Text, HStack, ScrollView } from 'native-base';
import { routesApi } from '../../../src/api/routes';
import { Route, RouteStop, Stop } from '../../../src/types';
import { NativeMap, MapMarker } from '../../../src/components/map/NativeMap';
import { LoadingSpinner, EmptyState, TopRefreshButton } from '../../../src/components/shared';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { getStopOffsetMinutes, getStopPassTime } from '../../../src/utils/routeSchedule.utils';

function getStopLatitude(stop: Stop) {
    return Number((stop as any).latitude ?? (stop as any).lat ?? 0);
}

function getStopLongitude(stop: Stop) {
    return Number((stop as any).longitude ?? (stop as any).lng ?? 0);
}

function normalizeStops(value: unknown): RouteStop[] {
    if (Array.isArray(value)) return value as RouteStop[];
    if (value && typeof value === 'object') {
        const data = (value as any).data;
        const stops = (value as any).stops;

        if (Array.isArray(data)) return data as RouteStop[];
        if (Array.isArray(stops)) return stops as RouteStop[];
    }

    return [];
}

export default function DriverRouteDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [route, setRoute] = useState<Route | null>(null);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRoute = useCallback(async () => {
        try {
            if (!id) {
                setRoute(null);
                setStops([]);
                return;
            }

            const [routeResult, stopsResult] = await Promise.allSettled([
                routesApi.getById(id),
                routesApi.getStops(id),
            ]);

            if (routeResult.status === 'fulfilled') {
                const routeData = routeResult.value;
                setRoute(routeData);

                if (stopsResult.status === 'fulfilled') {
                    setStops(normalizeStops(stopsResult.value));
                } else {
                    setStops(normalizeStops(routeData.stops));
                }
            } else {
                setRoute(null);
                setStops([]);
                Alert.alert('Erro', 'Não foi possível carregar a rota.');
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar a rota.');
            setRoute(null);
            setStops([]);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadRoute();
    }, [loadRoute]);

    const markers = useMemo<MapMarker[]>(() => {
        if (!stops.length) return [];

        return stops
            .map((stop, index) => {
                const lat = getStopLatitude(stop);
                const lng = getStopLongitude(stop);

                if (!lat || !lng) return null;

                return {
                    lat,
                    lng,
                    title: `Parada ${index + 1}: ${(stop as any).name || `Parada ${index + 1}`}`,
                    color: index === 0 ? '#059669' : '#1E40AF',
                    label: String(index + 1),
                };
            })
            .filter(Boolean) as MapMarker[];
    }, [stops]);

    const center = useMemo(() => {
        if (markers.length > 0) {
            return { lat: markers[0].lat, lng: markers[0].lng };
        }

        if (route?.startLat && route?.startLong) {
            return {
                lat: Number(route.startLat),
                lng: Number(route.startLong),
            };
        }

        return undefined;
    }, [markers, route]);

    if (loading) {
        return <LoadingSpinner color="driver.600" />;
    }

    if (!route) {
        return (
            <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
                <ScreenHeader
                    title="Detalhes da Rota"
                    subtitle="Rota não encontrada"
                    bg="#059669"
                    showBack
                    showMenu={false}
                />
                <EmptyState
                    icon="map-outline"
                    message="Não foi possível localizar a rota."
                />
            </Box>
        );
    }

    return (
        <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
            <ScreenHeader
                title={route.name}
                subtitle={`${stops.length} parada(s)`}
                bg="#059669"
                showBack
                showMenu={false}
            />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                <VStack space={4}>
                    <Box>
                        <TopRefreshButton
                            onPress={loadRoute}
                            bgColor="driver.600"
                            pressedBgColor="driver.700"
                        />
                    </Box>

                    <Box
                        bg="white"
                        _dark={{ bg: 'coolGray.800' }}
                        borderRadius="xl"
                        p="4"
                        shadow="1"
                    >
                        <VStack space={2}>
                            <Text
                                fontSize="lg"
                                fontWeight="700"
                                color="coolGray.800"
                                _dark={{ color: 'coolGray.100' }}
                            >
                                {route.name}
                            </Text>

                            <Text fontSize="sm" color="coolGray.500">
                                Saída: {route.startTime}
                                {route.endTime ? ` · Chegada: ${route.endTime}` : ''}
                            </Text>

                            <Text fontSize="sm" color="coolGray.500">
                                Duração estimada: {route.estimatedDuration} min
                            </Text>

                            {route.vehicle?.plate ? (
                                <Text fontSize="sm" color="coolGray.500">
                                    Veículo: {route.vehicle.plate}
                                </Text>
                            ) : null}

                            <Text fontSize="sm" color={route.active ? 'emerald.600' : 'coolGray.400'}>
                                {route.active ? 'Rota ativa' : 'Rota inativa'}
                            </Text>
                        </VStack>
                    </Box>

                    <Box
                        bg="white"
                        _dark={{ bg: 'coolGray.800' }}
                        borderRadius="xl"
                        p="3"
                        shadow="1"
                    >
                        {center ? (
                            <NativeMap
                                height={360}
                                interactive
                                center={center}
                                markers={markers}
                                title="Mapa da rota"
                                subtitle={`${markers.length} parada(s) com coordenadas`}
                                accentColor="#059669"
                            />
                        ) : (
                            <EmptyState
                                icon="location-outline"
                                message="Nenhuma coordenada encontrada para esta rota."
                            />
                        )}
                    </Box>

                    <Box
                        bg="white"
                        _dark={{ bg: 'coolGray.800' }}
                        borderRadius="xl"
                        p="4"
                        shadow="1"
                    >
                        <VStack space={3}>
                            <Text
                                fontSize="md"
                                fontWeight="700"
                                color="coolGray.800"
                                _dark={{ color: 'coolGray.100' }}
                            >
                                Paradas
                            </Text>

                            {stops.length === 0 ? (
                                <Text fontSize="sm" color="coolGray.500">
                                    Nenhuma parada cadastrada.
                                </Text>
                            ) : (
                                stops.map((stop, index) => {
                                    const lat = getStopLatitude(stop);
                                    const lng = getStopLongitude(stop);

                                    return (
                                        <HStack
                                            key={(stop as any).id ?? `${index}`}
                                            space={3}
                                            alignItems="flex-start"
                                        >
                                            <Box
                                                mt="1"
                                                w="8"
                                                h="8"
                                                borderRadius="full"
                                                bg="driver.50"
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Text fontSize="xs" fontWeight="700" color="driver.700">
                                                    {index + 1}
                                                </Text>
                                            </Box>

                                            <VStack flex={1}>
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="600"
                                                    color="coolGray.800"
                                                    _dark={{ color: 'coolGray.100' }}
                                                >
                                                    {(stop as any).name || `Parada ${index + 1}`}
                                                </Text>

                                                {(stop as any).address ? (
                                                    <Text fontSize="xs" color="coolGray.500">
                                                        {(stop as any).address}
                                                    </Text>
                                                ) : null}

                                                {lat && lng ? (
                                                    <Text fontSize="xs" color="coolGray.400">
                                                        Lat: {lat} · Lng: {lng}
                                                    </Text>
                                                ) : (
                                                    <Text fontSize="xs" color="coolGray.400">
                                                        Coordenadas não informadas
                                                    </Text>
                                                )}
                                                <Text fontSize="xs" color="driver.600" fontWeight="700" mt="0.5">
                                                    +{getStopOffsetMinutes(stop)} min desde a saida
                                                </Text>
                                            </VStack>
                                            <Box bg="driver.50" borderRadius="lg" px="3" py="1.5">
                                                <Text fontSize="sm" fontWeight="900" color="driver.700">
                                                    {getStopPassTime(route, stop)}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    );
                                })
                            )}
                        </VStack>
                    </Box>
                </VStack>
            </ScrollView>
        </Box>
    );
}
