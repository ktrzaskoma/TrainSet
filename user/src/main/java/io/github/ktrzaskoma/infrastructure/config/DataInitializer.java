package io.github.ktrzaskoma.infrastructure.config;

import io.github.ktrzaskoma.user.model.User;
import io.github.ktrzaskoma.user.repository.UserRepository;
import io.github.ktrzaskoma.user.model.UserRole;
import io.github.ktrzaskoma.user.model.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class
DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        String adminEmail = "noreply.trainset@gmail.com";
        
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists");
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .firstName("Admin")
                .lastName("Administrator")
                .password(passwordEncoder.encode("admin"))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(admin);
        log.info("Admin user created successfully with credentials - email: noreply.trainset@gmail.com, password: trainset_admin");
    }
}
