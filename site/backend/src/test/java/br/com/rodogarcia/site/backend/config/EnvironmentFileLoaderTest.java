package br.com.rodogarcia.site.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class EnvironmentFileLoaderTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void mirrorsDotenvCommentsQuotesColonMultilineAndLastValueWins() throws Exception {
        Path file = temporaryDirectory.resolve(".env");
        Files.writeString(file, """
            # comentário
            SIMPLE=a#comentario
            EMPTY=
            COLON: valor
            export DOUBLE="linha1\\nlinha2"
            SINGLE='a#b'
            BACKTICK=`linha 1
            linha 2`
            DUPLICATE=primeiro
            DUPLICATE=ultimo
            KEY.WITH-DOTS=ok
            """, StandardCharsets.UTF_8);

        var values = EnvironmentFileLoader.read(file);

        assertThat(values)
            .containsEntry("SIMPLE", "a")
            .containsEntry("EMPTY", "")
            .containsEntry("COLON", "valor")
            .containsEntry("DOUBLE", "linha1\nlinha2")
            .containsEntry("SINGLE", "a#b")
            .containsEntry("BACKTICK", "linha 1\nlinha 2")
            .containsEntry("DUPLICATE", "ultimo")
            .containsEntry("KEY.WITH-DOTS", "ok");
    }
}
