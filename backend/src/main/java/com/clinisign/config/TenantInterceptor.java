package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class TenantInterceptor implements HandlerInterceptor {

    private final IpsRepository ipsRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") || path.startsWith("/api/public/")) {
            return true;
        }
        if (path.startsWith("/api/ips") || path.startsWith("/api/superadmin")) {
            String header = request.getHeader("X-Ips-Id");
            if (header != null && !header.isBlank() && !"null".equals(header)) {
                return setFromHeader(header, response);
            }
            return true;
        }

        String ipsIdHeader = request.getHeader("X-Ips-Id");
        if (ipsIdHeader == null || ipsIdHeader.isBlank() || "null".equals(ipsIdHeader)) {
            ipsIdHeader = request.getParameter("ipsId");
        }
        if (ipsIdHeader != null && !ipsIdHeader.isBlank() && !"null".equals(ipsIdHeader)) {
            return setFromHeader(ipsIdHeader, response);
        }

        Object jwtIpsId = request.getAttribute("jwtIpsId");
        if (jwtIpsId != null) {
            TenantContext.setIpsId((Long) jwtIpsId);
            return true;
        }

        response.sendError(400, "Falta header X-Ips-Id o el JWT no contiene ipsId");
        return false;
    }

    private boolean setFromHeader(String ipsIdHeader, HttpServletResponse response) throws Exception {
        try {
            Long ipsId = Long.valueOf(ipsIdHeader);
            Ips ips = ipsRepository.findById(ipsId).orElse(null);
            if (ips == null || !Boolean.TRUE.equals(ips.getActivo())) {
                response.sendError(403, "IPS inactiva o inexistente: " + ipsId);
                return false;
            }
            TenantContext.setIpsId(ipsId);
            return true;
        } catch (NumberFormatException e) {
            response.sendError(400, "X-Ips-Id inválido");
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }
}
