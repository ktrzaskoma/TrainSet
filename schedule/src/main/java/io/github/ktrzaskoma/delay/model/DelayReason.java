package io.github.ktrzaskoma.delay.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum DelayReason {
    TECHNICAL("1", "Awaria techniczna"),
    INFRASTRUCTURE("2", "Problemy infrastrukturalne"),
    WEATHER("3", "Warunki pogodowe"),
    TRAFFIC("4", "Problemy z ruchem kolejowym"),
    OTHER("5", "Inne przyczyny");

    private final String code;
    private final String description;

    DelayReason(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public static DelayReason fromCode(String code) {
        for (DelayReason reason : values()) {
            if (reason.getCode().equals(code)) {
                return reason;
            }
        }
        throw new IllegalArgumentException("Unknown delay reason code: " + code);
    }
}
