package io.github.ktrzaskoma.notification.dto;

import lombok.*;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class NotificationRequest {
    private Long userId;
    private String email;
    private String type;
    private String subject;
    private String content;
    private String ticketNumber;
}


