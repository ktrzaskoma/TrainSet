package io.github.ktrzaskoma.infrastructure.feign;

import io.github.ktrzaskoma.notification.dto.NotificationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "${feign.notification.name}", url = "${feign.notification.url}")
public interface NotificationClient {

    Logger LOGGER = LoggerFactory.getLogger(NotificationClient.class);

    @PostMapping("/notifications")
    void createNotification(@RequestBody NotificationMessage message);

    default void sendTicketPurchaseNotification(Long userId, String email, String ticketNumber, 
                                                String fromStop, String toStop, String travelDate,
                                                String departureTime, String arrivalTime, String price, String type) {
        try {
            LOGGER.info("Attempting to send ticket purchase notification for ticket: {}", ticketNumber);
            
            String ticketTypeText = "DISCOUNT".equals(type) ? "Ulgowy" : "Normalny";

            String formattedDate = travelDate;
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(travelDate);
                formattedDate = String.format("%02d.%02d.%d", 
                    date.getDayOfMonth(), 
                    date.getMonthValue(), 
                    date.getYear());
            } catch (Exception e) {
                LOGGER.warn("Could not format date: {}", travelDate);
            }
            
            // Calculate time zone based on travel duration
            String timeZone = "N/A";
            try {
                java.time.LocalTime departure = java.time.LocalTime.parse(departureTime);
                java.time.LocalTime arrival = java.time.LocalTime.parse(arrivalTime);
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
                LOGGER.warn("Could not calculate time zone for ticket {}: {}", ticketNumber, e.getMessage());
            }
            
            String content = String.format(
                "Szanowny Pasażerze,\n\n" +
                "Dziękujemy za zakup biletu w systemie Trainset!\n\n" +
                "Szczegóły biletu:\n" +
                "Numer biletu: %s\n" +
                "Od: %s\n" +
                "Do: %s\n" +
                "Data podróży: %s\n" +
                "Odjazd: %s\n" +
                "Przyjazd: %s\n" +
                "Rodzaj biletu: %s\n" +
                "Strefa czasowa: %s\n\n" +
                "Życzymy przyjemnej podróży!\n\n" +
                "Trainset",
                ticketNumber, fromStop, toStop, formattedDate, 
                departureTime, arrivalTime, ticketTypeText, timeZone
            );
            
            NotificationMessage request = NotificationMessage.builder()
                    .userId(userId)
                    .email(email)
                    .type("TICKET_PURCHASED")
                    .subject("Potwierdzenie zakupu biletu")
                    .content(content)
                    .build();

            LOGGER.debug("Calling notification service for userId={}, type={}", userId, "TICKET_PURCHASED");
            createNotification(request);
            LOGGER.info("Ticket purchase notification sent successfully for ticket: {}", ticketNumber);

        } catch (Exception e) {
            LOGGER.error("Failed to send ticket purchase notification for ticket {}: {}", ticketNumber, e.getMessage(), e);
        }
    }
}