package io.github.ktrzaskoma.notification.model;

public enum NotificationSubject {
    TICKET_PURCHASED("Potwierdzenie zakupu biletu"),
    DELAY_CREATED("Informacja o opóźnieniu pociągu"),
    DELAY_UPDATED("Aktualizacja opóźnienia pociągu"),
    DELAY_RESOLVED("Opóźnienie pociągu zostało rozwiązane"),
    TRIP_CANCELLED("Odwołanie pociągu"),
    TRIP_CANCELLATION_UPDATED("Aktualizacja odwołania pociągu"),
    TRIP_REINSTATED("Przywrócenie pociągu do rozkładu"),
    ROUTE_CHANGED("Zmiana trasy"),
    TICKET_CANCELLED("Anulowanie biletu"),
    TICKET_REMINDER("Przypomnienie o bilecie"),
    USER_REGISTERED("Pomyślna rejestracja"),
    EMAIL_CHANGED("Zmiana adresu email"),
    ACCOUNT_DELETED("Usunięcie konta"),
    GENERAL_INFO("Informacja dotycząca Twojej podróży");

    private final String subject;

    NotificationSubject(String subject) {
        this.subject = subject;
    }

    public String getSubject() {
        return subject;
    }

    @Override
    public String toString() {
        return subject;
    }
}

