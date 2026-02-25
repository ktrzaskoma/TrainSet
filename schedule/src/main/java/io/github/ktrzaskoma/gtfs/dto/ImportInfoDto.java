package io.github.ktrzaskoma.gtfs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportInfoDto {
    private Long id;
    private String filename;
    private LocalDateTime uploadDate;
    private Boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
}




