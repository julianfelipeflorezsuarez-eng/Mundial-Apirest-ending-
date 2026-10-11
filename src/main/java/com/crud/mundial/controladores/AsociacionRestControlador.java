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

import com.crud.mundial.entidades.Asociacion;
import com.crud.mundial.repositorios.AsociacionRepositorio;
import com.crud.mundial.repositorios.ClubRepositorio;

import jakarta.validation.Valid;

/**
 * API REST de asociaciones.
 *
 * Regla: no se puede eliminar una asociación que tiene clubes -> 409 CONFLICT.
 */
@RestController
@RequestMapping("/api/asociaciones")
public class AsociacionRestControlador {

    private final AsociacionRepositorio asociacionRepositorio;
    private final ClubRepositorio clubRepositorio;

    public AsociacionRestControlador(AsociacionRepositorio asociacionRepositorio, ClubRepositorio clubRepositorio) {
        this.asociacionRepositorio = asociacionRepositorio;
        this.clubRepositorio = clubRepositorio;
    }

    // ---------- GET /api/asociaciones ----------
    @GetMapping
    public List<Asociacion> listar() {
        return asociacionRepositorio.findAll(Sort.by("nombre"));
    }

    // ---------- GET /api/asociaciones/{id} ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable("id") String id) {
        Optional<Asociacion> asociacion = asociacionRepositorio.findById(id);
        if (asociacion.isEmpty()) {
            return respuesta(HttpStatus.NOT_FOUND, "Asociación no encontrada",
                    "La asociación con id " + id + " no existe.");
        }
        return ResponseEntity.ok(asociacion.get());
    }

    // ---------- POST /api/asociaciones ----------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Asociacion asociacion, BindingResult resultado) {
        if (resultado.hasErrors()) {
            return datosInvalidos("No se puede crear la asociación", resultado);
        }
        asociacion.setId(null); // el id lo genera MongoDB
        return ResponseEntity.status(HttpStatus.CREATED).body(asociacionRepositorio.save(asociacion));
    }

    // ---------- PUT /api/asociaciones/{id} ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable("id") String id,
                                        @Valid @RequestBody Asociacion asociacion,
                                        BindingResult resultado) {
        if (!asociacionRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Asociación no encontrada",
                    "La asociación con id " + id + " no existe.");
        }
        if (resultado.hasErrors()) {
            return datosInvalidos("No se puede actualizar la asociación", resultado);
        }
        asociacion.setId(id);
        return ResponseEntity.ok(asociacionRepositorio.save(asociacion));
    }

    // ---------- DELETE /api/asociaciones/{id} ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable("id") String id) {
        if (!asociacionRepositorio.existsById(id)) {
            return respuesta(HttpStatus.NOT_FOUND, "Asociación no encontrada",
                    "La asociación con id " + id + " no existe.");
        }
        long clubes = clubRepositorio.countByAsociacionId(id);
        if (clubes > 0) {
            return respuesta(HttpStatus.CONFLICT, "No se puede eliminar la asociación",
                    "La asociación tiene " + clubes + " club(es) relacionado(s). "
                            + "Primero deben resolverse sus clubes.");
        }
        asociacionRepositorio.deleteById(id);
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
