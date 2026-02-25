package io.github.ktrzaskoma.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketPurchaseRequest {
    private Long userId;
    private String userEmail;
    private String tripId;
    private String fromStopId;
    private String toStopId;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private String passengerName;
    private String passengerEmail;
    private String passengerPhone;
}

