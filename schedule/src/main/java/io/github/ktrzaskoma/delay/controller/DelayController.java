package io.github.ktrzaskoma.delay.controller;

import io.github.ktrzaskoma.delay.dto.CreateDelayRequest;
import io.github.ktrzaskoma.delay.dto.DelayDto;
import io.github.ktrzaskoma.delay.dto.UpdateDelayRequest;
import io.github.ktrzaskoma.delay.service.DelayService;
import io.github.ktrzaskoma.delay.service.DelayQueryService;
import io.github.ktrzaskoma.delay.model.DelayReason;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/delays")
@RequiredArgsConstructor
public class DelayController {

    private final DelayService delayService;
    private final DelayQueryService delayQueryService;

    @PostMapping
    public ResponseEntity<?> createDelay(@RequestBody CreateDelayRequest request) {
        DelayDto delay = delayService.createDelay(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(delay);
    }

    @PutMapping("/{delayId}")
    public ResponseEntity<DelayDto> updateDelay(@PathVariable Long delayId, 
                                               @RequestBody UpdateDelayRequest request) {
        try {
            DelayDto delay = delayService.updateDelay(delayId, request);
            return ResponseEntity.ok(delay);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{delayId}/resolve")
    public ResponseEntity<Void> resolveDelay(@PathVariable Long delayId) {
        try {
            delayService.resolveDelay(delayId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<DelayDto>> getActiveDelays() {
        List<DelayDto> delays = delayQueryService.getActiveDelays();
        return ResponseEntity.ok(delays);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<DelayDto>> getDelaysByTrip(@PathVariable String tripId) {
        List<DelayDto> delays = delayQueryService.getDelaysByTrip(tripId);
        return ResponseEntity.ok(delays);
    }

    @GetMapping("/stop/{stopId}")
    public ResponseEntity<List<DelayDto>> getDelaysByStop(@PathVariable String stopId) {
        List<DelayDto> delays = delayQueryService.getDelaysByStop(stopId);
        return ResponseEntity.ok(delays);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<DelayDto>> getRecentDelays(@RequestParam(defaultValue = "24") int hours) {
        List<DelayDto> delays = delayQueryService.getRecentDelays(hours);
        return ResponseEntity.ok(delays);
    }

    @GetMapping("/trip/{tripId}/latest")
    public ResponseEntity<DelayDto> getLatestDelayForTrip(@PathVariable String tripId) {
        DelayDto delay = delayQueryService.getLatestDelayForTrip(tripId);
        if (delay != null) {
            return ResponseEntity.ok(delay);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/reasons")
    public ResponseEntity<List<DelayReason>> getDelayReasons() {
        return ResponseEntity.ok(Arrays.asList(DelayReason.values()));
    }
}
