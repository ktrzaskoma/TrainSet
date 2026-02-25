package io.github.ktrzaskoma.ticket.service;

import io.github.ktrzaskoma.ticket.dto.TicketPurchaseRequest;
import io.github.ktrzaskoma.infrastructure.feign.ScheduleClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketValidationService {

    private final ScheduleClient scheduleClient;

    public boolean validateConnection(TicketPurchaseRequest request) {
        try {
            boolean isValid = scheduleClient.validateOrDefaultTrue(
                    request.getTripId(),
                    request.getFromStopId(),
                    request.getToStopId(),
                    request.getTravelDate()
            );
            
            if (isValid) {
                log.info("Connection validated by Schedule Service for trip: {}", request.getTripId());
                return true;
            } else {
                log.warn("Schedule Service rejected connection for trip: {}", request.getTripId());
                return false;
            }
            
        } catch (Exception e) {
            log.warn("Schedule Service unavailable, falling back to basic validation: {}", e.getMessage());
            return validateBasic(request);
        }
    }

    private boolean validateBasic(TicketPurchaseRequest request) {
        if (request.getTripId() == null || request.getTripId().trim().isEmpty()) {
            log.error("Trip ID is required");
            return false;
        }
        
        if (request.getFromStopId() == null || request.getFromStopId().trim().isEmpty()) {
            log.error("From stop ID is required");
            return false;
        }
        
        if (request.getToStopId() == null || request.getToStopId().trim().isEmpty()) {
            log.error("To stop ID is required");
            return false;
        }
        
        if (request.getFromStopId().equals(request.getToStopId())) {
            log.error("From and to stops cannot be the same");
            return false;
        }
        
        if (request.getTravelDate() == null) {
            log.error("Travel date is required");
            return false;
        }
        
        if (request.getTravelDate().isBefore(java.time.LocalDate.now())) {
            log.error("Travel date cannot be in the past");
            return false;
        }
        
        log.info("Basic validation passed for trip: {}", request.getTripId());
        return true;
    }
}
