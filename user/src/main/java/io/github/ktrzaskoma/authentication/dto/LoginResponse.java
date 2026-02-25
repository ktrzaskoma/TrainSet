package io.github.ktrzaskoma.authentication.dto;

import io.github.ktrzaskoma.user.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private String message;
}

