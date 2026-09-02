package com.clinisign.tenant.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Component
public class PdfPlantillaAnalyzer {

    public String extraerTexto(MultipartFile file) {
        try (PDDocument doc = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo leer el PDF: " + e.getMessage(), e);
        }
    }

    public Map<String, String> analizar(String texto) {
        String t = texto == null ? "" : texto.replace("\r", "\n");
        Map<String, String> out = new HashMap<>();
        String upper = t.toUpperCase(Locale.ROOT);
        out.put("tipo", upper.contains("DESIST") ? "DESISTIMIENTO" : "CONSENTIMIENTO");
        out.put("codigo", extraerCodigo(upper));
        out.put("nombre", primeraLineaTitulo(t, out.get("tipo")));
        out.put("procedimientos", seccion(t, "procedimientos", "beneficios", "alternativas", "riesgos"));
        out.put("beneficios", seccion(t, "beneficios", "alternativas", "riesgos", "implicaciones"));
        out.put("alternativas", seccion(t, "alternativas", "riesgos", "implicaciones", "dejo constancia"));
        out.put("riesgos", seccion(t, "riesgos", "implicaciones", "dejo constancia", "autorizo"));
        String legal = seccion(t, "dejo constancia", "firma", "huella");
        if (legal.isBlank()) legal = seccion(t, "decidio conscientemente", "firma", "huella");
        if (legal.isBlank()) legal = seccion(t, "asumo los riesgos", "firma", "huella");
        out.put("textoLegal", legal.isBlank() ? recortar(t, 900) : legal);
        return out;
    }

    private String extraerCodigo(String upper) {
        int i = upper.indexOf("HC-FM-");
        if (i >= 0) return upper.substring(i, Math.min(i + 8, upper.length())).replaceAll("[^A-Z0-9\\-]", "");
        return upper.contains("DESIST") ? "HC-FM-06" : "HC-FM-04";
    }

    private String primeraLineaTitulo(String t, String tipo) {
        for (String line : t.split("\n")) {
            String s = line.trim();
            if (s.length() > 8 && s.toUpperCase(Locale.ROOT).contains("INFORMADO")) return s;
        }
        return "CONSENTIMIENTO".equals(tipo) ? "Consentimiento informado" : "Desistimiento informado";
    }

    private String seccion(String texto, String inicio, String... fines) {
        String lower = texto.toLowerCase(Locale.ROOT);
        int from = lower.indexOf(inicio.toLowerCase(Locale.ROOT));
        if (from < 0) return "";
        int end = texto.length();
        for (String f : fines) {
            int p = lower.indexOf(f.toLowerCase(Locale.ROOT), from + inicio.length());
            if (p > from && p < end) end = p;
        }
        return recortar(texto.substring(from, end).trim(), 1200);
    }

    private String recortar(String s, int max) {
        s = s.replaceAll("[ \\t]+", " ").replaceAll("\\n{3,}", "\n\n").trim();
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
