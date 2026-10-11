package com.crud.mundial.controladores;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crud.mundial.entidades.Club;
import com.crud.mundial.entidades.Competicion;
import com.crud.mundial.entidades.Jugador;
import com.crud.mundial.repositorios.AsociacionRepositorio;
import com.crud.mundial.repositorios.ClubRepositorio;
import com.crud.mundial.repositorios.CompeticionRepositorio;
import com.crud.mundial.repositorios.EntrenadorRepositorio;
import com.crud.mundial.repositorios.JugadorRepositorio;

import jakarta.validation.Valid;

/**
 * API REST de clubes.
 *
 * Reglas de este controlador (todas se validan ANTES de guardar nada):
 *   400 BAD REQUEST -> faltan datos obligatorios (nombre, entrenador, jugadores, asociación, competiciones...)
 *   404 NOT FOUND   -> un ID enviado no existe en MongoDB
 *   409 CONFLICT    -> el entrenador/jugador ya pertenece a otro club, o el club tiene jugadores al borrarlo
 */
@RestController
@RequestMapping("/api/clubes")
public class ClubRestControlador {

    private final ClubRepositorio clubRepositorio;
    private final EntrenadorRepositorio entrenadorRepositorio;
    private final JugadorRepositorio jugadorRepositorio;
    private final AsociacionRepositorio asociacionRepositorio;
    private final CompeticionRepositorio competicionRepositorio;

    public ClubRestControlador(ClubRepositorio clubRepositorio,
                               EntrenadorRepositorio entrenadorRepositorio,
                               JugadorRepositorio jugadorRepositorio,
                               AsociacionRepositorio asociacionRepositorio,
                               CompeticionRepositorio competicionRepositorio) {
        this.clubRepositorio = clubRepositorio;
        this.entrenadorRepositorio = entrenadorRepositorio;
        this.jugadorRepositorio = jugadorRepositorio;
        this.asociacionRepositorio = asociacionRepositorio;
        this.competicionRepositorio = competicionRepositorio;
    }

    // ---------- GET /api/clubes ----------
    @GetMapping
    public List<Club> listar() {
        List<Club> clubes = clubRepositorio.findAll(Sort.by("nombre"));
        for (Club club : clubes) {
            cargarJugadores(club);
        }
        return clubes;
    }

    // ---------- GET /api/clubes/{id} ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable("id") String id) {
        Optional<Club> club = clubRepositorio.findById(id);
        if (club.isEmpty()) {
            return respuesta(HttpStatus.NOT_FOUND, "Club no encontrado", "El club con id " + id + " no existe.");
        }
        cargarJugadores(club.get());
        return ResponseEntity.ok(club.get());
    }

    // ---------- GET /api/clubes/{id}/detalle ----------
    // Muestra las 4 relaciones con los objetos completos (no solo los IDs).
    @GetMapping("/{id}/detalle")
    public ResponseEntity<?> detalle(@PathVariable("id") String id) {
        Optional<Club> opcional = clubRepositorio.findById(id);
        if (opcional.isEmpty()) {
            return respuesta(HttpStatus.NOT_FOUND, "Club no encontrado", "El club con id " + id + " no existe.");
        }
        Club club = opcional.get();

        Map<String, Object> detalle = new LinkedHashMap<>();
        detalle.put("id", club.getId());
        detalle.put("nombre", club.getNombre());
        detalle.put("ciudad", club.getCiudad());
        detalle.put("estadio", club.getEstadio());
        detalle.put("entrenador", club.getEntrenadorId() == null ? null
                : entrenadorRepositorio.findById(club.getEntrenadorId()).orElse(null));
        detalle.put("jugadores", jugadorRepositorio.findByClubId(club.getId()));
        detalle.put("asociacion", club.getAsociacionId() == null ? null
                : asociacionRepositorio.findById(club.getAsociacionId()).orElse(null));
        List<Competicion> competiciones = competicionRepositorio.findAllById(club.getCompeticionesIds());
        detalle.put("competiciones", competiciones);
        return ResponseEntity.ok(detalle);
    }

    // ---------- POST /api/clubes ----------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Club club, BindingResult resultado) {
        String titulo = "No se puede crear el club";

        // 1) Campos obligatorios (nombre, ciudad, estadio, entrenador, jugadores, asociación, competiciones)
        if (resultado.hasErrors()) {
            return datosInvalidos(titulo, resultado);
        }

        // Un cliente no puede elegir el id: lo genera MongoDB
        club.setId(null);

        // 2) Las referencias existen y no hay conflictos
        ResponseEntity<?> problema = validarRelaciones(club, null, titulo);
        if (problema != null) {
            return problema;
        }

        // 3) Todo correcto: ahora sí se guarda
        Club guardado = clubRepositorio.save(club);
        asignarJugadores(guardado);
        cargarJugadores(guardado);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // ---------- PUT /api/clubes/{id} ----------
    // Vuelve a validar TODAS las reglas. Los jugadores que ya no aparezcan en jugadoresIds quedan libres.
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable("id") String id,
                                        @Valid @RequestBody Club club,
                                        BindingResult resultado) {
        String titulo = "No se puede actualizar el club";

        if (!clubRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Club no encontrado", "El club con id " + id + " no existe.");
        }
        if (resultado.hasErrors()) {
            return datosInvalidos(titulo, resultado);
        }

        club.setId(id);

        ResponseEntity<?> problema = validarRelaciones(club, id, titulo);
        if (problema != null) {
            return problema;
        }

        // Jugadores que salen del club: quedan libres
        for (Jugador actual : jugadorRepositorio.findByClubId(id)) {
            if (!club.getJugadoresIds().contains(actual.getId())) {
                actual.setClubId(null);
                jugadorRepositorio.save(actual);
            }
        }

        Club guardado = clubRepositorio.save(club);
        asignarJugadores(guardado);
        cargarJugadores(guardado);
        return ResponseEntity.ok(guardado);
    }

    // ---------- DELETE /api/clubes/{id} ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable("id") String id) {
        if (!clubRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Club no encontrado", "El club con id " + id + " no existe.");
        }
        long jugadores = jugadorRepositorio.countByClubId(id);
        if (jugadores > 0) {
            return respuesta(HttpStatus.CONFLICT, "No se puede eliminar el club",
                    "El club tiene " + jugadores + " jugador(es) asociado(s). "
                            + "Primero debe eliminar o reasignar los jugadores.");
        }
        clubRepositorio.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =====================================================================
    //  MÉTODOS AUXILIARES
    // =====================================================================

    /**
     * Comprueba que todas las referencias del club son válidas.
     * idActual = null al crear; = id del club al actualizar (para no chocar consigo mismo).
     * Devuelve null si todo está bien, o la respuesta de error que hay que devolver.
     */
    private ResponseEntity<?> validarRelaciones(Club club, String idActual, String titulo) {

        // Las listas no pueden traer IDs vacíos; se eliminan los repetidos
        if (hayVacios(club.getJugadoresIds()) || hayVacios(club.getCompeticionesIds())) {
            return respuesta(HttpStatus.BAD_REQUEST, titulo,
                    "Las listas jugadoresIds y competicionesIds no pueden contener IDs vacíos.");
        }
        club.setJugadoresIds(new ArrayList<>(new LinkedHashSet<>(club.getJugadoresIds())));
        club.setCompeticionesIds(new ArrayList<>(new LinkedHashSet<>(club.getCompeticionesIds())));

        // Entrenador: debe existir y no dirigir ya a otro club (1 entrenador -> máximo 1 club)
        if (!entrenadorRepositorio.existsById(club.getEntrenadorId())) {
            return respuesta(HttpStatus.NOT_FOUND, titulo,
                    "El entrenador con id " + club.getEntrenadorId() + " no existe.");
        }
        Optional<Club> clubDelEntrenador = clubRepositorio.findByEntrenadorId(club.getEntrenadorId());
        if (clubDelEntrenador.isPresent() && !clubDelEntrenador.get().getId().equals(idActual)) {
            return respuesta(HttpStatus.CONFLICT, titulo,
                    "El entrenador ya dirige al club «" + clubDelEntrenador.get().getNombre()
                            + "». Un entrenador solo puede estar en un club.");
        }

        // Asociación: debe existir
        if (!asociacionRepositorio.existsById(club.getAsociacionId())) {
            return respuesta(HttpStatus.NOT_FOUND, titulo,
                    "La asociación con id " + club.getAsociacionId() + " no existe.");
        }

        // Jugadores: todos deben existir y estar libres (o ya ser de este mismo club)
        List<Jugador> jugadores = jugadorRepositorio.findAllById(club.getJugadoresIds());
        if (jugadores.size() != club.getJugadoresIds().size()) {
            Set<String> encontrados = jugadores.stream().map(Jugador::getId).collect(Collectors.toSet());
            List<String> faltan = club.getJugadoresIds().stream().filter(j -> !encontrados.contains(j)).toList();
            return respuesta(HttpStatus.NOT_FOUND, titulo, "Estos jugadores no existen: " + faltan);
        }
        for (Jugador jugador : jugadores) {
            if (jugador.getClubId() != null && !jugador.getClubId().equals(idActual)) {
                return respuesta(HttpStatus.CONFLICT, titulo,
                        "El jugador " + jugador.getNombre() + " " + jugador.getApellido()
                                + " (id " + jugador.getId() + ") ya pertenece a otro club.");
            }
        }

        // Competiciones: todas deben existir
        List<Competicion> competiciones = competicionRepositorio.findAllById(club.getCompeticionesIds());
        if (competiciones.size() != club.getCompeticionesIds().size()) {
            Set<String> encontradas = competiciones.stream().map(Competicion::getId).collect(Collectors.toSet());
            List<String> faltan = club.getCompeticionesIds().stream().filter(c -> !encontradas.contains(c)).toList();
            return respuesta(HttpStatus.NOT_FOUND, titulo, "Estas competiciones no existen: " + faltan);
        }

        return null;
    }

    // Marca a cada jugador del club con el id del club (la relación se guarda en el jugador)
    private void asignarJugadores(Club club) {
        List<Jugador> jugadores = jugadorRepositorio.findAllById(club.getJugadoresIds());
        for (Jugador jugador : jugadores) {
            jugador.setClubId(club.getId());
        }
        jugadorRepositorio.saveAll(jugadores);
    }

    // Rellena jugadoresIds leyendo los jugadores cuyo clubId es este club
    private void cargarJugadores(Club club) {
        List<String> ids = jugadorRepositorio.findByClubId(club.getId()).stream()
                .map(Jugador::getId).collect(Collectors.toList());
        club.setJugadoresIds(ids);
    }

    private boolean hayVacios(List<String> ids) {
        return ids.stream().anyMatch(i -> i == null || i.isBlank());
    }

    private ResponseEntity<Map<String, Object>> datosInvalidos(String titulo, BindingResult resultado) {
        Map<String, String> detalles = new LinkedHashMap<>();
        for (FieldError error : resultado.getFieldErrors()) {
            detalles.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("error", titulo);
        cuerpo.put("mensaje", String.join("; ", detalles.values()));
        cuerpo.put("detalles", detalles);
        return ResponseEntity.badRequest().body(cuerpo);
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus estado, String error, String mensaje) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("error", error);
        cuerpo.put("mensaje", mensaje);
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
