package com.crud.mundial.controladores;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.crud.mundial.repositorios.AsociacionRepositorio;
import com.crud.mundial.repositorios.ClubRepositorio;
import com.crud.mundial.repositorios.CompeticionRepositorio;
import com.crud.mundial.repositorios.EntrenadorRepositorio;
import com.crud.mundial.repositorios.JugadorRepositorio;

/**
 * Solo sirve la página de inicio (index.html).
 * Es un @Controller normal (devuelve una vista HTML). Los datos JSON los dan los @RestController.
 */
@Controller
public class InicioControlador {

    private final ClubRepositorio clubRepositorio;
    private final JugadorRepositorio jugadorRepositorio;
    private final EntrenadorRepositorio entrenadorRepositorio;
    private final AsociacionRepositorio asociacionRepositorio;
    private final CompeticionRepositorio competicionRepositorio;

    public InicioControlador(ClubRepositorio clubRepositorio,
                             JugadorRepositorio jugadorRepositorio,
                             EntrenadorRepositorio entrenadorRepositorio,
                             AsociacionRepositorio asociacionRepositorio,
                             CompeticionRepositorio competicionRepositorio) {
        this.clubRepositorio = clubRepositorio;
        this.jugadorRepositorio = jugadorRepositorio;
        this.entrenadorRepositorio = entrenadorRepositorio;
        this.asociacionRepositorio = asociacionRepositorio;
        this.competicionRepositorio = competicionRepositorio;
    }

    @GetMapping("/")
    public String inicio(Model modelo) {
        modelo.addAttribute("totalClubes", clubRepositorio.count());
        modelo.addAttribute("totalJugadores", jugadorRepositorio.count());
        modelo.addAttribute("totalEntrenadores", entrenadorRepositorio.count());
        modelo.addAttribute("totalAsociaciones", asociacionRepositorio.count());
        modelo.addAttribute("totalCompeticiones", competicionRepositorio.count());
        return "index";
    }
}
