package io.github.ktrzaskoma.gtfs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Route {

    @Id
    @Column(name = "route_id")
    private String routeId;

    @ManyToOne
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @Column(name = "route_short_name")
    private String routeShortName;

    @Column(name = "route_long_name")
    private String routeLongName;

    @Column(name = "route_type")
    private Integer routeType;

    @Column(name = "route_color", length = 10)
    private String routeColor;

    @Column(name = "route_text_color", length = 10)
    private String routeTextColor;

    @ManyToOne
    @JoinColumn(name = "upload_id")
    private Import upload;
}
