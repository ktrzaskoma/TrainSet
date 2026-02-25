package io.github.ktrzaskoma.notification.model;

public enum NotificationType {
    DELAY_CREATED("Delay created", "Delay created"),
    DELAY_UPDATED("Delay updated", "Delay updated"),
    DELAY_CANCELLED("Delay cancelled", "Delay cancelled"),
    DELAY_RESOLVED("Delay resolved", "Delay resolved"),
    TRIP_CANCELLED("Trip cancelled", "Trip cancelled"),
    ROUTE_CHANGED("Route changed", "Route changed"),
    TICKET_PURCHASED("Ticket purchased", "Ticket purchased"),
    TICKET_CANCELLED("Ticket cancelled", "Ticket cancelled"),
    TICKET_REMINDER("Ticket reminder", "Ticket reminder"),
    USER_REGISTERED("User registered", "User registered"),
    EMAIL_CHANGED("Email changed", "Email changed"),
    ACCOUNT_DELETED("Account deleted", "Account deleted"),
    GENERAL_INFO("General information", "General information");

    private final String descriptionPl;
    private final String descriptionEn;

    NotificationType(String descriptionPl, String descriptionEn) {
        this.descriptionPl = descriptionPl;
        this.descriptionEn = descriptionEn;
    }

    public String getDescription(String language) {
        return "pl".equalsIgnoreCase(language) ? descriptionPl : descriptionEn;
    }

    public String getDescriptionPl() {
        return descriptionPl;
    }

    public String getDescriptionEn() {
        return descriptionEn;
    }
}
