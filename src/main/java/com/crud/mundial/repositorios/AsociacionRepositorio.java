package com.crud.mundial.repositorios;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.crud.mundial.entidades.Asociacion;

public interface AsociacionRepositorio extends MongoRepository<Asociacion, String> {
}
