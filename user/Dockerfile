FROM maven:3.9-amazoncorretto-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=builder /app/target/user-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8084
RUN addgroup -S app && adduser -S app -G app
USER app
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]