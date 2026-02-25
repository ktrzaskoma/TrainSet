package io.github.ktrzaskoma.ticket.controller;

import io.github.ktrzaskoma.infrastructure.feign.NotificationClient;
import io.github.ktrzaskoma.infrastructure.feign.TicketingClient;
import io.github.ktrzaskoma.notification.dto.NotificationMessage;
import io.github.ktrzaskoma.ticket.dto.TicketPurchaseRequest;
import io.github.ktrzaskoma.ticket.dto.TicketResponse;
import io.github.ktrzaskoma.user.model.User;
import io.github.ktrzaskoma.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
@Slf4j
public class TicketController {

    private final TicketingClient ticketingClient;
    private final UserService userService;
    private final NotificationClient notificationClient;

    @PostMapping
    public ResponseEntity<?> purchaseTicket(@RequestBody TicketPurchaseRequest request) {
        try {
            log.info("Processing ticket purchase for user: {}", request.getUserId());
            
            if (!userService.userExists(request.getUserId())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "User not found"));
            }
            
            var user = userService.getUserById(request.getUserId());
            request.setUserEmail(user.getEmail());
            
            TicketResponse ticket = ticketingClient.purchaseTicket(request);
            
            try {
                sendTicketPurchaseNotification(user, ticket);
            } catch (Exception e) {
                log.warn("Failed to send ticket purchase notification: {}", e.getMessage());
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
            
        } catch (Exception e) {
            log.error("Error purchasing ticket: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to purchase ticket: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserTickets(@PathVariable Long userId) {
        try {
            log.info("Fetching tickets for user: {}", userId);
            
            if (!userService.userExists(userId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "User not found"));
            }
            
            List<TicketResponse> tickets = ticketingClient.getUserTickets(userId);
            return ResponseEntity.ok(tickets);
            
        } catch (Exception e) {
            log.error("Error fetching user tickets: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch tickets: " + e.getMessage()));
        }
    }

    @GetMapping("/{ticketNumber}")
    public ResponseEntity<?> getTicketByNumber(@PathVariable String ticketNumber) {
        try {
            log.info("Fetching ticket by number: {}", ticketNumber);
            TicketResponse ticket = ticketingClient.getTicketById(ticketNumber);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            log.error("Error fetching ticket: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch ticket: " + e.getMessage()));
        }
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTicketsByTrip(@PathVariable String tripId) {
        try {
            log.info("Fetching tickets for trip: {}", tripId);
            List<TicketResponse> tickets = ticketingClient.getTicketsByTrip(tripId);
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            log.error("Error fetching tickets for trip: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch tickets: " + e.getMessage()));
        }
    }

    private void sendTicketPurchaseNotification(User user, TicketResponse ticket) {
        // Calculate time zone based on travel duration
        String timeZone = "N/A";
        try {
            java.time.LocalTime departure = ticket.getDepartureTime();
            java.time.LocalTime arrival = ticket.getArrivalTime();
            long durationMinutes = java.time.Duration.between(departure, arrival).toMinutes();
            
            // Handle overnight trips
            if (durationMinutes < 0) {
                durationMinutes += 24 * 60;
            }
            
            if (durationMinutes <= 19) {
                timeZone = "I strefa (do 19 min czasu podróży)";
            } else if (durationMinutes <= 38) {
                timeZone = "II strefa (do 38 min czasu podróży)";
            } else {
                timeZone = "III strefa (powyżej 38 min czasu podróży)";
            }
        } catch (Exception e) {
            log.warn("Could not calculate time zone for ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
        }
        
        String subject = "Potwierdzenie zakupu biletu";
        String content = String.format(
            "Szanowny Pasażerze %s,\n\n" +
            "Dziękujemy za zakup biletu w systemie Trainset!\n\n" +
            "Szczegóły biletu:\n" +
            "Numer biletu: %s\n" +
            "Od: %s\n" +
            "Do: %s\n" +
            "Data podróży: %s\n" +
            "Odjazd: %s\n" +
            "Przyjazd: %s\n" +
            "Strefa czasowa: %s\n\n" +
            "Życzymy przyjemnej podróży!\n\n" +
            "Trainset",
            user.getFirstName(),
            ticket.getTicketNumber(),
            ticket.getFromStopId(),
            ticket.getToStopId(),
            ticket.getTravelDate(),
            ticket.getDepartureTime(),
            ticket.getArrivalTime(),
            timeZone
        );

        NotificationMessage notification = NotificationMessage.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .type("TICKET_PURCHASED")
                .subject(subject)
                .content(content)
                .build();

        notificationClient.sendNotification(notification);
        log.info("Ticket purchase notification sent to user: {} for ticket: {}", user.getId(), ticket.getTicketNumber());
    }
}

