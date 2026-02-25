package io.github.ktrzaskoma.notification.controller;

import io.github.ktrzaskoma.notification.dto.NotificationDto;
import io.github.ktrzaskoma.notification.dto.NotificationMessage;
import io.github.ktrzaskoma.notification.service.NotificationQueryService;
import io.github.ktrzaskoma.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationQueryService notificationQueryService;
    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDto>> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationQueryService.getUserNotifications(userId));
    }

    @PostMapping
    public ResponseEntity<Void> createNotification(@RequestBody NotificationMessage message) {
        notificationService.handleNotification(message);
        return ResponseEntity.ok().build();
    }
}
