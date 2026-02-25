package io.github.ktrzaskoma.notification.service;

import io.github.ktrzaskoma.infrastructure.feign.NotificationClient;
import io.github.ktrzaskoma.notification.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationClient notificationClient;

    public void sendRegistrationNotification(Long userId, String userEmail) {
        String content = 
            "Witaj!\n\n" +
            "Twoje konto zostało pomyślnie utworzone w systemie Trainset.\n\n" +
            "Teraz możesz:\n" +
            "- Przeglądać rozkłady jazdy pociągów\n" +
            "- Kupować bilety online\n" +
            "- Otrzymywać powiadomienia o opóźnieniach i zmianach w rozkładzie jazdy\n\n" +
            "Dziękujemy za rejestrację!\n" +
            "Trainset";

        NotificationMessage notification = NotificationMessage.builder()
                .userId(userId)
                .email(userEmail)
                .type("USER_REGISTERED")
                .subject(null)
                .content(content)
                .build();

        try {
            notificationClient.sendNotification(notification);
            log.info("Registration notification sent to user: {} ({})", userId, userEmail);
        } catch (Exception e) {
            log.error("Failed to send registration notification to user: {} ({})", userId, userEmail, e);
        }
    }

    public void sendEmailChangeNotification(Long userId, String newEmail) {
        String content = 
            "Witaj!\n\n" +
            "Potwierdzamy zmianę adresu email w Twoim koncie Trainset.\n\n" +
            "Pozdrawiamy,\n" +
            "Trainset";

        NotificationMessage notification = NotificationMessage.builder()
                .userId(userId)
                .email(newEmail)
                .type("EMAIL_CHANGED")
                .subject(null)
                .content(content)
                .build();

        try {
            notificationClient.sendNotification(notification);
            log.info("Email change notification sent to new email: {} for user: {}", newEmail, userId);
        } catch (Exception e) {
            log.error("Failed to send email change notification to new email: {} for user: {}", newEmail, userId, e);
        }
    }

    public void sendAccountDeletionNotification(Long userId, String userEmail) {
        String content = 
            "Witaj!\n\n" +
            "Informujemy, że Twoje konto w systemie Trainset zostało usunięte.\n\n" +
            "Twoje bilety oraz historia zakupów zostały usunięte z naszej bazy danych.\n\n" +
            "Dziękujemy za korzystanie z naszych usług.\n\n" +
            "Pozdrawiamy,\n" +
            "Trainset";

        NotificationMessage notification = NotificationMessage.builder()
                .userId(userId)
                .email(userEmail)
                .type("ACCOUNT_DELETED")
                .subject(null)
                .content(content)
                .build();

        try {
            notificationClient.sendNotification(notification);
            log.info("Account deletion notification sent to user: {} ({})", userId, userEmail);
        } catch (Exception e) {
            log.error("Failed to send account deletion notification to user: {} ({})", userId, userEmail, e);
        }
    }
}

