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
import org.springframework.web.bind.annotation.RestController;

import com.crud.mundial.entidades.Competicion;
import com.crud.mundial.repositorios.ClubRepositorio;
import com.crud.mundial.repositorios.CompeticionRepositorio;

import jakarta.validation.Valid;

/**
 * API REST de competiciones.
 *
 * Reglas:
 *   - La fecha de fin no puede ser anterior a la de inicio -> 400
 *   - No se puede eliminar una competición usada por algún club -> 409 CONFLICT
 */
@RestController
@RequestMapping("/api/competiciones")
public class CompeticionRestControlador {

    private final CompeticionRepositorio competicionRepositorio;
    private final ClubRepositorio clubRepositorio;

    public CompeticionRestControlador(CompeticionRepositorio competicionRepositorio, ClubRepositorio clubRepositorio) {
        this.competicionRepositorio = competicionRepositorio;
        this.clubRepositorio = clubRepositorio;
    }

    // ---------- GET /api/competiciones ----------
    @GetMapping
    public List<Competicion> listar() {
        return competicionRepositorio.findAll(Sort.by("nombre"));
    }

    // ---------- GET /api/competiciones/{id} ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable("id") String id) {
        Optional<Competicion> competicion = competicionRepositorio.findById(id);
        if (competicion.isEmpty()) {
            return respuesta(HttpStatus.NOT_FOUND, "Competición no encontrada",
                    "La competición con id " + id + " no existe.");
        }
        return ResponseEntity.ok(competicion.get());
    }

    // ---------- POST /api/competiciones ----------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Competicion competicion, BindingResult resultado) {
        String titulo = "No se puede crear la competición";

        if (resultado.hasErrors()) {
            return datosInvalidos(titulo, resultado);
        }
        if (competicion.getFechaFin().isBefore(competicion.getFechaInicio())) {
            return respuesta(HttpStatus.BAD_REQUEST, titulo,
                    "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }
        competicion.setId(null); // el id lo genera MongoDB
        return ResponseEntity.status(HttpStatus.CREATED).body(competicionRepositorio.save(competicion));
    }

    // ---------- PUT /api/competiciones/{id} ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable("id") String id,
                                        @Valid @RequestBody Competicion competicion,
                                        BindingResult resultado) {
        String titulo = "No se puede actualizar la competición";

        if (!competicionRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Competición no encontrada",
                    "La competición con id " + id + " no existe.");
        }
        if (resultado.hasErrors()) {
            return datosInvalidos(titulo, resultado);
        }
        if (competicion.getFechaFin().isBefore(competicion.getFechaInicio())) {
            return respuesta(HttpStatus.BAD_REQUEST, titulo,
                    "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }
        competicion.setId(id);
        return ResponseEntity.ok(competicionRepositorio.save(competicion));
    }

    // ---------- DELETE /api/competiciones/{id} ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable("id") String id) {
        if (!competicionRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Competición no encontrada",
                    "La competición con id " + id + " no existe.");
        }
        long clubes = clubRepositorio.contarPorCompeticion(id);
        if (clubes > 0) {
            return respuesta(HttpStatus.CONFLICT, "No se puede eliminar la competición",
                    "La competición está siendo utilizada por " + clubes + " club(es). "
                            + "Primero debe quitarla de esos clubes.");
        }
        competicionRepositorio.deleteById(id);
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
