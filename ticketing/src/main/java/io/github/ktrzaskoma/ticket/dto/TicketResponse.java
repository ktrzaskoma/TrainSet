package io.github.ktrzaskoma.ticket.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private Long userId;
    private String userEmail;
    private String tripId;
    private String fromStopId;
    private String toStopId;
    private String fromStopName;
    private String toStopName;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private BigDecimal price;
    private String status;
    private String category;
    private String type;
    
    private Boolean hasDelay;
    private Integer delayMinutes;
    private String delayReason;
    private LocalTime actualDepartureTime;
    private LocalTime actualArrivalTime;
    private Boolean cancelled;
    private String cancellationReason;
}
