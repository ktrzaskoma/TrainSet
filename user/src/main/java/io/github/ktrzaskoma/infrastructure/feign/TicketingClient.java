package io.github.ktrzaskoma.infrastructure.feign;

import io.github.ktrzaskoma.ticket.dto.TicketPurchaseRequest;
import io.github.ktrzaskoma.ticket.dto.TicketResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "${feign.ticketing.name}", url = "${feign.ticketing.url}")
public interface TicketingClient {

    @PostMapping("/ticket/purchase")
    TicketResponse purchaseTicket(@RequestBody TicketPurchaseRequest request);

    @GetMapping("/ticket/user/{userId}")
    List<TicketResponse> getUserTickets(@PathVariable Long userId);

    @GetMapping("/ticket/{ticketNumber}")
    TicketResponse getTicketById(@PathVariable String ticketNumber);

    @GetMapping("/ticket/trip/{tripId}")
    List<TicketResponse> getTicketsByTrip(@PathVariable String tripId);

    @DeleteMapping("/ticket/user/{userId}")
    void deleteUserTickets(@PathVariable Long userId);

    @PutMapping("/ticket/user/{userId}/email")
    void updateUserEmail(@PathVariable Long userId, @RequestBody Map<String, String> request);
}
