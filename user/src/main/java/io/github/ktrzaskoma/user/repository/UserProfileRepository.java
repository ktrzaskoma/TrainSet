package io.github.ktrzaskoma.user.repository;

import io.github.ktrzaskoma.user.model.User;
import io.github.ktrzaskoma.user.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUser(User user);

    Optional<UserProfile> findByUserId(Long userId);

    void deleteByUser(User user);
}

