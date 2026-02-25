package io.github.ktrzaskoma.gtfs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripTimesDto {
    private String tripId;
    private String fromStopId;
    private String toStopId;
    private LocalTime scheduledDepartureTime;
    private LocalTime scheduledArrivalTime;
    private LocalTime actualDepartureTime;
    private LocalTime actualArrivalTime;
    private boolean hasDelay;
    private Integer delayMinutes;
    private String delayReason;
    private Boolean cancelled;
    private String cancellationReason;
}
