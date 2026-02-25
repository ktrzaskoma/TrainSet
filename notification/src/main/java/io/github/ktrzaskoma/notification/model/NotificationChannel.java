package io.github.ktrzaskoma.notification.model;

public enum NotificationChannel {
    EMAIL("Email"),
    SMS("SMS"),
    PUSH("Push Notification"),
    IN_APP("In-App"),
    WEBHOOK("Webhook");

    private final String description;

    NotificationChannel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
