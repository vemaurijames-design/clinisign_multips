package com.clinisign.tenant.service;

import com.clinisign.tenant.entity.Paciente;
import com.clinisign.tenant.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PacienteService {
    private final PacienteRepository repo;

    public List<Paciente> listar() { return repo.findAll(); }
    public Paciente obtener(Long id) { return repo.findById(id).orElseThrow(); }
    public Paciente crear(Map<String, Object> body) {
        Paciente p = new Paciente();
        mapear(p, body);
        return repo.save(p);
    }
    public Paciente actualizar(Long id, Map<String, Object> body) {
        Paciente p = repo.findById(id).orElseThrow();
        mapear(p, body);
        return repo.save(p);
    }
    public void eliminar(Long id) { repo.deleteById(id); }

    private void mapear(Paciente p, Map<String, Object> body) {
        if (body.containsKey("tipoDocumento")) p.setTipoDocumento(str(body.get("tipoDocumento")));
        if (body.containsKey("documento")) p.setDocumento(str(body.get("documento")));
        if (body.containsKey("nombre")) p.setNombre(str(body.get("nombre")));
        if (body.containsKey("apellido")) p.setApellido(str(body.get("apellido")));
        if (body.containsKey("edad")) p.setEdad(toInt(body.get("edad")));
        if (body.containsKey("genero")) p.setGenero(str(body.get("genero")));
        if (body.containsKey("direccion")) p.setDireccion(str(body.get("direccion")));
        if (body.containsKey("telefono")) p.setTelefono(str(body.get("telefono")));
        if (body.containsKey("ciudad")) p.setCiudad(str(body.get("ciudad")));
        if (body.containsKey("eps")) p.setEps(str(body.get("eps")));
        if (body.containsKey("rh")) p.setRh(str(body.get("rh")));
        if (body.containsKey("contactoNombre")) p.setContactoNombre(str(body.get("contactoNombre")));
        if (body.containsKey("contactoTelefono")) p.setContactoTelefono(str(body.get("contactoTelefono")));
        if (body.containsKey("antecedentes")) p.setAntecedentes(str(body.get("antecedentes")));
        if (body.containsKey("alergias")) p.setAlergias(str(body.get("alergias")));
        if (body.containsKey("medicamentos")) p.setMedicamentos(str(body.get("medicamentos")));
    }

    private Integer toInt(Object o) {
        if (o == null || o.toString().isBlank()) return null;
        return Integer.valueOf(o.toString());
    }
    private String str(Object o) { return o == null ? null : o.toString(); }

    public byte[] exportarExcel() throws Exception {
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("Pacientes");
        String[] headers = {"Doc", "Nombre", "Apellido", "Edad", "Genero", "Telefono", "Ciudad", "EPS", "RH", "Direccion"};
        Row header = sheet.createRow(0);
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        for (int i = 0; i < headers.length; i++) {
            Cell c = header.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(style);
        }
        int row = 1;
        for (Paciente p : repo.findAll()) {
            Row r = sheet.createRow(row++);
            r.createCell(0).setCellValue(nz(p.getDocumento()));
            r.createCell(1).setCellValue(nz(p.getNombre()));
            r.createCell(2).setCellValue(nz(p.getApellido()));
            r.createCell(3).setCellValue(p.getEdad() != null ? p.getEdad() : 0);
            r.createCell(4).setCellValue(nz(p.getGenero()));
            r.createCell(5).setCellValue(nz(p.getTelefono()));
            r.createCell(6).setCellValue(nz(p.getCiudad()));
            r.createCell(7).setCellValue(nz(p.getEps()));
            r.createCell(8).setCellValue(nz(p.getRh()));
            r.createCell(9).setCellValue(nz(p.getDireccion()));
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        wb.write(out);
        wb.close();
        return out.toByteArray();
    }

    public int importarExcel(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream(); Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            int count = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String doc = getVal(row, 0);
                if (doc == null || doc.isBlank()) continue;
                Paciente p = repo.findByDocumento(doc).orElse(new Paciente());
                p.setDocumento(doc);
                p.setNombre(getVal(row, 1));
                p.setApellido(getVal(row, 2));
                String edad = getVal(row, 3);
                if (edad != null && !edad.isBlank()) p.setEdad(Integer.valueOf(edad.replace(".0", "")));
                p.setGenero(getVal(row, 4));
                p.setTelefono(getVal(row, 5));
                p.setCiudad(getVal(row, 6));
                p.setEps(getVal(row, 7));
                p.setRh(getVal(row, 8));
                p.setDireccion(getVal(row, 9));
                repo.save(p);
                count++;
            }
            return count;
        }
    }

    private String nz(String s) { return s == null ? "" : s; }

    private String getVal(Row row, int col) {
        Cell c = row.getCell(col);
        if (c == null) return null;
        return switch (c.getCellType()) {
            case STRING -> c.getStringCellValue();
            case NUMERIC -> String.valueOf((long) c.getNumericCellValue());
            case BOOLEAN -> String.valueOf(c.getBooleanCellValue());
            default -> null;
        };
    }
}
