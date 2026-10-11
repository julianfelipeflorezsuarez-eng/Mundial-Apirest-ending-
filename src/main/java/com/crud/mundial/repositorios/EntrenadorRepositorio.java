package com.crud.mundial.repositorios;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.crud.mundial.entidades.Entrenador;

public interface EntrenadorRepositorio extends MongoRepository<Entrenador, String> {
}
