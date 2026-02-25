package io.github.ktrzaskoma.ticket.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    @Column(precision = 10, scale = 2)
    private BigDecimal price;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;

    private String category;
    private String type;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
        if (validFrom == null) {
            validFrom = LocalDateTime.now();
        }
    }
}
