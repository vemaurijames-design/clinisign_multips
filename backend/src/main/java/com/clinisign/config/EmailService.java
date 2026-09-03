package com.clinisign.config;

import com.clinisign.master.entity.IpsConfig;
import com.clinisign.master.repository.IpsConfigRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final IpsConfigRepository ipsConfigRepository;

    private JavaMailSenderImpl createMailSender(IpsConfig config) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(config.getSmtpHost());
        sender.setPort(config.getSmtpPort() != null ? config.getSmtpPort() : 587);
        sender.setUsername(config.getSmtpUsername());
        sender.setPassword(config.getSmtpPassword() == null ? "" : config.getSmtpPassword().replace(" ", ""));
        String user = config.getSmtpUsername() != null ? config.getSmtpUsername() : "";
        String host = config.getSmtpHost();
        if (host == null || host.isBlank()) {
            host = user.toLowerCase().contains("gmail") ? "smtp.gmail.com" : "smtp-mail.outlook.com";
        }
        sender.setHost(host);
        sender.setPort(config.getSmtpPort() != null ? config.getSmtpPort() : 587);
        sender.setUsername(user);
        sender.setPassword(config.getSmtpPassword() == null ? "" : config.getSmtpPassword().replace(" ", ""));
        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", host);
        return sender;
    }

    public void probar(Long ipsId, String to) {
        enviarConsentimiento(ipsId,
                to != null && !to.isBlank() ? to : null,
                "Prueba CliniSign",
                "<p>SMTP de esta IPS funciona.</p>");
    }

    public void enviarConsentimiento(Long ipsId, String to, String subject, String htmlBody) {
        IpsConfig config = ipsConfigRepository.findByIpsId(ipsId)
                .orElseThrow(() -> new RuntimeException("No hay config SMTP para IPS " + ipsId));
        if (config.getSmtpPassword() == null || config.getSmtpPassword().isBlank()) {
            log.warn("SMTP sin contraseña para IPS {}. El correo no se envía.", ipsId);
            throw new RuntimeException("SMTP no configurado para esta IPS");
        }
        try {
            JavaMailSenderImpl sender = createMailSender(config);
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getSmtpUsername() != null && !config.getSmtpUsername().isBlank() ? config.getSmtpUsername().trim() : (config.getCorreoFrom() != null ? config.getCorreoFrom() : "noreply@clinisign.local"));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.info("Correo enviado a {} desde IPS {}", to, ipsId);
        } catch (Exception e) {
            throw new RuntimeException("Error enviando correo: " + e.getMessage(), e);
        }
    }

    public void enviarPdf(Long ipsId, String to, String subject, String htmlBody, byte[] pdf, String filename) {
        IpsConfig config = ipsConfigRepository.findByIpsId(ipsId)
                .orElseThrow(() -> new RuntimeException("No hay config SMTP para IPS " + ipsId));
        if (config.getSmtpPassword() == null || config.getSmtpPassword().isBlank()) {
            throw new RuntimeException("Configure la clave de aplicación SMTP de esta IPS (menú Configuración / correo).");
        }
        try {
            JavaMailSenderImpl sender = createMailSender(config);
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getSmtpUsername() != null && !config.getSmtpUsername().isBlank() ? config.getSmtpUsername().trim() : (config.getCorreoFrom() != null ? config.getCorreoFrom() : "noreply@clinisign.local"));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            if (pdf != null && pdf.length > 0) {
                helper.addAttachment(filename != null ? filename : "documento.pdf",
                        new org.springframework.core.io.ByteArrayResource(pdf));
            }
            sender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Error enviando correo: " + e.getMessage()
                    + ". Use usuario y clave de aplicación del MISMO correo (Hotmail: smtp-mail.outlook.com / Gmail: smtp.gmail.com). El remitente debe ser ese usuario.", e);
        }
    }
}
