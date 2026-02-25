package io.github.ktrzaskoma.gtfs.controller;

import io.github.ktrzaskoma.gtfs.dto.ConnectionDto;
import io.github.ktrzaskoma.gtfs.dto.StopDto;
import io.github.ktrzaskoma.gtfs.dto.TripTimesDto;
import io.github.ktrzaskoma.gtfs.dto.TripGroupDto;
import io.github.ktrzaskoma.gtfs.dto.TripStopDto;
import io.github.ktrzaskoma.gtfs.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/stops")
    public ResponseEntity<List<StopDto>> getAllStops() {
        log.info("Getting all stops");
        List<StopDto> stops = scheduleService.getAllActiveStops();
        return ResponseEntity.ok(stops);
    }

    @GetMapping("/stops/route-order")
    public ResponseEntity<List<StopDto>> getStopsInRouteOrder() {
        log.info("Getting stops in route order");
        List<StopDto> stops = scheduleService.getStopsInRouteOrder();
        return ResponseEntity.ok(stops);
    }

    @GetMapping("/intermediate-stops")
    public ResponseEntity<List<StopDto>> getIntermediateStops(
            @RequestParam String tripId,
            @RequestParam String fromStopId,
            @RequestParam String toStopId) {
        log.info("Getting intermediate stops for trip: {}, from: {}, to: {}", tripId, fromStopId, toStopId);
        List<StopDto> stops = scheduleService.getIntermediateStops(tripId, fromStopId, toStopId);
        return ResponseEntity.ok(stops);
    }

    @GetMapping("/connections")
    public ResponseEntity<List<ConnectionDto>> searchConnections(
            @RequestParam String fromStopId,
            @RequestParam String toStopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time) {
        log.info("Searching connections from {} to {} on {} at {}", fromStopId, toStopId, date, time);
        List<ConnectionDto> connections = scheduleService.findConnections(fromStopId, toStopId, date, time);
        return ResponseEntity.ok(connections);
    }

    @GetMapping("/connections/trip/{tripId}")
    public ResponseEntity<List<ConnectionDto>> getConnectionsByTrip(
            @PathVariable String tripId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Getting connections for trip: {} on {}", tripId, date);
        List<ConnectionDto> connections = scheduleService.findConnectionsByTrip(tripId, date);
        return ResponseEntity.ok(connections);
    }

    @GetMapping("/validate-connection")
    public ResponseEntity<Boolean> validateConnection(
            @RequestParam String tripId,
            @RequestParam String fromStopId,
            @RequestParam String toStopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Validating connection for trip: {}, from: {}, to: {}, date: {}", tripId, fromStopId, toStopId, date);
        boolean isValid = scheduleService.validateTripConnectionOnDate(tripId, fromStopId, toStopId, date);
        return ResponseEntity.ok(isValid);
    }

    @GetMapping("/trip-times")
    public ResponseEntity<TripTimesDto> getTripTimes(
            @RequestParam String tripId,
            @RequestParam String fromStopId,
            @RequestParam String toStopId) {
        log.info("Getting trip times for trip: {}, from: {}, to: {}", tripId, fromStopId, toStopId);
        TripTimesDto tripTimes = scheduleService.getTripTimes(tripId, fromStopId, toStopId);
        return ResponseEntity.ok(tripTimes);
    }

    @GetMapping("/trips/grouped")
    public ResponseEntity<List<TripGroupDto>> getAllTripsGrouped() {
        log.info("Getting all trips grouped");
        List<TripGroupDto> trips = scheduleService.getAllTripsGrouped();
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/trips/{tripId}/stops")
    public ResponseEntity<List<TripStopDto>> getTripStops(
            @PathVariable String tripId,
            @RequestParam String serviceId) {
        log.info("Getting stops for trip: {}, service: {}", tripId, serviceId);
        List<TripStopDto> stops = scheduleService.getAllStopsForTrip(tripId, serviceId);
        return ResponseEntity.ok(stops);
    }
}
