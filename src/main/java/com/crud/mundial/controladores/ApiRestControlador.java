package com.crud.mundial.controladores;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api -> JSON real con el índice de la API.
 * Es el destino del botón grande "API REST" de la página de inicio.
 */
@RestController
@RequestMapping("/api")
public class ApiRestControlador {

    @GetMapping
    public Map<String, Object> indice() {
        Map<String, String> recursos = new LinkedHashMap<>();
        recursos.put("clubes", "/api/clubes");
        recursos.put("jugadores", "/api/jugadores");
        recursos.put("entrenadores", "/api/entrenadores");
        recursos.put("asociaciones", "/api/asociaciones");
        recursos.put("competiciones", "/api/competiciones");

        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("proyecto", "CRUD-MUNDIAL-FELIPE-APIREST");
        cuerpo.put("descripcion", "Sistema de Gestión del Mundial - API REST con MongoDB");
        cuerpo.put("recursos", recursos);
        return cuerpo;
    }
}
