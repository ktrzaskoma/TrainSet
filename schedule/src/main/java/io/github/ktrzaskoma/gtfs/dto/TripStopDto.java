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
public class TripStopDto {
    private String stopId;
    private String stopName;
    private Integer stopSequence;
    private LocalTime arrivalTime;
    private LocalTime departureTime;
}







