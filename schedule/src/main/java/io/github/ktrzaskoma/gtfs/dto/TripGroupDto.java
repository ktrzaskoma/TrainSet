package io.github.ktrzaskoma.gtfs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripGroupDto {
    private String tripId;
    private List<TripInfoDto> variants;
    private Integer variantCount;
}







