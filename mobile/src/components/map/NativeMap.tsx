import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Alert, Linking, StyleSheet, Platform } from 'react-native';
import { Box, Pressable, Icon, Text, HStack, VStack } from 'native-base';
import MapView, {
  Marker,
  Region,
  MapPressEvent,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  color?: string;
  label?: string;
}

interface NativeMapProps {
  markers?: MapMarker[];
  onLocationPick?: (lat: number, lng: number) => void;
  onOpenMaps?: () => void;
  openMapsDisabled?: boolean;
  center?: { lat: number; lng: number };
  height?: number;
  interactive?: boolean;
  title?: string;
  subtitle?: string;
  accentColor?: string;
}

const DEFAULT_CENTER = { lat: -20.774, lng: -49.506 };
const DEFAULT_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

const MIN_DELTA = 0.002;
const MAX_DELTA = 1.5;
const ZOOM_FACTOR = 0.5;

export function NativeMap({
  markers = [],
  onLocationPick,
  onOpenMaps,
  openMapsDisabled = false,
  center,
  height = 300,
  interactive = false,
  title,
  subtitle,
  accentColor = '#1E40AF',
}: NativeMapProps) {
  const mapRef = useRef<MapView>(null);

  const effectiveCenter =
    center ??
    (markers.length > 0
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : DEFAULT_CENTER);
  const markersKey = markers
    .map((m) => `${m.lat.toFixed(6)},${m.lng.toFixed(6)}`)
    .join('|');

  const initialRegion: Region = {
    latitude: effectiveCenter.lat,
    longitude: effectiveCenter.lng,
    ...DEFAULT_DELTA,
  };

  const [region, setRegion] = useState<Region>(initialRegion);

  useEffect(() => {
    const nextRegion: Region = {
      latitude: effectiveCenter.lat,
      longitude: effectiveCenter.lng,
      ...DEFAULT_DELTA,
    };

    setRegion(nextRegion);

    if (markers.length <= 1 && mapRef.current) {
      mapRef.current.animateToRegion(nextRegion, 500);
    }
  }, [effectiveCenter.lat, effectiveCenter.lng, markers.length, markersKey]);

  useEffect(() => {
    if (markers.length > 1 && mapRef.current) {
      const coords = markers.map((m) => ({
        latitude: m.lat,
        longitude: m.lng,
      }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [markers]);

  const handleRegionChangeComplete = useCallback((nextRegion: Region) => {
    setRegion(nextRegion);
  }, []);

  function handleMapPress(e: MapPressEvent) {
    if ((interactive || onLocationPick) && onLocationPick) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      onLocationPick(latitude, longitude);
    }
  }

  function applyZoom(newLatitudeDelta: number, newLongitudeDelta: number) {
    const nextRegion: Region = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: Math.min(Math.max(newLatitudeDelta, MIN_DELTA), MAX_DELTA),
      longitudeDelta: Math.min(
        Math.max(newLongitudeDelta, MIN_DELTA),
        MAX_DELTA
      ),
    };

    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 250);
  }

  function handleZoomIn() {
    applyZoom(
      region.latitudeDelta * ZOOM_FACTOR,
      region.longitudeDelta * ZOOM_FACTOR
    );
  }

  function handleZoomOut() {
    applyZoom(
      region.latitudeDelta / ZOOM_FACTOR,
      region.longitudeDelta / ZOOM_FACTOR
    );
  }

  async function handleDefaultOpenMaps() {
    if (!markers.length) {
      Alert.alert('Mapa indisponivel', 'Nenhuma coordenada disponivel para abrir no Maps.');
      return;
    }

    const [origin] = markers;
    const destination = markers[markers.length - 1];
    const waypoints = markers.slice(1, -1);
    const params = markers.length === 1
      ? [
          'api=1',
          `query=${origin.lat},${origin.lng}`,
        ].join('&')
      : [
          'api=1',
          `origin=${origin.lat},${origin.lng}`,
          `destination=${destination.lat},${destination.lng}`,
          waypoints.length ? `waypoints=${waypoints.map((m) => `${m.lat},${m.lng}`).join('|')}` : '',
          'travelmode=driving',
        ].filter(Boolean).join('&');
    const path = markers.length === 1 ? 'search' : 'dir';

    await Linking.openURL(`https://www.google.com/maps/${path}/?${params}`);
  }

  const openMapsHandler = onOpenMaps ?? (markers.length ? handleDefaultOpenMaps : undefined);
  const isOpenMapsDisabled = openMapsDisabled || !markers.length;

  const markerColors: Record<string, string> = {
    '#059669': '#059669',
    '#DC2626': '#DC2626',
    '#1E40AF': '#1E40AF',
    '#D97706': '#D97706',
    '#7C3AED': '#7C3AED',
  };
  const hasHeader = Boolean(title || subtitle);
  const markerSummary = markers.length === 1 ? '1 ponto' : `${markers.length} pontos`;

  return (
    <Box
      position="relative"
      borderRadius="xl"
      overflow="hidden"
      height={`${height}px`}
      borderWidth={1}
      borderColor="coolGray.200"
      bg="coolGray.100"
      _dark={{ borderColor: 'coolGray.700', bg: 'coolGray.800' }}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
        scrollEnabled={interactive || markers.length > 0}
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={Boolean(onLocationPick)}
        showsMyLocationButton={Boolean(onLocationPick)}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      >
        {markers.map((m, i) => (
          <Marker
            key={`${m.lat}-${m.lng}-${i}`}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.title}
          >
            <Box
              minW="8"
              h="8"
              px="2"
              borderRadius="full"
              bg={m.color ? markerColors[m.color] ?? m.color : '#DC2626'}
              borderWidth={2}
              borderColor="white"
              alignItems="center"
              justifyContent="center"
              shadow="3"
            >
              <Text color="white" fontSize="xs" fontWeight="700">
                {m.label ?? String(i + 1)}
              </Text>
            </Box>
          </Marker>
        ))}
      </MapView>

      {hasHeader ? (
        <Box
          position="absolute"
          left={3}
          right={3}
          top={3}
          bg="rgba(15,23,42,0.82)"
          borderRadius="xl"
          px="3"
          py="2.5"
        >
          <HStack alignItems="center" justifyContent="space-between" space={3}>
            <HStack alignItems="center" space={2} flex={1}>
              <Box w="2" h="8" borderRadius="full" bg={accentColor} />
              <VStack flex={1}>
                {title ? (
                  <Text color="white" fontSize="sm" fontWeight="800" numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text color="coolGray.200" fontSize="2xs" numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
            <Box bg="rgba(255,255,255,0.14)" borderRadius="full" px="2.5" py="1">
              <Text color="white" fontSize="2xs" fontWeight="700">
                {markerSummary}
              </Text>
            </Box>
          </HStack>
        </Box>
      ) : null}

      {onLocationPick ? (
        <Box
          position="absolute"
          left={3}
          right={3}
          bottom={3}
          pointerEvents="none"
          alignItems="center"
        >
          <Box bg="rgba(15,23,42,0.82)" borderRadius="full" px="3" py="1.5">
            <HStack alignItems="center" space={1.5}>
              <Icon as={Ionicons} name="hand-left-outline" size="3" color="white" />
              <Text color="white" fontSize="2xs" fontWeight="700">
                Toque no mapa para posicionar
              </Text>
            </HStack>
          </Box>
        </Box>
      ) : null}

      <Box position="absolute" right={3} bottom={3}>
        <Pressable style={styles.zoomButton} onPress={handleZoomIn}>
          <Icon as={Ionicons} name="add" size="md" color="white" />
        </Pressable>

        <Pressable style={[styles.zoomButton, { marginTop: 8 }]} onPress={handleZoomOut}>
          <Icon as={Ionicons} name="remove" size="md" color="white" />
        </Pressable>
      </Box>

      {openMapsHandler ? (
        <Box position="absolute" left={3} bottom={3}>
          <Pressable
            style={[
              styles.mapActionButton,
              isOpenMapsDisabled ? styles.disabledButton : null,
            ]}
            onPress={openMapsHandler}
            disabled={isOpenMapsDisabled}
          >
            <Icon as={Ionicons} name="navigate-outline" size="md" color="white" />
          </Pressable>
        </Box>
      ) : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(22,101,52,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
