package io.github.ktrzaskoma.cancellation.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@Getter
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum CancellationReason {
    TECHNICAL("1", "Awaria techniczna"),
    INFRASTRUCTURE("2", "Problemy infrastrukturalne"),
    WEATHER("3", "Warunki pogodowe"),
    TRAFFIC("4", "Problemy z ruchem kolejowym"),
    OTHER("5", "Inne przyczyny");

    private final String code;
    private final String description;

    CancellationReason(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public static CancellationReason fromCode(String code) {
        for (CancellationReason reason : values()) {
            if (reason.getCode().equals(code)) {
                return reason;
            }
        }
        throw new IllegalArgumentException("Unknown cancellation reason code: " + code);
    }
}
