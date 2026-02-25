package io.github.ktrzaskoma.gtfs.service;


import io.github.ktrzaskoma.gtfs.dto.ConnectionDto;
import io.github.ktrzaskoma.gtfs.dto.StopDto;
import io.github.ktrzaskoma.gtfs.dto.TripTimesDto;
import io.github.ktrzaskoma.gtfs.dto.TripInfoDto;
import io.github.ktrzaskoma.gtfs.dto.TripGroupDto;
import io.github.ktrzaskoma.gtfs.dto.TripStopDto;
import io.github.ktrzaskoma.gtfs.repository.StopRepository;
import io.github.ktrzaskoma.gtfs.model.StopTime;
import io.github.ktrzaskoma.gtfs.repository.StopTimeRepository;
import io.github.ktrzaskoma.delay.repository.DelayRepository;
import io.github.ktrzaskoma.delay.model.DelayStatus;
import io.github.ktrzaskoma.cancellation.repository.CancellationRepository;
import io.github.ktrzaskoma.cancellation.model.CancellationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleService {

    private final StopRepository stopRepository;
    private final StopTimeRepository stopTimeRepository;
    private final DelayRepository delayRepository;
    private final CancellationRepository cancellationRepository;

    public List<StopDto> getAllActiveStops() {
        return stopRepository.findByUploadIsActiveTrue().stream()
                .map(stop -> StopDto.builder()
                        .stopId(stop.getStopId())
                        .stopName(stop.getStopName())
                        .stopLat(stop.getStopLat())
                        .stopLon(stop.getStopLon())
                        .wheelchairBoarding(stop.getWheelchairBoarding())
                        .build())
                .collect(Collectors.toList());
    }

    public List<StopDto> getStopsInRouteOrder() {
        List<StopTime> stopTimes = stopTimeRepository.findAll().stream()
                .filter(st -> st.getUpload().getIsActive())
                .sorted((st1, st2) -> {
                    int tripComparison = st1.getTrip().getTripId().compareTo(st2.getTrip().getTripId());
                    if (tripComparison != 0) {
                        return tripComparison;
                    }
                    return Integer.compare(st1.getStopSequence(), st2.getStopSequence());
                })
                .collect(Collectors.toList());

        if (!stopTimes.isEmpty()) {
            String firstTripId = stopTimes.get(0).getTrip().getTripId();
            return stopTimes.stream()
                    .filter(st -> st.getTrip().getTripId().equals(firstTripId))
                    .map(st -> StopDto.builder()
                            .stopId(st.getStop().getStopId())
                            .stopName(st.getStop().getStopName())
                            .stopLat(st.getStop().getStopLat())
                            .stopLon(st.getStop().getStopLon())
                            .wheelchairBoarding(st.getStop().getWheelchairBoarding())
                            .build())
                    .collect(Collectors.toList());
        }

        return getAllActiveStops();
    }

    public List<StopDto> getIntermediateStops(String tripId, String fromStopId, String toStopId) {
        List<StopTime> allStops = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        
        int fromIndex = -1;
        int toIndex = -1;
        
        for (int i = 0; i < allStops.size(); i++) {
            if (allStops.get(i).getStop().getStopId().equals(fromStopId)) {
                fromIndex = i;
            }
            if (allStops.get(i).getStop().getStopId().equals(toStopId)) {
                toIndex = i;
            }
        }
        
        if (fromIndex == -1 || toIndex == -1 || fromIndex >= toIndex) {
            return new ArrayList<>();
        }
        
        List<StopTime> intermediateStops = allStops.subList(fromIndex + 1, toIndex);
        
        return intermediateStops.stream()
                .map(st -> StopDto.builder()
                        .stopId(st.getStop().getStopId())
                        .stopName(st.getStop().getStopName())
                        .stopLat(st.getStop().getStopLat())
                        .stopLon(st.getStop().getStopLon())
                        .wheelchairBoarding(st.getStop().getWheelchairBoarding())
                        .arrivalTime(st.getArrivalTime())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ConnectionDto> findConnectionsByTrip(String tripId, LocalDate date) {
        log.info("Searching connections for trip {} on {}", tripId, date);
        
        List<StopTime> allStops = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        
        if (allStops.isEmpty()) {
            log.warn("No stops found for trip {}", tripId);
            return new ArrayList<>();
        }
        
        boolean isActiveOnDate = stopTimeRepository.existsConnectionForTripOnDate(
            tripId, 
            allStops.get(0).getStop().getStopId(), 
            allStops.get(allStops.size() - 1).getStop().getStopId(), 
            date
        );
        
        if (!isActiveOnDate) {
            log.warn("Trip {} is not active on date {}", tripId, date);
            return new ArrayList<>();
        }
        
        List<ConnectionDto> connections = new ArrayList<>();
        
        for (int i = 0; i < allStops.size() - 1; i++) {
            StopTime departure = allStops.get(i);
            StopTime arrival = allStops.get(i + 1);
            
            LocalTime actualDepartureTime = getActualDepartureTime(
                departure.getTrip().getTripId(), 
                departure.getStop().getStopId(), 
                departure.getDepartureTime()
            );
            LocalTime actualArrivalTime = getActualArrivalTime(
                arrival.getTrip().getTripId(), 
                arrival.getStop().getStopId(), 
                arrival.getArrivalTime()
            );
            
            connections.add(ConnectionDto.builder()
                    .tripId(departure.getTrip().getTripId())
                    .routeShortName(departure.getTrip().getRoute().getRouteShortName())
                    .fromStopName(departure.getStop().getStopName())
                    .toStopName(arrival.getStop().getStopName())
                    .fromStopId(departure.getStop().getStopId())
                    .toStopId(arrival.getStop().getStopId())
                    .departureTime(actualDepartureTime)
                    .arrivalTime(actualArrivalTime)
                    .wheelchairAccessible(departure.getTrip().getWheelchairAccessible())
                    .bikesAllowed(departure.getTrip().getBikesAllowed())
                    .build());
        }
        
        log.info("Found {} connections for trip {}", connections.size(), tripId);
        return connections;
    }

    public List<ConnectionDto> findConnections(String fromStopId, String toStopId, LocalDate date, LocalTime time) {
        log.info("Searching connections from {} to {} on {} at {}", fromStopId, toStopId, date, time);
        
        List<StopTime> departureStopTimes = stopTimeRepository.findConnections(fromStopId, toStopId, time, date);
        log.info("Found {} departure stop times", departureStopTimes.size());

        List<ConnectionDto> connections = new ArrayList<>();

        for (StopTime departure : departureStopTimes) {
            log.debug("Processing departure: trip={}, stop={}, time={}", 
                     departure.getTrip().getTripId(), 
                     departure.getStop().getStopId(), 
                     departure.getDepartureTime());

            StopTime arrival = stopTimeRepository.findArrivalStopTime(
                    departure.getTrip().getTripId(), 
                    toStopId, 
                    departure.getStopSequence()
            ).orElse(null);

            if (arrival != null) {
                log.debug("Found arrival: trip={}, stop={}, time={}", 
                         arrival.getTrip().getTripId(), 
                         arrival.getStop().getStopId(), 
                         arrival.getArrivalTime());
                LocalTime actualDepartureTime = getActualDepartureTime(departure.getTrip().getTripId(), 
                                                                       departure.getStop().getStopId(), 
                                                                       departure.getDepartureTime());
                LocalTime actualArrivalTime = getActualArrivalTime(arrival.getTrip().getTripId(), 
                                                                  arrival.getStop().getStopId(), 
                                                                  arrival.getArrivalTime());

                Boolean hasDelay = false;
                Integer delayMinutes = 0;
                String delayReason = "";
                
                var departureDelay = delayRepository.findByTripIdAndStopIdAndStatus(
                    departure.getTrip().getTripId(), 
                    departure.getStop().getStopId(), 
                    DelayStatus.ACTIVE
                ).stream().findFirst();
                
                if (departureDelay.isPresent()) {
                    hasDelay = true;
                    delayMinutes = departureDelay.get().getDelayMinutes();
                    delayReason = departureDelay.get().getReason();
                }
                
                var arrivalDelay = delayRepository.findByTripIdAndStopIdAndStatus(
                    arrival.getTrip().getTripId(), 
                    arrival.getStop().getStopId(), 
                    DelayStatus.ACTIVE
                ).stream().findFirst();
                
                if (arrivalDelay.isPresent()) {
                    hasDelay = true;
                    if (arrivalDelay.get().getDelayMinutes() > delayMinutes) {
                        delayMinutes = arrivalDelay.get().getDelayMinutes();
                        delayReason = arrivalDelay.get().getReason();
                    }
                }
                
                Boolean cancelled = false;
                String cancellationReason = "";
                var cancellation = cancellationRepository.findByTripIdAndStatus(
                    departure.getTrip().getTripId(),
                    CancellationStatus.ACTIVE
                );
                
                log.error("!!! Checking cancellation for trip: {}, found: {}", 
                    departure.getTrip().getTripId(), cancellation.isPresent());
                
                if (cancellation.isPresent()) {
                    cancelled = true;
                    cancellationReason = cancellation.get().getReason() != null ? 
                        cancellation.get().getReason() : "Trasa odwołana";
                    log.error("!!! Trip {} is cancelled: {}", departure.getTrip().getTripId(), cancellationReason);
                }

                connections.add(ConnectionDto.builder()
                        .tripId(departure.getTrip().getTripId())
                        .routeShortName(departure.getTrip().getRoute().getRouteShortName())
                        .fromStopName(departure.getStop().getStopName())
                        .toStopName(arrival.getStop().getStopName())
                        .fromStopId(departure.getStop().getStopId())
                        .toStopId(arrival.getStop().getStopId())
                        .departureTime(actualDepartureTime)
                        .arrivalTime(actualArrivalTime)
                        .wheelchairAccessible(departure.getTrip().getWheelchairAccessible())
                        .bikesAllowed(departure.getTrip().getBikesAllowed())
                        .hasDelay(hasDelay)
                        .delayMinutes(delayMinutes)
                        .delayReason(delayReason)
                        .cancelled(cancelled)
                        .cancellationReason(cancellationReason)
                        .build());

                if (connections.size() >= 3) {
                    break;
                }
            }
        }

        log.info("Returning {} connections", connections.size());
        return connections;
    }

    public boolean validateTripConnectionOnDate(String tripId, String fromStopId, String toStopId, LocalDate date) {
        return stopTimeRepository.existsConnectionForTripOnDate(tripId, fromStopId, toStopId, date);
    }

    public TripTimesDto getTripTimes(String tripId, String fromStopId, String toStopId) {
        StopTime departureStopTime = stopTimeRepository.findByTripIdAndStopId(tripId, fromStopId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono przystanku początkowego dla przejazdu: " + tripId));
        
        StopTime arrivalStopTime = stopTimeRepository.findByTripIdAndStopId(tripId, toStopId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono przystanku końcowego dla przejazdu: " + tripId));

        LocalTime scheduledDepartureTime = departureStopTime.getDepartureTime();
        LocalTime scheduledArrivalTime = arrivalStopTime.getArrivalTime();

        // Check for cancellation first
        var activeCancellation = cancellationRepository.findByTripIdAndStatus(tripId, CancellationStatus.ACTIVE);
        Boolean cancelled = activeCancellation.isPresent();
        String cancellationReason = activeCancellation.map(c -> c.getReason()).orElse(null);

        // Check for any active delay on this trip (not just specific stops)
        var anyTripDelay = delayRepository.findByTripIdAndStatus(tripId, DelayStatus.ACTIVE)
                .stream()
                .findFirst();

        LocalTime actualDepartureTime;
        LocalTime actualArrivalTime;
        boolean hasDelay;
        Integer delayMinutes = null;
        String delayReason = null;

        if (anyTripDelay.isPresent()) {
            // If there's any delay on this trip, apply it
            var delay = anyTripDelay.get();
            delayMinutes = delay.getDelayMinutes();
            delayReason = delay.getReason();
            hasDelay = true;

            // Apply the delay to the scheduled times
            actualDepartureTime = scheduledDepartureTime.plusMinutes(delayMinutes);
            actualArrivalTime = scheduledArrivalTime.plusMinutes(delayMinutes);
        } else {
            // No delay, use scheduled times
            actualDepartureTime = scheduledDepartureTime;
            actualArrivalTime = scheduledArrivalTime;
            hasDelay = false;
        }

        return TripTimesDto.builder()
                .tripId(tripId)
                .fromStopId(fromStopId)
                .toStopId(toStopId)
                .scheduledDepartureTime(scheduledDepartureTime)
                .scheduledArrivalTime(scheduledArrivalTime)
                .actualDepartureTime(actualDepartureTime)
                .actualArrivalTime(actualArrivalTime)
                .hasDelay(hasDelay)
                .delayMinutes(delayMinutes)
                .delayReason(delayReason)
                .cancelled(cancelled)
                .cancellationReason(cancellationReason)
                .build();
    }

    private LocalTime getActualDepartureTime(String tripId, String stopId, LocalTime scheduledTime) {
        return delayRepository.findByTripIdAndStopIdAndStatus(tripId, stopId, DelayStatus.ACTIVE)
                .stream()
                .findFirst()
                .map(delay -> delay.getActualDepartureTime())
                .orElse(scheduledTime);
    }

    private LocalTime getActualArrivalTime(String tripId, String stopId, LocalTime scheduledTime) {
        return delayRepository.findByTripIdAndStopIdAndStatus(tripId, stopId, DelayStatus.ACTIVE)
                .stream()
                .findFirst()
                .map(delay -> delay.getActualArrivalTime())
                .orElse(scheduledTime);
    }

    public List<TripStopDto> getAllStopsForTrip(String tripId, String serviceId) {
        List<StopTime> stopTimes = stopTimeRepository.findAll().stream()
                .filter(st -> st.getUpload().getIsActive())
                .filter(st -> st.getTrip().getTripId().equals(tripId))
                .filter(st -> st.getTrip().getServiceId().equals(serviceId))
                .sorted(Comparator.comparing(StopTime::getStopSequence))
                .collect(Collectors.toList());

        return stopTimes.stream()
                .map(st -> TripStopDto.builder()
                        .stopId(st.getStop().getStopId())
                        .stopName(st.getStop().getStopName())
                        .arrivalTime(st.getArrivalTime())
                        .departureTime(st.getDepartureTime())
                        .stopSequence(st.getStopSequence())
                        .build())
                .collect(Collectors.toList());
    }

    public List<TripGroupDto> getAllTripsGrouped() {
        List<StopTime> allStopTimes = stopTimeRepository.findAll().stream()
                .filter(st -> st.getUpload().getIsActive())
                .collect(Collectors.toList());

        Map<String, List<StopTime>> tripGroups = allStopTimes.stream()
                .collect(Collectors.groupingBy(st -> st.getTrip().getTripId()));

        return tripGroups.entrySet().stream()
                .map(entry -> {
                    String tripId = entry.getKey();
                    List<StopTime> stopTimes = entry.getValue();

                    stopTimes.sort(Comparator.comparing(StopTime::getStopSequence));

                    Map<String, List<StopTime>> serviceGroups = stopTimes.stream()
                            .collect(Collectors.groupingBy(st -> st.getTrip().getServiceId()));

                    List<TripInfoDto> variants = serviceGroups.entrySet().stream()
                            .map(serviceEntry -> {
                                String serviceId = serviceEntry.getKey();
                                List<StopTime> serviceTimes = serviceEntry.getValue();
                                serviceTimes.sort(Comparator.comparing(StopTime::getStopSequence));

                                StopTime firstStop = serviceTimes.get(0);
                                StopTime lastStop = serviceTimes.get(serviceTimes.size() - 1);

                                return TripInfoDto.builder()
                                        .tripId(tripId)
                                        .serviceId(serviceId)
                                        .firstStopId(firstStop.getStop().getStopId())
                                        .firstStopName(firstStop.getStop().getStopName())
                                        .lastStopId(lastStop.getStop().getStopId())
                                        .lastStopName(lastStop.getStop().getStopName())
                                        .firstStopDepartureTime(firstStop.getDepartureTime())
                                        .lastStopArrivalTime(lastStop.getArrivalTime())
                                        .stopCount(serviceTimes.size())
                                        .build();
                            })
                            .sorted(Comparator.comparing(TripInfoDto::getFirstStopDepartureTime))
                            .collect(Collectors.toList());

                    return TripGroupDto.builder()
                            .tripId(tripId)
                            .variants(variants)
                            .variantCount(variants.size())
                            .build();
                })
                .sorted(Comparator.comparing(TripGroupDto::getTripId))
                .collect(Collectors.toList());
    }


}
