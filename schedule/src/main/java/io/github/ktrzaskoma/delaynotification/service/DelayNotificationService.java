package io.github.ktrzaskoma.delaynotification.service;

import io.github.ktrzaskoma.delay.model.Delay;
import io.github.ktrzaskoma.delay.service.DelayQueryService;
import io.github.ktrzaskoma.delaynotification.repository.DelayNotificationRepository;
import io.github.ktrzaskoma.delaynotification.dto.NotificationDto;
import io.github.ktrzaskoma.delaynotification.model.NotificationStatus;
import io.github.ktrzaskoma.delaynotification.model.DelayNotification;
import io.github.ktrzaskoma.infrastructure.feign.NotificationClient;
import io.github.ktrzaskoma.infrastructure.feign.TicketingClient;
import io.github.ktrzaskoma.gtfs.repository.StopRepository;
import io.github.ktrzaskoma.gtfs.model.Stop;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DelayNotificationService {

    private final DelayNotificationRepository delayNotificationRepository;
    private final NotificationClient notificationClient;
    private final DelayQueryService delayQueryService;
    private final TicketingClient ticketingClient;
    private final StopRepository stopRepository;

    public void sendDelayNotifications(Delay delay) {
        try {
            log.info("========== DELAY NOTIFICATION: Starting notifications ==========");
            log.info("Delay ID: {}", delay.getId());
            log.info("Trip ID: {}", delay.getTripId());
            log.info("Stop ID: {}", delay.getStopId());
            log.info("Delay Minutes: {}", delay.getDelayMinutes());
            log.info("Reason: {}", delay.getReason());
            
            log.info("Fetching tickets for trip: {}", delay.getTripId());
            List<TicketingClient.TicketDto> tickets = ticketingClient.getTicketsByTrip(delay.getTripId());
            
            log.info("Found {} tickets for trip {} - preparing to send delay notifications", tickets.size(), delay.getTripId());

            for (TicketingClient.TicketDto ticket : tickets) {
                if ("ACTIVE".equals(ticket.status) && 
                    ticket.userId != null && 
                    ticket.userEmail != null && 
                    !ticket.userEmail.trim().isEmpty()) {
                    
                    DelayNotification notification = DelayNotification.builder()
                            .delay(delay)
                            .userId(ticket.userId)
                            .status(NotificationStatus.PENDING)
                            .message(createDelayMessage(delay))
                            .createdAt(java.time.LocalDateTime.now())
                            .build();

                    delayNotificationRepository.save(notification);

                    log.info("Sending delay notification to user {} ({})", ticket.userId, ticket.userEmail);
                    sendNotification(notification, createDelayMessage(delay), ticket.userEmail, "DELAY_CREATED");
                } else {
                    log.warn("Skipping ticket {} - missing required data: userId={}, userEmail={}, status={}", 
                            ticket.ticketNumber, ticket.userId, ticket.userEmail, ticket.status);
                }
            }

        } catch (Exception e) {
            log.error("Error sending delay notifications for delay {}: {}", delay.getId(), e.getMessage());
        }
    }

    public void sendDelayUpdateNotifications(Delay delay) {
        try {
            log.info("Starting delay update notifications for delay ID: {}, trip: {}", delay.getId(), delay.getTripId());
            
            List<TicketingClient.TicketDto> tickets = ticketingClient.getTicketsByTrip(delay.getTripId());
            
            log.info("Found {} tickets for trip {} - sending delay update notifications", tickets.size(), delay.getTripId());

            for (TicketingClient.TicketDto ticket : tickets) {
                if ("ACTIVE".equals(ticket.status) && 
                    ticket.userId != null && 
                    ticket.userEmail != null && 
                    !ticket.userEmail.trim().isEmpty()) {
                    
                    DelayNotification notification = DelayNotification.builder()
                            .delay(delay)
                            .userId(ticket.userId)
                            .status(NotificationStatus.PENDING)
                            .message(createDelayUpdateMessage(delay))
                            .createdAt(java.time.LocalDateTime.now())
                            .build();

                    delayNotificationRepository.save(notification);

                    log.info("Sending delay update notification to user {} ({})", ticket.userId, ticket.userEmail);
                    sendNotification(notification, createDelayUpdateMessage(delay), ticket.userEmail, "DELAY_UPDATED");
                } else {
                    log.warn("Skipping ticket {} - missing required data: userId={}, userEmail={}, status={}", 
                            ticket.ticketNumber, ticket.userId, ticket.userEmail, ticket.status);
                }
            }

        } catch (Exception e) {
            log.error("Error sending delay update notifications for delay {}: {}", delay.getId(), e.getMessage());
        }
    }

    public void sendDelayResolvedNotifications(Delay delay) {
        try {
            log.info("Starting delay resolved notifications for delay ID: {}, trip: {}", delay.getId(), delay.getTripId());
            
            List<TicketingClient.TicketDto> tickets = ticketingClient.getTicketsByTrip(delay.getTripId());
            
            log.info("Found {} tickets for trip {} - sending delay resolved notifications", tickets.size(), delay.getTripId());

            for (TicketingClient.TicketDto ticket : tickets) {
                if ("ACTIVE".equals(ticket.status) && 
                    ticket.userId != null && 
                    ticket.userEmail != null && 
                    !ticket.userEmail.trim().isEmpty()) {
                    
                    DelayNotification notification = DelayNotification.builder()
                            .delay(delay)
                            .userId(ticket.userId)
                            .status(NotificationStatus.PENDING)
                            .message(createDelayResolvedMessage(delay))
                            .createdAt(java.time.LocalDateTime.now())
                            .build();

                    delayNotificationRepository.save(notification);

                    log.info("Sending delay resolved notification to user {} ({})", ticket.userId, ticket.userEmail);
                    sendNotification(notification, createDelayResolvedMessage(delay), ticket.userEmail, "DELAY_RESOLVED");
                } else {
                    log.warn("Skipping ticket {} - missing required data: userId={}, userEmail={}, status={}", 
                            ticket.ticketNumber, ticket.userId, ticket.userEmail, ticket.status);
                }
            }

        } catch (Exception e) {
            log.error("Error sending delay resolved notifications for delay {}: {}", delay.getId(), e.getMessage());
        }
    }

    private void sendNotification(DelayNotification notification, String message, String email, String notificationType) {
        try {
            log.info("Calling notification service for user {} ({})", notification.getUserId(), email);
            
            notificationClient.createNotification(
                    NotificationDto.builder()
                            .userId(notification.getUserId())
                            .email(email)
                            .type(notificationType)
                            .subject(getSubjectForType(notificationType))
                            .content(message)
                            .build()
            );

            log.info("Notification service call successful for user {}", notification.getUserId());
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(java.time.LocalDateTime.now());
            delayNotificationRepository.save(notification);

        } catch (Exception e) {
            log.error("Failed to send notification to user {}: {}", notification.getUserId(), e.getMessage(), e);
            notification.setStatus(NotificationStatus.FAILED);
            delayNotificationRepository.save(notification);
        }
    }

    private String getSubjectForType(String type) {
        switch (type) {
            case "DELAY_CREATED":
                return "Informacja o opóźnieniu pociągu";
            case "DELAY_UPDATED":
                return "Aktualizacja opóźnienia pociągu";
            case "DELAY_RESOLVED":
                return "Opóźnienie pociągu zostało rozwiązane";
            default:
                return "Informacja dotycząca Twojej podróży";
        }
    }

    private String createDelayMessage(Delay delay) {
        String stopName = getStopName(delay.getStopId());
        return String.format(
                "Szanowny Pasażerze,\n\n" +
                "Informujemy o opóźnieniu pociągu na Twojej trasie:\n\n" +
                "Przystanek: %s\n" +
                "Opóźnienie: %d minut\n" +
                "Planowany odjazd: %s\n" +
                "Rzeczywisty odjazd: %s\n" +
                "Przyczyna: %s\n\n" +
                "Przepraszamy za niedogodności.\n\n" +
                "Trainset",
                stopName,
                delay.getDelayMinutes(),
                delay.getOriginalDepartureTime(),
                delay.getActualDepartureTime(),
                delay.getReason() != null ? delay.getReason() : "Nie podano"
        );
    }

    private String createDelayUpdateMessage(Delay delay) {
        String stopName = getStopName(delay.getStopId());
        return String.format(
                "Szanowny Pasażerze,\n\n" +
                "Aktualizujemy informację o opóźnieniu pociągu na Twojej trasie:\n\n" +
                "Przystanek: %s\n" +
                "Nowe opóźnienie: %d minut\n" +
                "Rzeczywisty odjazd: %s\n" +
                "Przyczyna: %s\n\n" +
                "Przepraszamy za niedogodności.\n\n" +
                "Trainset",
                stopName,
                delay.getDelayMinutes(),
                delay.getActualDepartureTime(),
                delay.getReason() != null ? delay.getReason() : "Nie podano"
        );
    }

    private String createDelayResolvedMessage(Delay delay) {
        String stopName = getStopName(delay.getStopId());
        return String.format(
                "Szanowny Pasażerze,\n\n" +
                "Z przyjemnością informujemy, że opóźnienie pociągu zostało rozwiązane:\n\n" +
                "Przystanek: %s\n\n" +
                "Pociąg wrócił do normalnego rozkładu jazdy.\n\n" +
                "Życzymy przyjemnej podróży!\n\n" +
                "Trainset",
                stopName
        );
    }

    private String getStopName(String stopId) {
        try {
            Stop stop = stopRepository.findByStopId(stopId);
            if (stop != null && stop.getStopName() != null) {
                return stop.getStopName();
            }
        } catch (Exception e) {
            log.warn("Could not fetch stop name for stopId: {}", stopId, e);
        }
        return stopId;
    }
}
