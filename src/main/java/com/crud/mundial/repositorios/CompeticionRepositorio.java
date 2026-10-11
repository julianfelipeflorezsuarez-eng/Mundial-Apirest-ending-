package com.crud.mundial.repositorios;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.crud.mundial.entidades.Competicion;

public interface CompeticionRepositorio extends MongoRepository<Competicion, String> {
}
