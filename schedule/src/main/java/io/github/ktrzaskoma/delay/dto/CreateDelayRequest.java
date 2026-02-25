package io.github.ktrzaskoma.delay.dto;

import io.github.ktrzaskoma.delay.model.DelayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDelayRequest {
    private String tripId;
    private String stopId;
    private Integer delayMinutes;
    private LocalTime originalDepartureTime;
    private LocalTime originalArrivalTime;
    private DelayType delayType;
    private String reasonCode;
}


