package io.github.ktrzaskoma.infrastructure.feign;

import io.github.ktrzaskoma.notification.dto.NotificationMessage;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "${feign.notification.name}", url = "${feign.notification.url}")
public interface NotificationClient {

    @PostMapping("/notifications")
    void sendNotification(@RequestBody NotificationMessage message);
}
