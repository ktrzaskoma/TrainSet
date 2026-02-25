package io.github.ktrzaskoma.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private Long userId;
    private String email;
    private String type;
    private String subject;
    private String content;
}
