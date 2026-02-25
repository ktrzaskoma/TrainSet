package io.github.ktrzaskoma.ticket.service;

import io.github.ktrzaskoma.ticket.dto.TicketPurchaseRequest;
import io.github.ktrzaskoma.ticket.dto.TicketResponse;
import io.github.ktrzaskoma.ticket.dto.TripTimesDto;
import io.github.ktrzaskoma.ticket.model.Ticket;
import io.github.ktrzaskoma.ticket.repository.TicketRepository;
import io.github.ktrzaskoma.infrastructure.feign.ScheduleClient;
import io.github.ktrzaskoma.infrastructure.feign.NotificationClient;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketValidationService validationService;
    private final ScheduleClient scheduleClient;
    private final NotificationClient notificationClient;

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse.TicketResponseBuilder builder = TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .userId(ticket.getUserId())
                .userEmail(ticket.getUserEmail())
                .tripId(ticket.getTripId())
                .fromStopId(ticket.getFromStopId())
                .toStopId(ticket.getToStopId())
                .fromStopName(ticket.getFromStopName())
                .toStopName(ticket.getToStopName())
                .travelDate(ticket.getTravelDate())
                .departureTime(ticket.getDepartureTime())
                .arrivalTime(ticket.getArrivalTime())
                .validFrom(ticket.getValidFrom())
                .validUntil(ticket.getValidUntil())
                .price(ticket.getPrice())
                .status(ticket.getStatus())
                .category(ticket.getCategory())
                .type(ticket.getType());
        
        try {
            log.info("Fetching trip times for ticket {}: tripId={}, fromStopId={}, toStopId={}", 
                    ticket.getTicketNumber(), ticket.getTripId(), ticket.getFromStopId(), ticket.getToStopId());
            
            TripTimesDto tripTimes = scheduleClient.getTripTimesOrDefault(
                ticket.getTripId(),
                ticket.getFromStopId(),
                ticket.getToStopId()
            );
            
            log.info("Received trip times for ticket {}: hasDelay={}, delayMinutes={}, actualDeparture={}, actualArrival={}", 
                    ticket.getTicketNumber(), 
                    tripTimes != null ? tripTimes.isHasDelay() : "null", 
                    tripTimes != null ? tripTimes.getDelayMinutes() : "null",
                    tripTimes != null ? tripTimes.getActualDepartureTime() : "null",
                    tripTimes != null ? tripTimes.getActualArrivalTime() : "null");
            
            if (tripTimes != null && tripTimes.isHasDelay()) {
                log.info("Setting delay information for ticket {}", ticket.getTicketNumber());
                builder.hasDelay(true)
                       .delayMinutes(tripTimes.getDelayMinutes())
                       .delayReason(tripTimes.getDelayReason())
                       .actualDepartureTime(tripTimes.getActualDepartureTime())
                       .actualArrivalTime(tripTimes.getActualArrivalTime());
            } else {
                log.info("No delay information for ticket {}", ticket.getTicketNumber());
                builder.hasDelay(false);
            }
            
            // Set cancellation information
            if (tripTimes != null && tripTimes.getCancelled() != null && tripTimes.getCancelled()) {
                log.info("Setting cancellation information for ticket {}", ticket.getTicketNumber());
                builder.cancelled(true)
                       .cancellationReason(tripTimes.getCancellationReason());
            } else {
                builder.cancelled(false);
            }
        } catch (Exception e) {
            log.error("ERROR fetching delay information for ticket {}: {} - {}", 
                    ticket.getTicketNumber(), e.getClass().getName(), e.getMessage(), e);
            builder.hasDelay(false);
        }
        
        return builder.build();
    }

    private String generateTicketNumber() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }


    @Transactional
    public TicketResponse purchaseTicket(TicketPurchaseRequest request) {
        log.info("Processing ticket purchase for user: {}", request.getUserId());

        boolean isValid = validationService.validateConnection(request);

        if (!isValid) {
            log.error("Invalid connection for trip: {} from {} to {} on {}", 
                     request.getTripId(), request.getFromStopId(), request.getToStopId(), request.getTravelDate());
            throw new IllegalArgumentException("Invalid connection: Trip " + request.getTripId() + 
                                             " does not connect " + request.getFromStopId() + 
                                             " to " + request.getToStopId() + " on " + request.getTravelDate());
        }
        
        log.info("Connection validated successfully for trip: {}", request.getTripId());

        TripTimesDto tripTimes = scheduleClient.getTripTimesOrDefault(
                request.getTripId(), 
                request.getFromStopId(), 
                request.getToStopId()
        );
        
        log.info("Retrieved trip times - Departure: {}, Arrival: {}, Has delay: {}", 
                tripTimes.getActualDepartureTime(), 
                tripTimes.getActualArrivalTime(), 
                tripTimes.isHasDelay());

        String ticketNumber = generateTicketNumber();

        long durationMinutes = java.time.Duration.between(
                tripTimes.getActualDepartureTime(),
                tripTimes.getActualArrivalTime()
        ).toMinutes();
        String category;
        int validityMinutes;
        if (durationMinutes <= 19) {
            category = "SHORT";
            validityMinutes = 19;
        } else if (durationMinutes <= 38) {
            category = "MEDIUM";
            validityMinutes = 38;
        } else {
            category = "LONG";
            validityMinutes = 60; // 1 hour for long trips
        }

        java.math.BigDecimal basePrice;
        switch (category) {
            case "SHORT":
                basePrice = new java.math.BigDecimal("4.00");
                break;
            case "MEDIUM":
                basePrice = new java.math.BigDecimal("6.50");
                break;
            default:
                basePrice = new java.math.BigDecimal("9.00");
        }

        String type = (request.getType() != null && request.getType().equalsIgnoreCase("DISCOUNT")) ? "DISCOUNT" : "NORMAL";
        java.math.BigDecimal price = "DISCOUNT".equals(type)
                ? basePrice.multiply(new java.math.BigDecimal("0.5"))
                : basePrice;
        log.debug("Generated ticket number: {}", ticketNumber);

        // Set validity based on ticket category time limits
        java.time.LocalDateTime validFrom = request.getTravelDate().atTime(tripTimes.getActualDepartureTime());
        java.time.LocalDateTime candidateValidUntil = validFrom.plusMinutes(validityMinutes);
        
        log.info("Ticket category: {}, validity: {} minutes, valid from: {}, valid until: {}", 
                category, validityMinutes, validFrom, candidateValidUntil);

        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumber)
                .userId(request.getUserId())
                .userEmail(request.getUserEmail())
                .tripId(request.getTripId())
                .fromStopId(request.getFromStopId())
                .toStopId(request.getToStopId())
                .fromStopName(request.getFromStopName())
                .toStopName(request.getToStopName())
                .travelDate(request.getTravelDate())
                .departureTime(tripTimes.getActualDepartureTime())
                .arrivalTime(tripTimes.getActualArrivalTime())
                .price(price)
                .status("ACTIVE")
                .validFrom(validFrom)
                .validUntil(candidateValidUntil)
                .category(category)
                .type(type)
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket saved with ID: {}", ticket.getId());

        try {
            notificationClient.sendTicketPurchaseNotification(
                ticket.getUserId(),
                ticket.getUserEmail(),
                ticket.getTicketNumber(),
                request.getFromStopName(),
                request.getToStopName(),
                ticket.getTravelDate().toString(),
                ticket.getDepartureTime().toString(),
                ticket.getArrivalTime().toString(),
                ticket.getPrice().toString(),
                ticket.getType()
            );
            log.info("Ticket purchase notification sent successfully for ticket: {}", ticket.getTicketNumber());
        } catch (Exception e) {
            log.warn("Failed to send ticket purchase notification, but ticket was created successfully: {}", e.getMessage());
        }

        return mapToResponse(ticket);
    }

    @Transactional
    public List<TicketResponse> getUserTickets(Long userId) {
        log.debug("Fetching tickets for user: {}", userId);
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketResponse getTicket(String ticketNumber) {
        log.debug("Fetching ticket: {}", ticketNumber);
        Ticket ticket = ticketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketNumber));
        return mapToResponse(ticket);
    }

    @Transactional
    public boolean validateTicket(String ticketNumber) {
        log.debug("Validating ticket: {}", ticketNumber);
        return ticketRepository.findByTicketNumber(ticketNumber)
                .map(ticket -> "ACTIVE".equals(ticket.getStatus())
                        && LocalDateTime.now().isBefore(ticket.getValidUntil()))
                .orElse(false);
    }

    @Transactional
    public List<TicketResponse> getTicketsByTrip(String tripId) {
        log.debug("Fetching tickets for trip: {}", tripId);
        List<Ticket> tickets = ticketRepository.findByTripIdAndStatus(tripId, "ACTIVE");
        log.info("Found {} tickets in database for trip: {}", tickets.size(), tripId);
        
        List<TicketResponse> responses = tickets.stream()
                .map(ticket -> {
                    log.debug("Processing ticket {} for userId: {}, status: {}", 
                            ticket.getTicketNumber(), ticket.getUserId(), ticket.getStatus());
                    return mapToResponse(ticket);
                })
                .collect(Collectors.toList());
        
        log.info("Mapped {} ticket responses for trip: {}", responses.size(), tripId);
        return responses;
    }

    @Transactional
    public List<TicketResponse> getAllTickets() {
        log.debug("Fetching all tickets for admin");
        return ticketRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUserTickets(Long userId) {
        log.info("Deleting all tickets for user ID: {}", userId);
        List<Ticket> userTickets = ticketRepository.findByUserId(userId);
        log.info("Found {} tickets for user ID: {}", userTickets.size(), userId);
        ticketRepository.deleteAll(userTickets);
        log.info("Successfully deleted all tickets for user ID: {}", userId);
    }

    @Transactional
    public void updateUserEmail(Long userId, String newEmail) {
        log.info("Updating email for all tickets of user ID: {} to new email: {}", userId, newEmail);
        List<Ticket> userTickets = ticketRepository.findByUserId(userId);
        log.info("Found {} tickets to update for user ID: {}", userTickets.size(), userId);
        
        for (Ticket ticket : userTickets) {
            ticket.setUserEmail(newEmail);
        }
        
        ticketRepository.saveAll(userTickets);
        log.info("Successfully updated email for {} tickets of user ID: {}", userTickets.size(), userId);
    }
}
