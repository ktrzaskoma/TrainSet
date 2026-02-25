package io.github.ktrzaskoma.notification.service;

import io.github.ktrzaskoma.notification.dto.NotificationMessage;
import io.github.ktrzaskoma.notification.model.Notification;
import io.github.ktrzaskoma.notification.model.NotificationStatus;
import io.github.ktrzaskoma.notification.model.NotificationSubject;
import io.github.ktrzaskoma.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import org.springframework.mail.SimpleMailMessage;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    @Value("${notification.email.from:trainset}")
    private String fromEmail;

    public void handleNotification(NotificationMessage message) {
        log.info("========== NOTIFICATION SERVICE: Received notification request ==========");
        log.info("Notification Type: {}", message.getType());
        log.info("User ID: {}", message.getUserId());


        String redactedSubject = message.getSubject() != null && !message.getSubject().isBlank() 
                ? message.getSubject() 
                : getSubjectForType(message.getType());

        Notification notification = Notification.builder()
                .userId(message.getUserId())
                .type(message.getType())
                .recipientEmail(message.getEmail())
                .subject(redactedSubject)
                .content(message.getContent())
                .status(NotificationStatus.PENDING)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Saved notification ID: {} for user: {}", notification.getId(), message.getUserId());

        log.info("Email enabled: {}", emailEnabled);
        if (emailEnabled) {
            try {
                log.info("Attempting to send email for notification ID: {}", notification.getId());
                sendEmail(message, redactedSubject);
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                log.info("Email sent successfully for notification ID: {}", notification.getId());
            } catch (Exception e) {
                log.error("Error sending email for notification ID: {}", notification.getId(), e);
                notification.setStatus(NotificationStatus.FAILED);
            }
        } else {
            log.warn("Email sending is disabled. Simulating send for notification ID: {}", notification.getId());
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
        }

        notificationRepository.save(notification);
    }

    private void sendEmail(NotificationMessage message, String subject) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(message.getEmail());
        mailMessage.setSubject(subject);
        mailMessage.setText(message.getContent());
        mailMessage.setFrom(fromEmail);

        mailSender.send(mailMessage);
        log.debug("Email sent successfully");
    }

    private String getSubjectForType(String type) {
        if (type == null || type.isBlank()) {
            return NotificationSubject.GENERAL_INFO.getSubject();
        }

        try {
            return NotificationSubject.valueOf(type).getSubject();
        } catch (IllegalArgumentException e) {
            log.warn("Unknown notification type: {}, using default subject", type);
            return NotificationSubject.GENERAL_INFO.getSubject();
        }
    }

}
