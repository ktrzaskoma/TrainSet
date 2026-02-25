package io.github.ktrzaskoma.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String postalCode;
    private String country;
    private String preferredLanguage;
    private Boolean newsletterSubscription;
    private Boolean smsNotifications;
    private Boolean emailNotifications;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

