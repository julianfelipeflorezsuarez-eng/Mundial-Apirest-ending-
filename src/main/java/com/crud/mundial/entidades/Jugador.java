package com.crud.mundial.entidades;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Document(collection = "jugadores")
public class Jugador {

    @Id
    private String id;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellido;

    @NotNull(message = "El número de camiseta es obligatorio")
    @Min(value = 1, message = "El número mínimo es 1")
    @Max(value = 99, message = "El número máximo es 99")
    private Integer numero;

    @NotBlank(message = "La posición es obligatoria")
    private String posicion;

    // Referencia al club (equivale a la FK id_club del proyecto anterior).
    // Esta es la ÚNICA fuente de verdad de la relación Club -> Jugadores.
    // Al crear o actualizar un jugador por la API es obligatorio y debe existir.
    // (Solo los jugadores "libres" del seed o los liberados por un PUT de club tienen null.)
    @NotBlank(message = "El jugador debe pertenecer a un club (clubId)")
    private String clubId;

    public Jugador() {
    }

    // Constructor para crear jugadores libres (sin club) en los datos iniciales
    public Jugador(String nombre, String apellido, Integer numero, String posicion) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.numero = numero;
        this.posicion = posicion;
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

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public String getPosicion() {
        return posicion;
    }

    public void setPosicion(String posicion) {
        this.posicion = posicion;
    }

    public String getClubId() {
        return clubId;
    }

    public void setClubId(String clubId) {
        this.clubId = clubId;
    }
}
