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
public class TripInfoDto {
    private String tripId;
    private String serviceId;
    private String firstStopId;
    private String firstStopName;
    private String lastStopId;
    private String lastStopName;
    private LocalTime firstStopDepartureTime;
    private LocalTime lastStopArrivalTime;
    private Integer stopCount;
}

