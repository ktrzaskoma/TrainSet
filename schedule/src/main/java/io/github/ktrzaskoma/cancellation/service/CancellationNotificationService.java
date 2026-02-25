package io.github.ktrzaskoma.cancellation.service;

import io.github.ktrzaskoma.cancellation.model.Cancellation;
import io.github.ktrzaskoma.delaynotification.dto.NotificationDto;
import io.github.ktrzaskoma.infrastructure.feign.NotificationClient;
import io.github.ktrzaskoma.infrastructure.feign.TicketingClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CancellationNotificationService {
    
    private final NotificationClient notificationClient;
    private final TicketingClient ticketingClient;
    
    public void sendCancellationNotifications(Cancellation cancellation) {
        try {
            log.info("========== CANCELLATION NOTIFICATION: Starting notifications ==========");
            log.info("Cancellation ID: {}", cancellation.getId());
            log.info("Trip ID: {}", cancellation.getTripId());
            log.info("Reason: {}", cancellation.getReason());

            log.info("Fetching tickets for trip: {}", cancellation.getTripId());
            List<TicketingClient.TicketDto> tickets = ticketingClient.getTicketsByTrip(cancellation.getTripId());

            log.info("Found {} tickets for trip {} - preparing to send cancellation notifications",
                    tickets.size(), cancellation.getTripId());

            for (TicketingClient.TicketDto ticket : tickets) {
                if ("ACTIVE".equals(ticket.status) && 
                    ticket.userId != null && 
                    ticket.userEmail != null && 
                    !ticket.userEmail.trim().isEmpty()) {

                    log.info("Sending cancellation notification to user {} ({})",
                            ticket.userId, ticket.userEmail);
                    sendNotification(ticket.userEmail, ticket.userId,
                            createCancellationMessage(cancellation), "TRIP_CANCELLED");
                } else {
                    log.warn("Skipping ticket {} - missing required data: userId={}, userEmail={}, status={}", 
                            ticket.ticketNumber, ticket.userId, ticket.userEmail, ticket.status);
                }
            }

        } catch (Exception e) {
            log.error("Error sending cancellation notifications for cancellation {}: {}", 
                    cancellation.getId(), e.getMessage(), e);
        }
    }
    
    public void sendCancellationUpdateNotifications(Cancellation cancellation) {
        try {
            log.info("Starting cancellation update notifications for cancellation ID: {}, trip: {}",
                    cancellation.getId(), cancellation.getTripId());

            List<TicketingClient.TicketDto> tickets = ticketingClient.getTicketsByTrip(cancellation.getTripId());

            log.info("Found {} tickets for trip {} - sending cancellation update notifications",
                    tickets.size(), cancellation.getTripId());

            for (TicketingClient.TicketDto ticket : tickets) {
                if ("ACTIVE".equals(ticket.status) && 
                    ticket.userId != null && 
                    ticket.userEmail != null && 
                    !ticket.userEmail.trim().isEmpty()) {
                    
                    log.info("Sending cancellation update notification to user {} ({})", 
                            ticket.userId, ticket.userEmail);
                    sendNotification(ticket.userEmail, ticket.userId, 
                            createCancellationUpdateMessage(cancellation), "TRIP_CANCELLATION_UPDATED");
                }
            }

        } catch (Exception e) {
            log.error("Error sending cancellation update notifications for cancellation {}: {}", 
                    cancellation.getId(), e.getMessage(), e);
        }
    }
    
    public void sendReinstateNotifications(Cancellation cancellation) {
        try {
            log.info("Starting reinstate notifications for cancellation ID: {}, trip: {}", 
                    cancellation.getId(), cancellation.getTripId());
            
            List<TicketingClient.TicketDto> tickets = ticketingClient.getTicketsByTrip(cancellation.getTripId());
            
            log.info("Found {} tickets for trip {} - sending reinstate notifications", 
                    tickets.size(), cancellation.getTripId());

            for (TicketingClient.TicketDto ticket : tickets) {
                if ("ACTIVE".equals(ticket.status) && 
                    ticket.userId != null && 
                    ticket.userEmail != null && 
                    !ticket.userEmail.trim().isEmpty()) {
                    
                    log.info("Sending reinstate notification to user {} ({})", 
                            ticket.userId, ticket.userEmail);
                    sendNotification(ticket.userEmail, ticket.userId, 
                            createReinstateMessage(cancellation), "TRIP_REINSTATED");
                }
            }

        } catch (Exception e) {
            log.error("Error sending reinstate notifications for cancellation {}: {}", 
                    cancellation.getId(), e.getMessage(), e);
        }
    }
    
    private void sendNotification(String email, Long userId, String message, String notificationType) {
        try {
            log.info("Calling notification service for user {} ({})", userId, email);
            
            notificationClient.createNotification(
                    NotificationDto.builder()
                            .userId(userId)
                            .email(email)
                            .type(notificationType)
                            .subject(getSubjectForType(notificationType))
                            .content(message)
                            .build()
            );

            log.info("Notification service call successful for user {}", userId);

        } catch (Exception e) {
            log.error("Failed to send notification to user {}: {}", userId, e.getMessage(), e);
        }
    }
    
    private String getSubjectForType(String type) {
        return switch (type) {
            case "TRIP_CANCELLED" -> "Odwołanie pociągu";
            case "TRIP_CANCELLATION_UPDATED" -> "Aktualizacja odwołania pociągu";
            case "TRIP_REINSTATED" -> "Przywrócenie pociągu do rozkładu";
            default -> "Informacja dotycząca Twojej podróży";
        };
    }
    
    private String createCancellationMessage(Cancellation cancellation) {
        return String.format(
                "Szanowny Pasażerze,\n\n" +
                "Informujemy z przykrością, że pociąg na Twojej trasie został odwołany.\n\n" +
                "Powód: %s\n\n" +
                "Twój bilet zostanie automatycznie zwrócony.\n" +
                "Przepraszamy za niedogodności.\n\n" +
                "Trainset",
                cancellation.getReason() != null ? cancellation.getReason() : "Nie podano"
        );
    }
    
    private String createCancellationUpdateMessage(Cancellation cancellation) {
        return String.format(
                "Szanowny Pasażerze,\n\n" +
                "Aktualizujemy informację o odwołaniu pociągu na Twojej trasie:\n\n" +
                "Zaktualizowany powód: %s\n\n" +
                "Przepraszamy za niedogodności.\n\n" +
                "Trainset",
                cancellation.getReason() != null ? cancellation.getReason() : "Nie podano"
        );
    }
    
    private String createReinstateMessage(Cancellation cancellation) {
        return String.format(
                "Szanowny Pasażerze,\n\n" +
                "Z przyjemnością informujemy, że pociąg na Twojej trasie został przywrócony do rozkładu.\n\n" +
                "Twój bilet jest ponownie ważny.\n" +
                "Życzymy przyjemnej podróży!\n\n" +
                "Trainset"
        );
    }
}


