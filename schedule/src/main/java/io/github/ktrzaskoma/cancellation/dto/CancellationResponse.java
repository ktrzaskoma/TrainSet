package io.github.ktrzaskoma.cancellation.dto;

import io.github.ktrzaskoma.cancellation.model.CancellationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancellationResponse {
    
    private Long id;
    private String tripId;
    private String reasonCode;
    private String reason;
    private LocalDateTime cancellationDate;
    private CancellationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

