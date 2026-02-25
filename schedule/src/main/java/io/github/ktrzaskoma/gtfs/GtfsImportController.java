package io.github.ktrzaskoma.gtfs;

import io.github.ktrzaskoma.gtfs.dto.ImportInfoDto;
import io.github.ktrzaskoma.infrastructure.dto.MessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/gtfs")
public class GtfsImportController {

    private final GtfsImportService gtfsImportService;

    @PostMapping("/upload")
    public ResponseEntity<MessageResponse> importGtfs(@RequestParam("file") MultipartFile file) {
        log.info("Received GTFS file upload request: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            log.info("File is empty");
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Plik nie może być pusty"));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".zip")) {
            log.info("Invalid file extension: {}", filename);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Zip file required"));
        }

        log.info("File size: {} bytes", file.getSize());

        try {
            
            Long defaultUserId = 1L;
            gtfsImportService.importGtfsData(file, defaultUserId);

            log.info("GTFS import completed successfully");
            return ResponseEntity.ok(new MessageResponse("Dane GTFS zostały pomyślnie zaimportowane"));

        } catch (IllegalArgumentException e) {
            log.info("GTFS validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));

        } catch (Exception e) {
            log.info("Error during GTFS import", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/upload/endpoint")
    public ResponseEntity<MessageResponse> testEndpoint() {
        return ResponseEntity.ok(new MessageResponse("Endpoint GTFS działa poprawnie"));
    }

    @GetMapping("/upload/active")
    public ResponseEntity<ImportInfoDto> getActiveUpload() {
        log.info("Received request for active GTFS upload info");
        return gtfsImportService.getActiveImport()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
