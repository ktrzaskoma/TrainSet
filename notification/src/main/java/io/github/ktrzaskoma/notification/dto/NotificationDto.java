package io.github.ktrzaskoma.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String type;
    private String recipientEmail;
    private String subject;
    private String content;
    private String status;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}
