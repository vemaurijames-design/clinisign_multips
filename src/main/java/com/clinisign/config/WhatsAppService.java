package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.entity.IpsConfig;
import com.clinisign.master.repository.IpsConfigRepository;
import com.clinisign.master.repository.IpsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final IpsConfigRepository ipsConfigRepository;
    private final IpsRepository ipsRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${clinisign.whatsapp.api-url:https://graph.facebook.com/v20.0}")
    private String apiUrl;

    public Map<String, Object> enviarOGenerarLink(Long ipsId, String telefono, String mensaje) {
        String digits = normalizar(telefono);
        String link = "https://wa.me/" + digits + "?text=" + URLEncoder.encode(mensaje, StandardCharsets.UTF_8);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("whatsappLink", link);
        out.put("telefono", digits);

        IpsConfig config = ipsId != null ? ipsConfigRepository.findByIpsId(ipsId).orElse(null) : null;
        boolean apiOk = config != null
                && Boolean.TRUE.equals(config.getWhatsappEnabled())
                && config.getWhatsappToken() != null && !config.getWhatsappToken().isBlank()
                && config.getWhatsappPhoneNumberId() != null && !config.getWhatsappPhoneNumberId().isBlank();

        if (!apiOk) {
            out.put("canal", "WHATSAPP_LINK");
            out.put("enviadoApi", false);
            out.put("detalle", "Sin token de Meta. Use el enlace wa.me para enviar el recordatorio a mano o configure WhatsApp en la IPS.");
            return out;
        }

        try {
            String url = apiUrl + "/" + config.getWhatsappPhoneNumberId() + "/messages";
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(config.getWhatsappToken());
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("to", digits);
            body.put("type", "text");
            body.put("text", Map.of("body", mensaje, "preview_url", false));
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
            out.put("canal", "WHATSAPP_API");
            out.put("enviadoApi", true);
            out.put("detalle", "Mensaje enviado por WhatsApp Cloud API");
        } catch (Exception e) {
            log.warn("WhatsApp API falló, se deja enlace wa.me: {}", e.getMessage());
            out.put("canal", "WHATSAPP_LINK");
            out.put("enviadoApi", false);
            out.put("detalle", "API falló: " + e.getMessage());
        }
        return out;
    }

    public String mensajeCita(Long ipsId, String paciente, String fecha, String hora, String lugar, String motivo) {
        String ipsNombre = "la IPS";
        if (ipsId != null) {
            Ips ips = ipsRepository.findById(ipsId).orElse(null);
            if (ips != null) ipsNombre = ips.getNombre();
        }
        return "Hola " + (paciente != null ? paciente : "") +
                ", le recordamos su cita en " + ipsNombre +
                " el " + fecha + " a las " + hora +
                (lugar != null && !lugar.isBlank() ? " en " + lugar : "") +
                (motivo != null && !motivo.isBlank() ? ". Motivo: " + motivo : "") +
                ". Si no puede asistir, responda este mensaje.";
    }

    public String normalizar(String telefono) {
        if (telefono == null) return "";
        String d = telefono.replaceAll("[^0-9]", "");
        if (d.startsWith("00")) d = d.substring(2);
        if (d.length() == 10 && d.startsWith("3")) d = "57" + d;
        return d;
    }
}
