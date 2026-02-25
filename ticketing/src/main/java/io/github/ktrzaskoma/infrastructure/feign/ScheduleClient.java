package io.github.ktrzaskoma.infrastructure.feign;

import io.github.ktrzaskoma.ticket.dto.TripTimesDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@FeignClient(name = "${feign.schedule.name}", url = "${feign.schedule.url}")
public interface ScheduleClient {

    @GetMapping("/validate-connection")
    Boolean validateConnection(
            @RequestParam("tripId") String tripId,
            @RequestParam("fromStopId") String fromStopId,
            @RequestParam("toStopId") String toStopId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );

    @GetMapping("/trip-times")
    TripTimesDto getTripTimes(
            @RequestParam("tripId") String tripId,
            @RequestParam("fromStopId") String fromStopId,
            @RequestParam("toStopId") String toStopId
    );

    default boolean validateOrDefaultTrue(String tripId, String fromStopId,
                                          String toStopId, LocalDate date) {
        try {
            Boolean response = validateConnection(tripId, fromStopId, toStopId, date);
            if (response == null) {
                return true;
            }
            return response;
        } catch (Exception e) {
            return true;
        }
    }

    default TripTimesDto getTripTimesOrDefault(String tripId, String fromStopId, String toStopId) {
        try {
            return getTripTimes(tripId, fromStopId, toStopId);
        } catch (Exception e) {
            return TripTimesDto.builder()
                    .tripId(tripId)
                    .fromStopId(fromStopId)
                    .toStopId(toStopId)
                    .scheduledDepartureTime(java.time.LocalTime.of(8, 15))
                    .scheduledArrivalTime(java.time.LocalTime.of(8, 22))
                    .actualDepartureTime(java.time.LocalTime.of(8, 15))
                    .actualArrivalTime(java.time.LocalTime.of(8, 22))
                    .hasDelay(false)
                    .delayMinutes(null)
                    .cancelled(false)
                    .cancellationReason(null)
                    .build();
        }
    }
}
