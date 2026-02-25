package io.github.ktrzaskoma.ticket.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TicketPurchaseRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String userEmail;

    @NotBlank(message = "Trip ID is required")
    private String tripId;

    @NotBlank(message = "From stop ID is required")
    private String fromStopId;

    @NotBlank(message = "To stop ID is required")
    private String toStopId;
    
    private String fromStopName;
    private String toStopName;

    @NotNull(message = "Travel date is required")
    private LocalDate travelDate;

    private String type;
}
