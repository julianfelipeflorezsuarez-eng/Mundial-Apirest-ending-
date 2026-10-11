package com.crud.mundial.controladores;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crud.mundial.entidades.Jugador;
import com.crud.mundial.repositorios.ClubRepositorio;
import com.crud.mundial.repositorios.JugadorRepositorio;

import jakarta.validation.Valid;

/**
 * API REST de jugadores.
 *
 * Regla principal: un jugador creado o actualizado por la API debe tener un clubId que EXISTA.
 *   400 -> datos inválidos (número fuera de 1-99, campos vacíos, clubId ausente...)
 *   404 -> el clubId (o el jugador) no existe
 */
@RestController
@RequestMapping("/api/jugadores")
public class JugadorRestControlador {

    private final JugadorRepositorio jugadorRepositorio;
    private final ClubRepositorio clubRepositorio;

    public JugadorRestControlador(JugadorRepositorio jugadorRepositorio, ClubRepositorio clubRepositorio) {
        this.jugadorRepositorio = jugadorRepositorio;
        this.clubRepositorio = clubRepositorio;
    }

    // ---------- GET /api/jugadores   (y GET /api/jugadores?libres=true) ----------
    @GetMapping
    public List<Jugador> listar(@RequestParam(name = "libres", defaultValue = "false") boolean libres) {
        if (libres) {
            return jugadorRepositorio.findByClubIdIsNull();
        }
        return jugadorRepositorio.findAll(Sort.by("apellido", "nombre"));
    }

    // ---------- GET /api/jugadores/{id} ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable("id") String id) {
        Optional<Jugador> jugador = jugadorRepositorio.findById(id);
        if (jugador.isEmpty()) {
            return respuesta(HttpStatus.NOT_FOUND, "Jugador no encontrado", "El jugador con id " + id + " no existe.");
        }
        return ResponseEntity.ok(jugador.get());
    }

    // ---------- POST /api/jugadores ----------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Jugador jugador, BindingResult resultado) {
        String titulo = "No se puede crear el jugador";

        if (resultado.hasErrors()) {
            return datosInvalidos(titulo, resultado);
        }
        if (!clubRepositorio.existsById(jugador.getClubId())) {
            return respuesta(HttpStatus.NOT_FOUND, titulo,
                    "El club con id " + jugador.getClubId() + " no existe. "
                            + "Un jugador debe pertenecer a un club existente.");
        }

        jugador.setId(null); // el id lo genera MongoDB
        return ResponseEntity.status(HttpStatus.CREATED).body(jugadorRepositorio.save(jugador));
    }

    // ---------- PUT /api/jugadores/{id} ----------
    // Cambiar el clubId equivale a reasignar el jugador a otro club.
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable("id") String id,
                                        @Valid @RequestBody Jugador jugador,
                                        BindingResult resultado) {
        String titulo = "No se puede actualizar el jugador";

        if (!jugadorRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Jugador no encontrado", "El jugador con id " + id + " no existe.");
        }
        if (resultado.hasErrors()) {
            return datosInvalidos(titulo, resultado);
        }
        if (!clubRepositorio.existsById(jugador.getClubId())) {
            return respuesta(HttpStatus.NOT_FOUND, titulo,
                    "El club con id " + jugador.getClubId() + " no existe. "
                            + "Un jugador debe pertenecer a un club existente.");
        }

        jugador.setId(id);
        return ResponseEntity.ok(jugadorRepositorio.save(jugador));
    }

    // ---------- DELETE /api/jugadores/{id} ----------
    // Un jugador no es referenciado por nadie más (la relación vive en jugador.clubId),
    // así que borrarlo nunca deja referencias rotas.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable("id") String id) {
        if (!jugadorRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Jugador no encontrado", "El jugador con id " + id + " no existe.");
        }
        jugadorRepositorio.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Auxiliares ----------
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
