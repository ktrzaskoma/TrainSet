package io.github.ktrzaskoma.infrastructure.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "${feign.ticketing.name}", url = "${feign.ticketing.url}")
public interface TicketingClient {

    @GetMapping("/ticket/trip/{tripId}/users")
    List<Map<String, Object>> getUsersWithTicketsForTrip(@RequestParam("tripId") String tripId);
}

