package com.crud.mundial.controladores;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Entrenador")
public class EntrenadorWebController {

    @GetMapping("/listar")
    public String listar() {
        return "Entrenador/listar";
    }

    @GetMapping("/formulario")
    public String formulario() {
        return "Entrenador/formulario";
    }
}
