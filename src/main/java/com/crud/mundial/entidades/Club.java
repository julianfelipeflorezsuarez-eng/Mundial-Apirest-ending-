package com.crud.mundial.entidades;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

@Document(collection = "clubes")
public class Club {

    @Id
    private String id;

    @NotBlank(message = "El club debe tener un nombre")
    private String nombre;

    @NotBlank(message = "El club debe tener una ciudad")
    private String ciudad;

    @NotBlank(message = "El club debe tener un estadio")
    private String estadio;

    // OneToOne del proyecto anterior: el club guarda el ID de su entrenador.
    @NotBlank(message = "El club debe tener un entrenador (entrenadorId)")
    private String entrenadorId;

    // OneToMany del proyecto anterior: la relación se guarda en cada Jugador (jugador.clubId).
    // @Transient = este campo NO se guarda en la colección "clubes"; se rellena al consultar
    // y se recibe en el JSON al crear/actualizar. Así no hay dos copias que puedan descuadrarse.
    @Transient
    @NotEmpty(message = "El club debe tener al menos un jugador (jugadoresIds)")
    private List<String> jugadoresIds = new ArrayList<>();

    // ManyToOne del proyecto anterior: el club guarda el ID de su asociación.
    @NotBlank(message = "El club debe tener una asociación (asociacionId)")
    private String asociacionId;

    // ManyToMany del proyecto anterior: el club guarda la lista de IDs de sus competiciones.
    @NotEmpty(message = "El club debe tener al menos una competición (competicionesIds)")
    private List<String> competicionesIds = new ArrayList<>();

    public Club() {
    }

    public Club(String nombre, String ciudad, String estadio) {
        this.nombre = nombre;
        this.ciudad = ciudad;
        this.estadio = estadio;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getEstadio() {
        return estadio;
    }

    public void setEstadio(String estadio) {
        this.estadio = estadio;
    }

    public String getEntrenadorId() {
        return entrenadorId;
    }

    public void setEntrenadorId(String entrenadorId) {
        this.entrenadorId = entrenadorId;
    }

    public List<String> getJugadoresIds() {
        return jugadoresIds;
    }

    public void setJugadoresIds(List<String> jugadoresIds) {
        this.jugadoresIds = jugadoresIds;
    }

    public String getAsociacionId() {
        return asociacionId;
    }

    public void setAsociacionId(String asociacionId) {
        this.asociacionId = asociacionId;
    }

    public List<String> getCompeticionesIds() {
        return competicionesIds;
    }

    public void setCompeticionesIds(List<String> competicionesIds) {
        this.competicionesIds = competicionesIds;
    }
}
