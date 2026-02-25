package io.github.ktrzaskoma.user.service;

import io.github.ktrzaskoma.authentication.dto.UpdateUserRequest;
import io.github.ktrzaskoma.infrastructure.feign.TicketingClient;
import io.github.ktrzaskoma.notification.service.NotificationService;
import io.github.ktrzaskoma.user.dto.UserDto;
import io.github.ktrzaskoma.user.dto.UserProfileDto;
import io.github.ktrzaskoma.user.model.User;
import io.github.ktrzaskoma.user.model.UserProfile;
import io.github.ktrzaskoma.user.model.UserStatus;
import io.github.ktrzaskoma.user.repository.UserProfileRepository;
import io.github.ktrzaskoma.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TicketingClient ticketingClient;
    private final NotificationService notificationService;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserDtoById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
        return mapToUserDto(user);
    }

    public void updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
        user.setStatus(status);
        userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
        
        // Store user email before deletion for notification
        String userEmail = user.getEmail();
        
        // Send account deletion notification before deleting the user
        try {
            notificationService.sendAccountDeletionNotification(userId, userEmail);
            log.info("Account deletion notification sent to user: {} ({})", userId, userEmail);
        } catch (Exception e) {
            log.error("Failed to send account deletion notification for user: {}", userEmail, e);
            // Don't fail the deletion if notification fails
        }
        
        try {
            log.info("Deleting all tickets for user ID: {}", userId);
            ticketingClient.deleteUserTickets(userId);
            log.info("Successfully deleted tickets for user ID: {}", userId);
        } catch (Exception e) {
            log.error("Failed to delete tickets for user ID: {}. Error: {}", userId, e.getMessage());
        }
        
        log.info("Deleting user ID: {}", userId);
        userRepository.delete(user);
        log.info("Successfully deleted user ID: {}", userId);
    }

    public boolean userExists(Long userId) {
        return userRepository.existsById(userId);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
    }

    public UserDto updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));

        boolean emailChanged = false;

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Użytkownik o podanym adresie email już istnieje");
            }
            
            String newEmail = request.getEmail();
            emailChanged = true;
            user.setEmail(newEmail);
            
            try {
                log.info("Updating email in tickets for user ID: {} to new email: {}", userId, newEmail);
                ticketingClient.updateUserEmail(userId, java.util.Map.of("email", newEmail));
                log.info("Successfully updated email in tickets for user ID: {}", userId);
            } catch (Exception e) {
                log.error("Failed to update email in tickets for user ID: {}. Error: {}", userId, e.getMessage());
            }
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());

        User savedUser = userRepository.save(user);

        // Send email change notification if email was changed
        if (emailChanged) {
            try {
                notificationService.sendEmailChangeNotification(
                    savedUser.getId(),
                    savedUser.getEmail()
                );
            } catch (Exception e) {
                log.error("Failed to send email change notification for user: {}", savedUser.getEmail(), e);
            }
        }

        return mapToUserDto(savedUser);
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }


    private UserDto mapToUserDto(User user) {
        UserProfile profile = userProfileRepository.findByUser(user).orElse(null);
        
        UserDto.UserDtoBuilder builder = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        if (profile != null) {
            builder.profile(UserProfileDto.builder()
                    .id(profile.getId())
                    .dateOfBirth(profile.getDateOfBirth())
                    .address(profile.getAddress())
                    .city(profile.getCity())
                    .postalCode(profile.getPostalCode())
                    .country(profile.getCountry())
                    .preferredLanguage(profile.getPreferredLanguage())
                    .newsletterSubscription(profile.getNewsletterSubscription())
                    .smsNotifications(profile.getSmsNotifications())
                    .emailNotifications(profile.getEmailNotifications())
                    .createdAt(profile.getCreatedAt())
                    .updatedAt(profile.getUpdatedAt())
                    .build());
        }

        return builder.build();
    }
}
