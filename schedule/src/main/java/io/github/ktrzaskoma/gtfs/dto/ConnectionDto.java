package io.github.ktrzaskoma.gtfs.dto;

import lombok.*;

import java.time.LocalTime;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class ConnectionDto {
    private String tripId;
    private String routeShortName;
    private String fromStopName;
    private String toStopName;
    private String fromStopId;  // Added for ticket purchase
    private String toStopId;    // Added for ticket purchase
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    private Integer wheelchairAccessible;
    private Integer bikesAllowed;
    private Boolean hasDelay;
    private Integer delayMinutes;
    private String delayReason;
    private Boolean cancelled;
    private String cancellationReason;
}
