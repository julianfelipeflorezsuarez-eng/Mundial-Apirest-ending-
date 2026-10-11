package com.crud.mundial.controladores;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/Competicion")
public class CompeticionWebController {

    @GetMapping("/listar")
    public String listar() {
        return "Competicion/listar";
    }

    @GetMapping("/formulario")
    public String formulario() {
        return "Competicion/formulario";
    }
}
