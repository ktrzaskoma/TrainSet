package io.github.ktrzaskoma.infrastructure.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "${feign.user.name}", url = "${feign.user.url}")
public interface UserClient {

    @GetMapping("/users/{userId}")
    UserDto getUserById(@PathVariable Long userId);

    @GetMapping("/users")
    List<UserDto> getAllUsers();

    @GetMapping("/tickets/user/{userId}")
    List<TicketDto> getUserTickets(@PathVariable Long userId);

    @GetMapping("/tickets/trip/{tripId}")
    List<TicketDto> getTicketsByTrip(@PathVariable String tripId);

    class UserDto {
        public Long id;
        public String email;
        public String firstName;
        public String lastName;
        public String status;
    }

    class TicketDto {
        public Long id;
        public String ticketNumber;
        public Long userId;
        public String userEmail;
        public String tripId;
        public String fromStopId;
        public String toStopId;
        public String travelDate;
        public String status;
    }
}
