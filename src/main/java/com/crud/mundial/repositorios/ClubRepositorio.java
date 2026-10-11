package com.crud.mundial.repositorios;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.crud.mundial.entidades.Club;

public interface ClubRepositorio extends MongoRepository<Club, String> {

    // Club que dirige un entrenador (regla: 1 entrenador -> máximo 1 club)
    Optional<Club> findByEntrenadorId(String entrenadorId);

    // Cuántos clubes pertenecen a una asociación (para impedir borrarla)
    long countByAsociacionId(String asociacionId);

    // Cuántos clubes participan en una competición (para impedir borrarla).
    // En MongoDB, { competicionesIds: "x" } encuentra los documentos cuyo ARRAY contiene "x".
    @Query(value = "{ 'competicionesIds': ?0 }", count = true)
    long contarPorCompeticion(String competicionId);
}
