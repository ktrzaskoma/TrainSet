package io.github.ktrzaskoma.authentication.service;

import io.github.ktrzaskoma.authentication.dto.CreateUserRequest;
import io.github.ktrzaskoma.authentication.dto.LoginRequest;
import io.github.ktrzaskoma.authentication.dto.LoginResponse;
import io.github.ktrzaskoma.notification.service.NotificationService;
import io.github.ktrzaskoma.user.model.User;
import io.github.ktrzaskoma.user.repository.UserRepository;
import io.github.ktrzaskoma.user.model.UserRole;
import io.github.ktrzaskoma.user.model.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;

    @Transactional
    public LoginResponse register(CreateUserRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Użytkownik o podanym adresie email już istnieje");
        }

        User user = User.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getEmail());

        try {
            notificationService.sendRegistrationNotification(
                savedUser.getId(), 
                savedUser.getEmail()
            );
        } catch (Exception e) {
            log.error("Failed to send registration notification for user: {}", savedUser.getEmail(), e);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, 
                    SecurityContextHolder.getContext());

            log.info("User auto-logged in after registration: {}", savedUser.getEmail());
            
            return LoginResponse.builder()
                    .userId(savedUser.getId())
                    .email(savedUser.getEmail())
                    .firstName(savedUser.getFirstName())
                    .lastName(savedUser.getLastName())
                    .role(savedUser.getRole())
                    .message("Rejestracja i logowanie zakończone pomyślnie")
                    .build();

        } catch (Exception e) {
            log.error("Auto-login failed after registration for user: {}", savedUser.getEmail(), e);
            throw new IllegalArgumentException("Rejestracja pomyślna, ale automatyczne logowanie nie powiodło się");
        }
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        if (!userRepository.existsByEmail(request.getEmail())) {
            log.error("Login failed - user not found: {}", request.getEmail());
            throw new IllegalArgumentException("Nie znaleziono użytkownika o podanym adresie email");
        }
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, 
                    SecurityContextHolder.getContext());

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

            log.info("User logged in successfully: {}", user.getEmail());
            return LoginResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole())
                    .message("Logowanie zakończone pomyślnie")
                    .build();

        } catch (BadCredentialsException e) {
            log.error("Login failed - invalid password for user: {}", request.getEmail());
            throw new IllegalArgumentException("Nieprawidłowe hasło");
        }
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        log.info("User logged out");
    }

}

