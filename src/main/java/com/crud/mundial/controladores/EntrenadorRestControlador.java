package com.crud.mundial.controladores;

import java.util.LinkedHashMap;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crud.mundial.entidades.Club;
import com.crud.mundial.entidades.Entrenador;
import com.crud.mundial.repositorios.ClubRepositorio;
import com.crud.mundial.repositorios.EntrenadorRepositorio;

import jakarta.validation.Valid;

/**
 * API REST de entrenadores.
 *
 * Regla: no se puede eliminar un entrenador que dirige un club -> 409 CONFLICT.
 * (La asignación entrenador -> club se hace desde el club, con entrenadorId.)
 */
@RestController
@RequestMapping("/api/entrenadores")
public class EntrenadorRestControlador {

    private final EntrenadorRepositorio entrenadorRepositorio;
    private final ClubRepositorio clubRepositorio;

    public EntrenadorRestControlador(EntrenadorRepositorio entrenadorRepositorio, ClubRepositorio clubRepositorio) {
        this.entrenadorRepositorio = entrenadorRepositorio;
        this.clubRepositorio = clubRepositorio;
    }

    // ---------- GET /api/entrenadores   (y GET /api/entrenadores?libres=true) ----------
    @GetMapping
    public List<Entrenador> listar(@RequestParam(name = "libres", defaultValue = "false") boolean libres) {
        List<Entrenador> todos = entrenadorRepositorio.findAll(Sort.by("apellido", "nombre"));
        if (!libres) {
            return todos;
        }
        // Libres = los que no aparecen como entrenadorId en ningún club
        Set<String> ocupados = clubRepositorio.findAll().stream()
                .map(Club::getEntrenadorId).collect(Collectors.toSet());
        return todos.stream().filter(e -> !ocupados.contains(e.getId())).collect(Collectors.toList());
    }

    // ---------- GET /api/entrenadores/{id} ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable("id") String id) {
        Optional<Entrenador> entrenador = entrenadorRepositorio.findById(id);
        if (entrenador.isEmpty()) {
            return respuesta(HttpStatus.NOT_FOUND, "Entrenador no encontrado",
                    "El entrenador con id " + id + " no existe.");
        }
        return ResponseEntity.ok(entrenador.get());
    }

    // ---------- POST /api/entrenadores ----------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Entrenador entrenador, BindingResult resultado) {
        if (resultado.hasErrors()) {
            return datosInvalidos("No se puede crear el entrenador", resultado);
        }
        entrenador.setId(null); // el id lo genera MongoDB
        return ResponseEntity.status(HttpStatus.CREATED).body(entrenadorRepositorio.save(entrenador));
    }

    // ---------- PUT /api/entrenadores/{id} ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable("id") String id,
                                        @Valid @RequestBody Entrenador entrenador,
                                        BindingResult resultado) {
        if (!entrenadorRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Entrenador no encontrado",
                    "El entrenador con id " + id + " no existe.");
        }
        if (resultado.hasErrors()) {
            return datosInvalidos("No se puede actualizar el entrenador", resultado);
        }
        entrenador.setId(id);
        return ResponseEntity.ok(entrenadorRepositorio.save(entrenador));
    }

    // ---------- DELETE /api/entrenadores/{id} ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable("id") String id) {
        if (!entrenadorRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Entrenador no encontrado",
                    "El entrenador con id " + id + " no existe.");
        }
        Optional<Club> club = clubRepositorio.findByEntrenadorId(id);
        if (club.isPresent()) {
            return respuesta(HttpStatus.CONFLICT, "No se puede eliminar el entrenador",
                    "El entrenador dirige al club «" + club.get().getNombre()
                            + "». Primero debe quedar libre (asigne otro entrenador al club).");
        }
        entrenadorRepositorio.deleteById(id);
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
