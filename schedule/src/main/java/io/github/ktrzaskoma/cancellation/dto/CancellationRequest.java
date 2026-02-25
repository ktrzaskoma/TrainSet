package io.github.ktrzaskoma.cancellation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancellationRequest {
    
    @NotBlank(message = "Trip ID is required")
    private String tripId;
    private String reasonCode;
    private LocalDateTime cancellationDate;
}

