package io.github.ktrzaskoma.infrastructure.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@FeignClient(name = "${feign.schedule.name}", url = "${feign.schedule.url}")
public interface ScheduleClient {

    @GetMapping("/schedule/connections/validate")
    Boolean validateConnection(
            @RequestParam("tripId") String tripId,
            @RequestParam("fromStopId") String fromStopId,
            @RequestParam("toStopId") String toStopId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );

}
