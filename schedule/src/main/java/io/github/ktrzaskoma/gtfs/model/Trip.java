package io.github.ktrzaskoma.gtfs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Trip {

    @Id
    @Column(name = "trip_id")
    private String tripId;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;

    @Column(name = "service_id")
    private String serviceId;

    @Column(name = "trip_headsign")
    private String tripHeadsign;

    @Column(name = "trip_short_name")
    private String tripShortName;

    @Column(name = "direction_id")
    private Integer directionId;

    @Column(name = "shape_id")
    private String shapeId;

    @Column(name = "wheelchair_accessible")
    private Integer wheelchairAccessible;

    @Column(name = "bikes_allowed")
    private Integer bikesAllowed;

    @ManyToOne
    @JoinColumn(name = "upload_id")
    private Import upload;
}
