package io.github.ktrzaskoma.delay.dto;

import io.github.ktrzaskoma.delay.model.DelayStatus;
import io.github.ktrzaskoma.delay.model.DelayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayDto {
    private Long id;
    private String tripId;
    private String stopId;
    private Integer stopSequence;
    private String stopName;
    private String routeShortName;
    private Integer delayMinutes;
    private LocalTime originalDepartureTime;
    private LocalTime originalArrivalTime;
    private LocalTime actualDepartureTime;
    private LocalTime actualArrivalTime;
    private DelayType delayType;
    private DelayStatus status;
    private String reason;
    private String reasonCode;
    private String reasonDescription;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}








