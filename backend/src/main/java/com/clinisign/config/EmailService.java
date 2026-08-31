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
        sender.setPassword(config.getSmtpPassword());
        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(Boolean.TRUE.equals(config.getSmtpAuth())));
        props.put("mail.smtp.starttls.enable", String.valueOf(Boolean.TRUE.equals(config.getSmtpStarttls())));
        return sender;
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
            helper.setFrom(config.getCorreoFrom() != null ? config.getCorreoFrom() : config.getSmtpUsername());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.info("Correo enviado a {} desde IPS {}", to, ipsId);
        } catch (Exception e) {
            throw new RuntimeException("Error enviando correo: " + e.getMessage(), e);
        }
    }
}
