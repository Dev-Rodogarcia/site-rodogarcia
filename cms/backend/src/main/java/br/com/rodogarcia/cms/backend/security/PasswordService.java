package br.com.rodogarcia.cms.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Component;

@Component
public class PasswordService {

    private static final int BCRYPT_MAX_BYTES = 72;
    private static final int BCRYPT_COST = 10;

    private final SecureRandom random = new SecureRandom();

    public String hash(String password) {
        return BCrypt.hashpw(
            bcryptBytes(password),
            BCrypt.gensalt("$2b", BCRYPT_COST, random)
        );
    }

    public boolean verify(String password, String storedHash) {
        if (storedHash == null) return false;
        if (!storedHash.startsWith("pbkdf2$")) {
            try {
                return BCrypt.checkpw(bcryptBytes(password), storedHash);
            } catch (IllegalArgumentException ignored) {
                return false;
            }
        }

        String[] parts = storedHash.split("\\$", -1);
        if (parts.length != 4 || parts[1].isEmpty() || parts[2].isEmpty() || parts[3].isEmpty()) {
            return false;
        }
        try {
            int iterations = Integer.parseInt(parts[1]);
            if (iterations == 0) return false;
            byte[] candidate = pbkdf2Sha512(password, parts[2], iterations, 64);
            byte[] candidateHex = HexFormat.of().formatHex(candidate).getBytes(StandardCharsets.UTF_8);
            byte[] storedHex = parts[3].getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(candidateHex, storedHex);
        } catch (IllegalArgumentException | GeneralSecurityException ignored) {
            return false;
        }
    }

    public List<String> validateStrength(String password) {
        java.util.ArrayList<String> errors = new java.util.ArrayList<>();
        if (password.length() < 10) errors.add("A senha deve ter no minimo 10 caracteres.");
        if (password.length() > 72) errors.add("A senha deve ter no maximo 72 caracteres.");
        if (!password.matches("(?s).*[a-z].*")) errors.add("A senha deve incluir letra minuscula.");
        if (!password.matches("(?s).*[A-Z].*")) errors.add("A senha deve incluir letra maiuscula.");
        if (!password.matches("(?s).*\\d.*")) errors.add("A senha deve incluir numero.");
        return List.copyOf(errors);
    }

    private static byte[] bcryptBytes(String password) {
        byte[] bytes = password.getBytes(StandardCharsets.UTF_8);
        return bytes.length <= BCRYPT_MAX_BYTES
            ? bytes
            : Arrays.copyOf(bytes, BCRYPT_MAX_BYTES);
    }

    private static byte[] pbkdf2Sha512(
        String password,
        String salt,
        int iterations,
        int byteLength
    ) throws GeneralSecurityException {
        PBEKeySpec spec = new PBEKeySpec(
            password.toCharArray(),
            salt.getBytes(StandardCharsets.UTF_8),
            iterations,
            byteLength * 8
        );
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
                .generateSecret(spec).getEncoded();
        } finally {
            spec.clearPassword();
        }
    }
}
