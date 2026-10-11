package com.crud.mundial.controladores;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Club")
public class ClubWebController {

    @GetMapping("/listar")
    public String listar() {
        return "Club/listar";
    }

    @GetMapping("/formulario")
    public String formulario() {
        return "Club/formulario";
    }
}
