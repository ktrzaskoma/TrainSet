package io.github.ktrzaskoma.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private Long userId;
    private String userEmail;
    private String tripId;
    private String fromStopId;
    private String toStopId;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private BigDecimal price;
    private String status;
}

