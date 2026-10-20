package com.clinisign.config;

public class ActorContext {
    private static final ThreadLocal<String> EMAIL = new ThreadLocal<>();
    private static final ThreadLocal<String> ROL = new ThreadLocal<>();
    private static final ThreadLocal<String> NOMBRE = new ThreadLocal<>();

    public static void set(String email, String rol, String nombre) {
        EMAIL.set(email);
        ROL.set(rol);
        NOMBRE.set(nombre);
    }

    public static String email() { return EMAIL.get(); }
    public static String rol() { return ROL.get(); }
    public static String nombre() { return NOMBRE.get(); }

    public static String etiqueta() {
        String n = nombre() != null && !nombre().isBlank() ? nombre() : email();
        String r = rol() != null ? rol() : "?";
        String e = email() != null ? email() : "";
        if (n == null) n = "sistema";
        return n + " (" + r + ")" + (e.isBlank() ? "" : " · " + e);
    }

    public static void clear() {
        EMAIL.remove();
        ROL.remove();
        NOMBRE.remove();
    }
}