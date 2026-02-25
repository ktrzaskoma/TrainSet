package io.github.ktrzaskoma.gtfs;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import io.github.ktrzaskoma.gtfs.dto.ImportInfoDto;
import io.github.ktrzaskoma.gtfs.model.*;
import io.github.ktrzaskoma.gtfs.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.StringReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@Slf4j
@RequiredArgsConstructor
public class GtfsImportService {

    private final ImportRepository uploadRepository;
    private final AgencyRepository agencyRepository;
    private final StopRepository stopRepository;
    private final RouteRepository routeRepository;
    private final TripRepository tripRepository;
    private final StopTimeRepository stopTimeRepository;
    private final CalendarDateRepository calendarDateRepository;


    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int BATCH_SIZE = 1000;


    @Transactional
    public void importGtfsData(MultipartFile file, Long userId) throws Exception {
        log.info("Starting GTFS import for file: {}", file.getOriginalFilename());

        uploadRepository.findByIsActiveTrue().ifPresent(upload -> {
            upload.setIsActive(false);
            uploadRepository.save(upload);
            log.info("Deactivated previous upload: {}", upload.getId());
        });

        Import upload = Import.builder()
                .filename(file.getOriginalFilename())
                .uploadedBy(userId)
                .isActive(true)
                .build();
        upload = uploadRepository.save(upload);
        log.info("Created new upload: {}", upload.getId());

        try {
            Map<String, String> fileContents = extractZipContents(file);

            validateGtfsFiles(fileContents);
            
            importAgency(fileContents.get("agency.txt"), upload);
            importStops(fileContents.get("stops.txt"), upload);
            importRoutes(fileContents.get("routes.txt"), upload);
            importTrips(fileContents.get("trips.txt"), upload);
            importStopTimes(fileContents.get("stop_times.txt"), upload);
            importCalendarDates(fileContents.get("calendar_dates.txt"), upload);

            log.info("GTFS import completed successfully for upload: {}", upload.getId());
        } catch (Exception e) {
            log.error("Error during GTFS import", e);
            upload.setIsActive(false);
            uploadRepository.save(upload);
            throw new RuntimeException("Nie udało się zaimportować danych GTFS: " + e.getMessage(), e);
        }
    }

    private Map<String, String> extractZipContents(MultipartFile file) throws IOException {

        Map<String, String> fileContents = new HashMap<>();

        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().endsWith(".txt")) {
                    byte[] buffer = zis.readAllBytes();
                    String content = new String(buffer, StandardCharsets.UTF_8);
                    fileContents.put(entry.getName(), content);
                }
            }
        }
        return fileContents;
    }

    private void validateGtfsFiles(Map<String, String> fileContents) {
        List<String> requiredFiles = Arrays.asList(
                "agency.txt", "stops.txt",
                "routes.txt", "trips.txt",
                "stop_times.txt", "calendar_dates.txt"
                );

        List<String> missingFiles = requiredFiles.stream()
                .filter(file -> !fileContents.containsKey(file))
                .toList();

        if (!missingFiles.isEmpty()) {
            throw new IllegalArgumentException("Brakujące wymagane pliki: " + missingFiles);
        }
    }

    private void importAgency(String content, Import upload) throws Exception {
        log.info("Start import Agency!");

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(content))
                .withSkipLines(0)
                .build()) {

            String[] headers = reader.readNext();
            Map<String, Integer> headerMap = createHeaderMap(headers);

            String[] line;
            int count = 0;
            List<Agency> agencies = new ArrayList<>();

            while ((line = reader.readNext()) != null) {
                Agency agency = Agency.builder()
                        .agencyId(getFieldValue(line, headerMap, "agency_id", "default"))
                        .agencyName(getFieldValue(line, headerMap, "agency_name"))
                        .agencyUrl(getFieldValue(line, headerMap, "agency_url"))
                        .agencyLang(getFieldValue(line, headerMap, "agency_lang", "en"))
                        .agencyTimezone(getFieldValue(line, headerMap, "agency_timezone"))
                        .upload(upload)
                        .build();
                agencies.add(agency);

                if (agencies.size() >= BATCH_SIZE) {
                    agencyRepository.saveAll(agencies);
                    agencies.clear();
                }
                count++;
            }

            if (!agencies.isEmpty()) {
                agencyRepository.saveAll(agencies);
            }

            log.info("Imported {} agencies", count);
        }
    }

    private void importStops(String content, Import upload) throws Exception {
        log.info("Start import Stops!");

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(content))
                .withSkipLines(0)
                .build()) {

            String[] headers = reader.readNext();
            Map<String, Integer> headerMap = createHeaderMap(headers);

            String[] line;
            int count = 0;
            List<Stop> stops = new ArrayList<>();

            while ((line = reader.readNext()) != null) {
                try {
                    Stop stop = Stop.builder()
                            .stopId(getFieldValue(line, headerMap, "stop_id"))
                            .stopName(getFieldValue(line, headerMap, "stop_name"))
                            .stopLat(new BigDecimal(getFieldValue(line, headerMap, "stop_lat")))
                            .stopLon(new BigDecimal(getFieldValue(line, headerMap, "stop_lon")))
                            .wheelchairBoarding(parseIntegerField(getFieldValue(line, headerMap, "wheelchair_boarding", "0")))
                            .upload(upload)
                            .build();
                    stops.add(stop);

                    if (stops.size() >= BATCH_SIZE) {
                        stopRepository.saveAll(stops);
                        stops.clear();
                    }
                    count++;
                } catch (Exception e) {
                    log.warn("Error importing stop at line {}: {}", count + 2, e.getMessage());
                }
            }

            if (!stops.isEmpty()) {
                stopRepository.saveAll(stops);
            }

            log.info("Imported {} stops", count);
        }
    }

    private void importRoutes(String content, Import upload) throws Exception {
        log.info("Start import Routes!");

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(content))
                .withSkipLines(0)
                .build()) {

            String[] headers = reader.readNext();
            Map<String, Integer> headerMap = createHeaderMap(headers);

            String[] line;
            int count = 0;
            List<Route> routes = new ArrayList<>();

            while ((line = reader.readNext()) != null) {
                try {
                    String agencyId = getFieldValue(line, headerMap, "agency_id", "default");
                    Agency agency = agencyRepository.findById(agencyId).orElse(null);

                    Route route = Route.builder()
                            .routeId(getFieldValue(line, headerMap, "route_id"))
                            .agency(agency)
                            .routeShortName(getFieldValue(line, headerMap, "route_short_name", ""))
                            .routeLongName(getFieldValue(line, headerMap, "route_long_name", ""))
                            .routeType(parseIntegerField(getFieldValue(line, headerMap, "route_type")))
                            .routeColor(getFieldValue(line, headerMap, "route_color", "FFFFFF"))
                            .routeTextColor(getFieldValue(line, headerMap, "route_text_color", "000000"))
                            .upload(upload)
                            .build();
                    routes.add(route);

                    if (routes.size() >= BATCH_SIZE) {
                        routeRepository.saveAll(routes);
                        routes.clear();
                    }
                    count++;
                } catch (Exception e) {
                    log.warn("Error importing route at line {}: {}", count + 2, e.getMessage());
                }
            }

            if (!routes.isEmpty()) {
                routeRepository.saveAll(routes);
            }

            log.info("Imported {} routes", count);
        }
    }

    private void importTrips(String content, Import upload) throws Exception {
        log.info("Start import Trips!");

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(content))
                .withSkipLines(0)
                .build()) {

            String[] headers = reader.readNext();
            Map<String, Integer> headerMap = createHeaderMap(headers);

            String[] line;
            int count = 0;
            List<Trip> trips = new ArrayList<>();

            while ((line = reader.readNext()) != null) {
                try {
                    String routeId = getFieldValue(line, headerMap, "route_id");
                    Route route = routeRepository.findById(routeId).orElse(null);

                    if (route != null) {
                        Trip trip = Trip.builder()
                                .tripId(getFieldValue(line, headerMap, "trip_id"))
                                .route(route)
                                .serviceId(getFieldValue(line, headerMap, "service_id"))
                                .tripHeadsign(getFieldValue(line, headerMap, "trip_headsign", ""))
                                .tripShortName(getFieldValue(line, headerMap, "trip_short_name", ""))
                                .directionId(parseIntegerField(getFieldValue(line, headerMap, "direction_id", "0")))
                                .shapeId(getFieldValue(line, headerMap, "shape_id", ""))
                                .wheelchairAccessible(parseIntegerField(getFieldValue(line, headerMap, "wheelchair_accessible", "0")))
                                .bikesAllowed(parseIntegerField(getFieldValue(line, headerMap, "bikes_allowed", "0")))
                                .upload(upload)
                                .build();
                        trips.add(trip);

                        if (trips.size() >= BATCH_SIZE) {
                            tripRepository.saveAll(trips);
                            trips.clear();
                        }
                        count++;
                    }
                } catch (Exception e) {
                    log.warn("Error importing trip at line {}: {}", count + 2, e.getMessage());
                }
            }

            if (!trips.isEmpty()) {
                tripRepository.saveAll(trips);
            }

            log.info("Imported {} trips", count);
        }
    }

    private void importStopTimes(String content, Import upload) throws Exception {
        log.info("Start import Stop Times!");

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(content))
                .withSkipLines(0)
                .build()) {

            String[] headers = reader.readNext();
            Map<String, Integer> headerMap = createHeaderMap(headers);

            String[] line;
            int count = 0;
            List<StopTime> stopTimes = new ArrayList<>();

            while ((line = reader.readNext()) != null) {
                try {
                    String tripId = getFieldValue(line, headerMap, "trip_id");
                    String stopId = getFieldValue(line, headerMap, "stop_id");

                    Trip trip = tripRepository.findById(tripId).orElse(null);
                    Stop stop = stopRepository.findById(stopId).orElse(null);

                    if (trip != null && stop != null) {
                        StopTime stopTime = StopTime.builder()
                                .trip(trip)
                                .stop(stop)
                                .stopSequence(parseIntegerField(getFieldValue(line, headerMap, "stop_sequence")))
                                .arrivalTime(parseTime(getFieldValue(line, headerMap, "arrival_time")))
                                .departureTime(parseTime(getFieldValue(line, headerMap, "departure_time")))
                                .upload(upload)
                                .build();
                        stopTimes.add(stopTime);

                        if (stopTimes.size() >= BATCH_SIZE) {
                            stopTimeRepository.saveAll(stopTimes);
                            stopTimes.clear();
                        }
                        count++;
                    }
                } catch (Exception e) {
                    log.warn("Error importing stop time at line {}: {}", count + 2, e.getMessage());
                }
            }

            if (!stopTimes.isEmpty()) {
                stopTimeRepository.saveAll(stopTimes);
            }

            log.info("Imported {} stop times", count);
        }
    }

    private void importCalendarDates(String content, Import upload) throws Exception {
        log.info("Start import Calendar Dates!");

        try (CSVReader reader = new CSVReaderBuilder(new StringReader(content))
                .withSkipLines(0)
                .build()) {

            String[] headers = reader.readNext();
            Map<String, Integer> headerMap = createHeaderMap(headers);

            String[] line;
            int count = 0;
            List<CalendarDate> calendarDates = new ArrayList<>();
            LocalDate minDate = null;
            LocalDate maxDate = null;

            while ((line = reader.readNext()) != null) {
                try {
                    LocalDate date = LocalDate.parse(getFieldValue(line, headerMap, "date"), DATE_FORMATTER);
                    
                    // Track min and max dates
                    if (minDate == null || date.isBefore(minDate)) {
                        minDate = date;
                    }
                    if (maxDate == null || date.isAfter(maxDate)) {
                        maxDate = date;
                    }
                    
                    CalendarDate calendarDate = CalendarDate.builder()
                            .serviceId(getFieldValue(line, headerMap, "service_id"))
                            .date(date)
                            .exceptionType(parseIntegerField(getFieldValue(line, headerMap, "exception_type")))
                            .upload(upload)
                            .build();
                    calendarDates.add(calendarDate);

                    if (calendarDates.size() >= BATCH_SIZE) {
                        calendarDateRepository.saveAll(calendarDates);
                        calendarDates.clear();
                    }
                    count++;
                } catch (Exception e) {
                    log.warn("Error importing calendar date at line {}: {}", count + 2, e.getMessage());
                }
            }

            if (!calendarDates.isEmpty()) {
                calendarDateRepository.saveAll(calendarDates);
            }

            // Set date range in upload
            if (minDate != null && maxDate != null) {
                upload.setStartDate(minDate);
                upload.setEndDate(maxDate);
                uploadRepository.save(upload);
                log.info("GTFS data valid from {} to {}", minDate, maxDate);
            }

            log.info("Imported {} calendar dates", count);
        }
    }

    private Map<String, Integer> createHeaderMap(String[] headers) {
        Map<String, Integer> headerMap = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            headerMap.put(headers[i].trim().toLowerCase(), i);
        }
        return headerMap;
    }

    private String getFieldValue(String[] line, Map<String, Integer> headerMap, String fieldName) {
        return getFieldValue(line, headerMap, fieldName, null);
    }

    private String getFieldValue(String[] line, Map<String, Integer> headerMap, String fieldName, String defaultValue) {
        Integer index = headerMap.get(fieldName.toLowerCase());
        if (index != null && index < line.length && line[index] != null && !line[index].trim().isEmpty()) {
            return line[index].trim();
        }
        if (defaultValue != null) {
            return defaultValue;
        }
        throw new IllegalArgumentException("Brakuje wymaganego pola: " + fieldName);
    }

    private Integer parseIntegerField(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }

        String[] parts = timeStr.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        int seconds = parts.length > 2 ? Integer.parseInt(parts[2]) : 0;
        hours = hours % 24;

        return LocalTime.of(hours, minutes, seconds);
    }

    public Optional<ImportInfoDto> getActiveImport() {
        return uploadRepository.findByIsActiveTrue()
                .map(upload -> ImportInfoDto.builder()
                        .id(upload.getId())
                        .filename(upload.getFilename())
                        .uploadDate(upload.getUploadDate())
                        .isActive(upload.getIsActive())
                        .startDate(upload.getStartDate())
                        .endDate(upload.getEndDate())
                        .build());
    }
}