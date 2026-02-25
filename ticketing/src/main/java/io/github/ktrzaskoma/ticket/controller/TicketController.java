package io.github.ktrzaskoma.ticket.controller;

import io.github.ktrzaskoma.ticket.dto.TicketPurchaseRequest;
import io.github.ktrzaskoma.ticket.dto.TicketResponse;
import io.github.ktrzaskoma.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/ticket")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/purchase")
    public ResponseEntity<TicketResponse> purchaseTicket(
            @Valid @RequestBody TicketPurchaseRequest request) {
        log.info("Received ticket purchase request: {}", request);
        TicketResponse response = ticketService.purchaseTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TicketResponse>> getUserTickets(@PathVariable Long userId) {
        log.info("Fetching tickets for user: {}", userId);
        return ResponseEntity.ok(ticketService.getUserTickets(userId));
    }

    @GetMapping("/{ticketNumber}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable String ticketNumber) {
        log.info("Fetching ticket: {}", ticketNumber);
        return ResponseEntity.ok(ticketService.getTicket(ticketNumber));
    }

    @GetMapping("/validate/{ticketNumber}")
    public ResponseEntity<Boolean> validateTicket(@PathVariable String ticketNumber) {
        log.info("Validating ticket: {}", ticketNumber);
        return ResponseEntity.ok(ticketService.validateTicket(ticketNumber));
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<TicketResponse>> getTicketsByTrip(@PathVariable String tripId) {
        log.info("Fetching tickets for trip: {}", tripId);
        return ResponseEntity.ok(ticketService.getTicketsByTrip(tripId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        log.info("Fetching all tickets for admin");
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteUserTickets(@PathVariable Long userId) {
        log.info("Deleting all tickets for user: {}", userId);
        ticketService.deleteUserTickets(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/user/{userId}/email")
    public ResponseEntity<Void> updateUserEmail(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        String newEmail = request.get("email");
        if (newEmail == null || newEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        log.info("Updating email for all tickets of user: {} to: {}", userId, newEmail);
        ticketService.updateUserEmail(userId, newEmail);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Ticketing service is running");
    }
}
