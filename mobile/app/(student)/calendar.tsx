import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, FlatList } from 'react-native';
import { Box, HStack, Icon, Pressable, ScrollView, Text, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { studentRoutesApi } from '../../src/api/studentRoutes';
import { routesApi } from '../../src/api/routes';
import { routeStopsApi } from '../../src/api/routeStops';
import { studentsApi } from '../../src/api/students';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { EmptyState, LoadingSpinner, TopRefreshButton } from '../../src/components/shared';
import { useAuthStore } from '../../src/store/auth.store';
import { Route, RouteStop, Student, StudentRoute } from '../../src/types';
import {
  WEEKDAYS,
  formatRouteWindow,
  getStopOffsetMinutes,
  getStopPassTime,
  periodColor,
  periodLabel,
} from '../../src/utils/routeSchedule.utils';

type CalendarRoute = {
  assignment: StudentRoute;
  route: Route;
  stops: RouteStop[];
};

export default function StudentCalendarScreen() {
  const { user } = useAuthStore();
  const [student, setStudent] = useState<Student | null>(null);
  const [routes, setRoutes] = useState<CalendarRoute[]>([]);
  const [selectedDay, setSelectedDay] = useState(WEEKDAYS[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const me = await studentsApi.getByUserId(String(user?.id ?? ''));
      setStudent(me);

      if (!me) {
        setRoutes([]);
        return;
      }

      const assignments = (await studentRoutesApi.getByStudent(me.id)).filter((item) => item.active === 1);
      const views = await Promise.all(assignments.map(async (assignment) => {
        const routeStopLink = await routeStopsApi.getById(assignment.routeStopId);
        const [routeResult, stopsResult] = await Promise.all([
          routesApi.getById(routeStopLink.routeId),
          routesApi.getStops(routeStopLink.routeId),
        ]);

        return {
          assignment,
          route: routeResult,
          stops: stopsResult,
        };
      }));

      setRoutes(views);
    } catch {
      Alert.alert('Erro', 'Não foi possivel carregar o calendário de rotas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner color="student.600" />;

  return (
    <Box flex={1} bg="coolGray.50" _dark={{ bg: 'coolGray.900' }}>
      <ScreenHeader
        title="Calendário"
        subtitle={student ? `${student.name}` : 'Horários das paradas'}
      />

      <FlatList
        data={routes}
        keyExtractor={(item) => item.assignment.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={(
          <VStack space={3} mb="3">
            <TopRefreshButton onPress={load} />

            <Box bg="student.600" borderRadius="xl" p="4">
              <HStack alignItems="center" space={3}>
                <Box w="12" h="12" borderRadius="xl" bg="rgba(255,255,255,0.16)" alignItems="center" justifyContent="center">
                  <Icon as={Ionicons} name="calendar-outline" size="6" color="white" />
                </Box>
                <VStack flex={1}>
                  <Text color="white" fontSize="lg" fontWeight="900">
                    Semana de embarque
                  </Text>
                  <Text color="coolGray.100" fontSize="xs">
                    Horários previstos de segunda a sexta
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {WEEKDAYS.map((day) => {
                const selected = day === selectedDay;
                return (
                  <Pressable key={day} onPress={() => setSelectedDay(day)} mr="2">
                    <Box
                      px="4"
                      py="2.5"
                      borderRadius="full"
                      bg={selected ? 'student.600' : 'white'}
                      borderWidth={1}
                      borderColor={selected ? 'student.600' : 'coolGray.200'}
                    >
                      <Text fontSize="xs" fontWeight="800" color={selected ? 'white' : 'coolGray.600'}>
                        {day}
                      </Text>
                    </Box>
                  </Pressable>
                );
              })}
            </ScrollView>
          </VStack>
        )}
        renderItem={({ item }) => {
          const selectedStop = item.stops.find((stop) => String(stop.routeStopId) === String(item.assignment.routeStopId));

          return (
            <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="xl" p="4" mb="3" shadow="1" borderWidth={1} borderColor="coolGray.100">
              <VStack space={3}>
                <HStack alignItems="flex-start" space={3}>
                  <VStack flex={1}>
                    <Text fontSize="md" fontWeight="900" color="coolGray.800" numberOfLines={1}>
                      {item.route.name}
                    </Text>
                    <Text fontSize="xs" color="coolGray.500">
                      {selectedDay} | {formatRouteWindow(item.route)}
                    </Text>
                  </VStack>
                  <Box bg={`${periodColor(item.assignment.routePeriod)}.100`} borderRadius="full" px="2.5" py="1">
                    <Text fontSize="2xs" fontWeight="800" color="coolGray.700">
                      {periodLabel(item.assignment.routePeriod)}
                    </Text>
                  </Box>
                </HStack>

                {selectedStop ? (
                  <Box bg="student.50" borderRadius="xl" p="3">
                    <Text fontSize="2xs" color="student.700" fontWeight="800">Sua parada</Text>
                    <HStack alignItems="center" justifyContent="space-between" space={3}>
                      <Text flex={1} fontSize="sm" fontWeight="900" color="student.700" numberOfLines={1}>
                        {selectedStop.name}
                      </Text>
                      <Text fontSize="lg" fontWeight="900" color="student.700">
                        {getStopPassTime(item.route, selectedStop, item.assignment.departureTime)}
                      </Text>
                    </HStack>
                  </Box>
                ) : null}

                <VStack space={2}>
                  {item.stops.map((stop, index) => {
                    const isSelected = String(stop.routeStopId) === String(item.assignment.routeStopId);
                    return (
                      <HStack key={`${item.assignment.id}-${stop.id}-${index}`} alignItems="center" space={3}>
                        <Box w="8" h="8" borderRadius="full" bg={isSelected ? 'student.600' : 'coolGray.100'} alignItems="center" justifyContent="center">
                          <Text fontSize="xs" fontWeight="900" color={isSelected ? 'white' : 'coolGray.600'}>
                            {index + 1}
                          </Text>
                        </Box>
                        <VStack flex={1}>
                          <Text fontSize="sm" fontWeight={isSelected ? '900' : '700'} color="coolGray.800" numberOfLines={1}>
                            {stop.name}
                          </Text>
                          <Text fontSize="2xs" color="coolGray.500" numberOfLines={1}>
                            +{getStopOffsetMinutes(stop)} min | {stop.address}
                          </Text>
                        </VStack>
                        <Text fontSize="sm" fontWeight="900" color={isSelected ? 'student.700' : 'coolGray.600'}>
                          {getStopPassTime(item.route, stop, item.assignment.departureTime)}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </VStack>
            </Box>
          );
        }}
        ListEmptyComponent={<EmptyState icon="calendar-outline" message="Nenhuma rota ativa para montar calendario." />}
      />
    </Box>
  );
}
