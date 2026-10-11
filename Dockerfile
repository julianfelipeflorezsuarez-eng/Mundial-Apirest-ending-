FROM eclipse-temurin:17-jdk
COPY "./target/CRUD-MUNDIAL-FELIPE-APIREST-0.0.1-SNAPSHOT.jar" "app.jar"
EXPOSE 8093
ENTRYPOINT [ "java", "-jar", "app.jar" ]