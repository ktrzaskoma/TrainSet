package io.github.ktrzaskoma.gtfs.dto;

import lombok.*;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class StopDto {
    private String stopId;
    private String stopName;
    private BigDecimal stopLat;
    private BigDecimal stopLon;
    private Integer wheelchairBoarding;
    private java.time.LocalTime arrivalTime;  // For intermediate stops display
}
