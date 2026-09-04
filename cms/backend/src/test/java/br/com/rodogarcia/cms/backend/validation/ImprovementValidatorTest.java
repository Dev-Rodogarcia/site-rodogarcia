package br.com.rodogarcia.cms.backend.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import org.junit.jupiter.api.Test;

class ImprovementValidatorTest {
    private final ImprovementValidator validator = new ImprovementValidator();

    @Test
    void validatesPublicProfilesAndNormalizesBrazilianPhone() {
        Map<String, List<String>> employee = form("employee", "automation");
        employee.put("branch", List.of("Osasco/SP"));
        employee.put("phone", List.of("(11) 99999-0000"));

        assertThat(validator.parse(employee, false).phone()).isEqualTo("11999990000");
        assertThatThrownBy(() -> validator.parse(form("employee", "automation"), false))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("filial");
        assertThatThrownBy(() -> validator.parse(form("site_user", "automation"), false))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("categoria relacionada ao site");
    }

    @Test
    void allowsOnlyEmployeeProfileOnAdminForm() {
        assertThat(validator.parse(form("employee", "automation"), true).branch()).isEmpty();
        assertThatThrownBy(() -> validator.parse(form("site_user", "site_suggestion"), true))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("somente sugestões de colaboradores");
    }

    @Test
    void rejectsDuplicateScalarFieldsLikeMulterAndUnknownStatus() {
        Map<String, List<String>> duplicate = form("site_user", "site_suggestion");
        duplicate.put("name", List.of("Ana", "Bia"));
        assertThatThrownBy(() -> validator.parse(duplicate, false))
            .isInstanceOf(ApiException.class)
            .hasMessage("Informe seu nome.");
        assertThatThrownBy(() -> validator.status("deleted"))
            .isInstanceOf(ApiException.class)
            .hasMessage("Status de melhoria inválido.");

        Map<String, List<String>> duplicatePhone = form("employee", "automation");
        duplicatePhone.put("phone", List.of("(11) 99999", "0000"));
        assertThat(validator.parse(duplicatePhone, true).phone()).isEqualTo("11999990000");

        assertThatThrownBy(() -> validator.parse(form("invalid", "automation"), false))
            .isInstanceOf(ApiException.class)
            .hasMessage("Invalid option: expected one of \"site_user\"|\"employee\"");
    }

    private static Map<String, List<String>> form(String profile, String category) {
        Map<String, List<String>> form = new LinkedHashMap<>();
        form.put("profile", List.of(profile));
        form.put("name", List.of("Ana Silva"));
        form.put("email", List.of("ana@example.com"));
        form.put("category", List.of(category));
        form.put("message", List.of("O formulário poderia explicar melhor o próximo passo."));
        return form;
    }
}
