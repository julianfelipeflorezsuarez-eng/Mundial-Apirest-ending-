package com.crud.mundial;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.crud.mundial.entidades.Asociacion;
import com.crud.mundial.entidades.Club;
import com.crud.mundial.entidades.Competicion;
import com.crud.mundial.entidades.Entrenador;
import com.crud.mundial.entidades.Jugador;
import com.crud.mundial.repositorios.AsociacionRepositorio;
import com.crud.mundial.repositorios.ClubRepositorio;
import com.crud.mundial.repositorios.CompeticionRepositorio;
import com.crud.mundial.repositorios.EntrenadorRepositorio;
import com.crud.mundial.repositorios.JugadorRepositorio;

@SpringBootApplication
public class CrudMundialFelipeApiRestApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrudMundialFelipeApiRestApplication.class, args);
    }

    /**
     * Carga datos de ejemplo en MongoDB al iniciar (solo si todavía no hay clubes).
     * Todos los clubes cumplen las reglas: entrenador, 3 jugadores, asociación y competiciones válidas.
     * Quedan además entrenadores y jugadores LIBRES para poder crear nuevos clubes desde Postman.
     * Los nombres de personas son ficticios.
     */
    @Bean
    CommandLineRunner datosIniciales(AsociacionRepositorio asociaciones,
                                     EntrenadorRepositorio entrenadores,
                                     JugadorRepositorio jugadores,
                                     CompeticionRepositorio competiciones,
                                     ClubRepositorio clubes) {
        return args -> {
            if (clubes.count() > 0) {
                return;
            }

            // ----- Asociaciones -----
            Asociacion fcf = asociaciones.save(new Asociacion("Federación Colombiana de Fútbol", "Colombia", "Hernán Ospina"));
            Asociacion rfef = asociaciones.save(new Asociacion("Real Federación Española de Fútbol", "España", "Luis Ferrer"));
            Asociacion afa = asociaciones.save(new Asociacion("Asociación del Fútbol Argentino", "Argentina", "Gustavo Ríos"));

            // ----- Competiciones -----
            Competicion libertadores = competiciones.save(new Competicion("Copa Libertadores", 20000000L,
                    LocalDate.of(2026, 2, 3), LocalDate.of(2026, 11, 28)));
            Competicion campeones = competiciones.save(new Competicion("Liga de Campeones", 25000000L,
                    LocalDate.of(2026, 9, 8), LocalDate.of(2027, 5, 30)));
            Competicion mundialClubes = competiciones.save(new Competicion("Mundial de Clubes", 15000000L,
                    LocalDate.of(2026, 6, 14), LocalDate.of(2026, 7, 13)));

            // ----- Entrenadores (los dos últimos quedan libres, sin club) -----
            Entrenador e1 = entrenadores.save(new Entrenador("Andrés", "Molina", 52, "Colombia"));
            Entrenador e2 = entrenadores.save(new Entrenador("Camilo", "Restrepo", 47, "Colombia"));
            Entrenador e3 = entrenadores.save(new Entrenador("Javier", "Duarte", 55, "España"));
            Entrenador e4 = entrenadores.save(new Entrenador("Martín", "Herrera", 49, "Argentina"));
            entrenadores.save(new Entrenador("Luis", "Salgado", 44, "Chile"));
            entrenadores.save(new Entrenador("Ricardo", "Vega", 50, "Uruguay"));

            // ----- Jugadores (se guardan sin club; el club los reclama al crearse) -----
            List<Jugador> plantelMillonarios = jugadores.saveAll(List.of(
                    new Jugador("Sebastián", "Rojas", 1, "Portero"),
                    new Jugador("Mateo", "Cárdenas", 4, "Defensa"),
                    new Jugador("Julián", "Ortiz", 10, "Mediocampista")));
            List<Jugador> plantelSantaFe = jugadores.saveAll(List.of(
                    new Jugador("Esteban", "Mejía", 1, "Portero"),
                    new Jugador("Nicolás", "Pardo", 6, "Defensa"),
                    new Jugador("Brayan", "Lozano", 9, "Delantero")));
            List<Jugador> plantelRealMadrid = jugadores.saveAll(List.of(
                    new Jugador("Álvaro", "Fuentes", 1, "Portero"),
                    new Jugador("Diego", "Sandoval", 5, "Defensa"),
                    new Jugador("Pablo", "Navarro", 7, "Delantero")));
            List<Jugador> plantelRiver = jugadores.saveAll(List.of(
                    new Jugador("Lucas", "Benítez", 1, "Portero"),
                    new Jugador("Tomás", "Acuña", 8, "Mediocampista"),
                    new Jugador("Ignacio", "Paredes", 11, "Delantero")));

            // Jugadores libres (sin club), disponibles para formar nuevos clubes
            jugadores.save(new Jugador("Gabriel", "Salas", 3, "Defensa"));
            jugadores.save(new Jugador("Rodrigo", "Peña", 10, "Mediocampista"));
            jugadores.save(new Jugador("Santiago", "Vargas", 2, "Defensa"));
            jugadores.save(new Jugador("Daniel", "Morales", 9, "Delantero"));

            // ----- Clubes con todas sus relaciones -----
            Club millonarios = new Club("Millonarios FC", "Bogotá", "Estadio El Campín");
            millonarios.setEntrenadorId(e1.getId());
            millonarios.setAsociacionId(fcf.getId());
            millonarios.setCompeticionesIds(ids(libertadores, mundialClubes));
            guardarClub(clubes, jugadores, millonarios, plantelMillonarios);

            Club santaFe = new Club("Independiente Santa Fe", "Bogotá", "Estadio El Campín");
            santaFe.setEntrenadorId(e2.getId());
            santaFe.setAsociacionId(fcf.getId());
            santaFe.setCompeticionesIds(ids(libertadores));
            guardarClub(clubes, jugadores, santaFe, plantelSantaFe);

            Club realMadrid = new Club("Real Madrid CF", "Madrid", "Santiago Bernabéu");
            realMadrid.setEntrenadorId(e3.getId());
            realMadrid.setAsociacionId(rfef.getId());
            realMadrid.setCompeticionesIds(ids(campeones, mundialClubes));
            guardarClub(clubes, jugadores, realMadrid, plantelRealMadrid);

            Club river = new Club("River Plate", "Buenos Aires", "Estadio Monumental");
            river.setEntrenadorId(e4.getId());
            river.setAsociacionId(afa.getId());
            river.setCompeticionesIds(ids(libertadores, mundialClubes));
            guardarClub(clubes, jugadores, river, plantelRiver);
        };
    }

    // Guarda el club y marca a sus jugadores con el id del club (jugador.clubId)
    private static void guardarClub(ClubRepositorio clubes, JugadorRepositorio jugadores,
                                    Club club, List<Jugador> plantel) {
        Club guardado = clubes.save(club);
        for (Jugador jugador : plantel) {
            jugador.setClubId(guardado.getId());
        }
        jugadores.saveAll(plantel);
    }

    // Convierte varias competiciones en la lista de sus IDs
    private static List<String> ids(Competicion... competiciones) {
        List<String> ids = new ArrayList<>();
        for (Competicion competicion : competiciones) {
            ids.add(competicion.getId());
        }
        return ids;
    }
}
