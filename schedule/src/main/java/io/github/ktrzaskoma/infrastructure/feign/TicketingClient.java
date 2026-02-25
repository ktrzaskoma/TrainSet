package io.github.ktrzaskoma.infrastructure.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "${feign.ticketing.name}", url = "${feign.ticketing.url}")
public interface TicketingClient {

    @GetMapping("/ticket/trip/{tripId}")
    List<TicketDto> getTicketsByTrip(@PathVariable String tripId);

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

