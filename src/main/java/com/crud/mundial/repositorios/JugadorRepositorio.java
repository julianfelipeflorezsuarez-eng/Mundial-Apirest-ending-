package com.crud.mundial.repositorios;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.crud.mundial.entidades.Jugador;

public interface JugadorRepositorio extends MongoRepository<Jugador, String> {

    // Jugadores de un club (relación Club -> Jugadores)
    List<Jugador> findByClubId(String clubId);

    // Cuántos jugadores tiene un club (para impedir borrar un club con jugadores)
    long countByClubId(String clubId);

    // Jugadores libres: todavía no pertenecen a ningún club
    List<Jugador> findByClubIdIsNull();
}
