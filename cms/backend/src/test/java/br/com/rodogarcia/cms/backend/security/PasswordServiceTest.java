package br.com.rodogarcia.cms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PasswordServiceTest {

    private final PasswordService passwords = new PasswordService();

    @Test
    void writesBcrypt2bAtCostTenAndVerifiesIt() {
        String hash = passwords.hash("SenhaTeste123");

        assertThat(hash).startsWith("$2b$10$");
        assertThat(passwords.verify("SenhaTeste123", hash)).isTrue();
        assertThat(passwords.verify("SenhaErrada123", hash)).isFalse();
        assertThat(passwords.verify(
            "SenhaTeste123",
            "$2b$10$abcdefghijklmnopqrstuuUxOHIFS11JcqOEHeNcDDu32nXXtfNDy"
        )).isTrue();
    }

    @Test
    void preservesBcryptjsUtf8TruncationAtSeventyTwoBytes() {
        String password = "A1" + "é".repeat(40);
        String nodeHash = "$2b$10$abcdefghijklmnopqrstuuPcQ5GlVkGL8W4DyQTYfrmbd1po/Uys.";

        assertThat(password.length()).isLessThan(72);
        assertThat(password.getBytes(java.nio.charset.StandardCharsets.UTF_8)).hasSize(82);
        assertThat(passwords.verify(password, nodeHash)).isTrue();
        assertThat(passwords.verify("A1" + "é".repeat(35), nodeHash)).isTrue();
    }

    @Test
    void verifiesTheLegacyNodePbkdf2Format() {
        String legacy = "pbkdf2$12000$sal-legado$"
            + "3c062e418155ee513714212105e648d7a7e1b50b54531059d7bfd32b035f121e"
            + "135b730c3f179c888b3b8716e3f0960e517d0fd02e12157fcfad400e8bea2c89";

        assertThat(passwords.verify("SenhaTeste123", legacy)).isTrue();
        assertThat(passwords.verify("SenhaErrada123", legacy)).isFalse();
        assertThat(passwords.verify("SenhaTeste123", "pbkdf2$invalido$salt$hash")).isFalse();
    }

    @Test
    void validatesStrengthWithTheSameUtf16LengthBoundaryAsJavascript() {
        assertThat(passwords.validateStrength("SenhaTeste123")).isEmpty();
        assertThat(passwords.validateStrength("curtaA1")).contains(
            "A senha deve ter no minimo 10 caracteres."
        );
        assertThat(passwords.validateStrength("A1" + "a".repeat(71))).contains(
            "A senha deve ter no maximo 72 caracteres."
        );
    }
}
