package io.github.ktrzaskoma.delay.dto;

import io.github.ktrzaskoma.delay.model.DelayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDelayRequest {
    private Integer delayMinutes;
    private String reason;
    private String reasonCode;
    private DelayType delayType;
}


