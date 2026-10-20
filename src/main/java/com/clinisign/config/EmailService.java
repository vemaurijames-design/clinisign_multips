package com.clinisign.config;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@Slf4j
public class EmailService {

    @Value("${clinisign.mail.host:smtp.gmail.com}")
    private String systemHost;

    @Value("${clinisign.mail.port:587}")
    private int systemPort;

    @Value("${clinisign.mail.username:inforclinisign@gmail.com}")
    private String systemUsername;

    @Value("${clinisign.mail.password:}")
    private String systemPassword;

    @Value("${clinisign.mail.from:inforclinisign@gmail.com}")
    private String systemFrom;

    private JavaMailSenderImpl createSender() {
        String pass = systemPassword == null ? "" : systemPassword.replaceAll("[^A-Za-z0-9]", "");
        if (pass.isBlank()) {
            throw new RuntimeException("Falta clinisign.mail.password en application.properties");
        }
        log.info("SMTP → host={} port={} user={} passLen={}", systemHost, systemPort, systemUsername, pass.length());

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(systemHost);
        sender.setPort(systemPort);
        sender.setUsername(systemUsername.trim());
        sender.setPassword(pass);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", systemHost);
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout", "15000");
        return sender;
    }

    public void probar(Long ipsId, String to) {
        enviar(to, "Prueba CliniSign - " + systemFrom,
                "<p>El correo de notificaciones de CliniSign funciona correctamente.</p>" +
                        "<p><b>Remitente:</b> " + systemFrom + "</p>");
    }

    public void enviarConsentimiento(Long ipsId, String to, String subject, String htmlBody) {
        enviar(to, subject, htmlBody);
    }

    public void enviarPdf(Long ipsId, String to, String subject, String htmlBody, byte[] pdf, String filename) {
        enviarConAdjunto(to, subject, htmlBody, pdf, filename);
    }

    public void enviar(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) throw new RuntimeException("Indique el correo destino.");
        try {
            JavaMailSenderImpl sender = createSender();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(systemFrom.trim());
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.info("Correo enviado a {} desde {}", to, systemFrom);
        } catch (Exception e) {
            log.error("SMTP error: {}", e.getMessage());
            throw new RuntimeException("Error enviando correo: " + e.getMessage() +
                    ". Verifique que la clave de aplicación de Gmail sea de 16 letras y que el usuario sea inforclinisign@gmail.com", e);
        }
    }

    public void enviarConAdjunto(String to, String subject, String htmlBody, byte[] pdf, String filename) {
        if (to == null || to.isBlank()) throw new RuntimeException("Indique el correo destino.");
        try {
            JavaMailSenderImpl sender = createSender();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(systemFrom.trim());
            helper.setTo(to.trim());
            helper.setBcc(systemFrom.trim());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            log.info("Enviando a: {} | BCC: {} | Asunto: {}", to, systemFrom, subject);
            if (pdf != null && pdf.length > 0) {
                helper.addAttachment(filename != null ? filename : "documento.pdf",
                        new org.springframework.core.io.ByteArrayResource(pdf));
            }
            sender.send(message);
            log.info("PDF enviado a {} desde {}", to, systemFrom);
        } catch (Exception e) {
            log.error("SMTP PDF error: {}", e.getMessage());
            throw new RuntimeException("Error enviando correo: " + e.getMessage() +
                    ". Verifique la clave de aplicación de Gmail (16 letras, sin espacios).", e);
        }
    }
}