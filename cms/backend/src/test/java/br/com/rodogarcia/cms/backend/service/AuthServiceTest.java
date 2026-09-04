package br.com.rodogarcia.cms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.auth.CmsPermissionOverride;
import br.com.rodogarcia.cms.backend.model.auth.SessionRecord;
import br.com.rodogarcia.cms.backend.model.auth.UserRecord;
import br.com.rodogarcia.cms.backend.security.CmsAccessService;
import br.com.rodogarcia.cms.backend.security.PasswordService;
import br.com.rodogarcia.cms.backend.support.AuthTestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import tools.jackson.databind.node.ObjectNode;

class AuthServiceTest {

    private static final String PASSWORD = "SenhaTeste123";
    private static final Clock TEST_CLOCK = Clock.fixed(
        Instant.parse("2026-09-03T12:00:00Z"), ZoneOffset.UTC);

    @TempDir
    Path root;

    private AuthTestContext context;
    private UserRecord owner;

    @BeforeEach
    void setUp() {
        context = new AuthTestContext(root, TEST_CLOCK);
        owner = context.auth.createInitialUser(map(
            "name", "Owner",
            "email", "owner@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "setupCode", AuthTestContext.SETUP_CODE
        ));
    }

    @Test
    void setupCreatesOnlyOneOwnerAndNeverExposesTheHash() {
        assertThat(owner.getIsOwner()).isTrue();
        assertThat(owner.getMustChangePassword()).isFalse();
        assertThat(owner.getPasswordHash()).startsWith("$2b$10$");
        assertThat(context.auth.publicUser(owner))
            .containsEntry("isSupreme", true)
            .containsEntry("passwordChangeRequired", false)
            .doesNotContainKey("passwordHash");

        assertThatThrownBy(() -> context.auth.createInitialUser(Map.of()))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.status()).isEqualTo(403);
                assertThat(error).hasMessage("Setup inicial ja foi concluido.");
            });
    }

    @Test
    void enforcesSupremeGovernanceEvenAfterPermissionsAreDelegated() {
        UserRecord delegated = context.auth.createUser(map(
            "name", "Admin Delegado",
            "email", "delegado@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin",
            "cmsPermissions", List.of("users")
        ), owner);
        UserRecord target = context.auth.createUser(map(
            "name", "Conta Removível",
            "email", "removivel@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin"
        ), owner);

        assertThat(context.auth.isPasswordChangeRequired(delegated)).isTrue();
        assertThatThrownBy(() -> context.auth.createUser(map(
            "name", "Tentativa",
            "email", "tentativa@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin"
        ), delegated)).hasMessageContaining("Somente o usuário supremo");
        assertThatThrownBy(() -> context.auth.updateUser(
            target.getId(), Map.of("permissions", List.of("deleteUsers")), delegated
        )).hasMessageContaining("Somente o usuário supremo");
        assertThatThrownBy(() -> context.auth.deleteUser(target.getId(), delegated))
            .hasMessageContaining("Somente o usuário supremo");
        assertThatThrownBy(() -> context.access.createProfile(
            map("name", "Delegado", "permissions", List.of("users")), delegated
        )).hasMessageContaining("Somente o usuário supremo");

        UserRecord granted = context.auth.updateUser(
            delegated.getId(),
            Map.of("permissions", List.of("createUsers", "deleteUsers")),
            owner
        );
        assertThat(granted.getPermissions()).containsExactly("createUsers", "deleteUsers");
        assertThatThrownBy(() -> context.auth.deleteUser(target.getId(), granted))
            .hasMessageContaining("Somente o usuário supremo");
        assertThatThrownBy(() -> context.auth.deleteUser(owner.getId(), owner))
            .hasMessageContaining("supremo não pode ser excluído");
    }

    @Test
    void changesTemporaryPasswordAndRevokesEveryOtherSession() {
        UserRecord operator = context.auth.createUser(map(
            "name", "Operador",
            "email", "operador@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin",
            "cmsPermissions", List.of("dashboard")
        ), owner);
        SessionRecord current = context.sessions.create(operator.getId());
        SessionRecord concurrent = context.sessions.create(operator.getId());

        UserRecord updated = context.auth.changeOwnPassword(operator, map(
            "currentPassword", PASSWORD,
            "password", "NovaSenhaTeste123",
            "confirmPassword", "NovaSenhaTeste123"
        ), current.getId());

        assertThat(context.auth.isPasswordChangeRequired(updated)).isFalse();
        assertThat(context.sessionRepository.findWithoutRenewal(current.getId())).isNotNull();
        assertThat(context.sessionRepository.findWithoutRenewal(concurrent.getId())).isNull();
    }

    @Test
    void resolvesProfileThenDenyAndGrantOverridesInCatalogOrder() {
        var profile = context.access.createProfile(map(
            "name", "Operação",
            "description", "Perfil operacional",
            "permissions", List.of("home", "services")
        ), owner);
        UserRecord operator = context.auth.createUser(map(
            "name", "Operador",
            "email", "operacao@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin",
            "accessProfileId", profile.getId(),
            "cmsPermissionOverrides", List.of(
                Map.of("permission", "services", "effect", "deny"),
                Map.of("permission", "analytics", "effect", "grant")
            )
        ), owner);

        assertThat(context.access.effectivePermissions(operator)).containsExactly("home", "analytics");
        assertThat(operator.getCmsPermissionOverrides())
            .extracting(CmsPermissionOverride::getPermission)
            .containsExactly("services", "analytics");
    }

    @Test
    void validatesUpdateTypesAndPreservesOmittedFields() {
        UserRecord target = context.auth.createUser(map(
            "name", "Operador",
            "email", "operador@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "user"
        ), owner);
        UserRecord renamed = context.auth.updateUser(
            target.getId(), Map.of("name", "Operador Atualizado"), owner);
        assertThat(renamed.getRole()).isEqualTo("user");
        assertThat(renamed.isActive()).isTrue();

        assertThatThrownBy(() -> context.auth.updateUser(
            target.getId(), Map.of("role", "owner"), owner
        )).hasMessage("Perfil de acesso inválido.");
        assertThatThrownBy(() -> context.auth.updateUser(
            target.getId(), Map.of("active", "false"), owner
        )).hasMessageContaining("status do usuário deve ser booleano");
        assertThatThrownBy(() -> context.auth.updateUser(
            target.getId(), Map.of("name", 42), owner
        )).hasMessage("Informe um nome válido.");
    }

    @Test
    void countsOnlyFailedLoginsAndBlocksByIpAfterEightAttempts() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        Map<String, Object> invalid = Map.of(
            "email", "owner@rodogarcia.com.br",
            "password", "SenhaErrada123"
        );

        for (int attempt = 0; attempt < 8; attempt++) {
            assertThatThrownBy(() -> context.auth.login(invalid, request))
                .isInstanceOfSatisfying(ApiException.class, error ->
                    assertThat(error.status()).isEqualTo(401));
        }
        assertThatThrownBy(() -> context.auth.login(Map.of(
            "email", "owner@rodogarcia.com.br",
            "password", PASSWORD
        ), request)).isInstanceOfSatisfying(ApiException.class, error -> {
            assertThat(error.status()).isEqualTo(429);
            assertThat(error).hasMessageContaining("Muitas tentativas de login");
        });
    }

    @Test
    void blocksRepeatedFailuresAgainstTheSameNormalizedEmailAcrossIps() {
        Map<String, Object> invalid = Map.of(
            "email", " OWNER@RODOGARCIA.COM.BR ",
            "password", "SenhaErrada123"
        );
        for (int attempt = 0; attempt < 8; attempt++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRemoteAddr("203.0.113." + (attempt + 20));
            assertThatThrownBy(() -> context.auth.login(invalid, request))
                .isInstanceOfSatisfying(ApiException.class, error ->
                    assertThat(error.status()).isEqualTo(401));
        }

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.250");
        assertThatThrownBy(() -> context.auth.login(Map.of(
            "email", "owner@rodogarcia.com.br",
            "password", PASSWORD
        ), request)).isInstanceOfSatisfying(ApiException.class, error ->
            assertThat(error.status()).isEqualTo(429));
    }

    @Test
    void serializesConcurrentLoginVerificationAndEnforcesExactlyEightAttempts() throws Exception {
        BlockingPasswordService blockingPasswords = new BlockingPasswordService(false);
        AuthService auth = authWith(blockingPasswords);
        var executor = Executors.newFixedThreadPool(9);
        CountDownLatch ready = new CountDownLatch(9);
        CountDownLatch start = new CountDownLatch(1);
        try {
            var futures = java.util.stream.IntStream.range(0, 9).mapToObj(index ->
                executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    MockHttpServletRequest request = new MockHttpServletRequest();
                    request.setRemoteAddr("203.0.113.77");
                    try {
                        auth.login(Map.of(
                            "email", "owner@rodogarcia.com.br",
                            "password", "SenhaErrada123"
                        ), request);
                        return 200;
                    } catch (ApiException error) {
                        return error.status();
                    }
                })
            ).toList();

            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(blockingPasswords.firstEntered.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(blockingPasswords.secondEntered.await(300, TimeUnit.MILLISECONDS)).isFalse();
            blockingPasswords.release.countDown();

            List<Integer> statuses = futures.stream().map(future -> {
                try {
                    return future.get(10, TimeUnit.SECONDS);
                } catch (Exception error) {
                    throw new AssertionError(error);
                }
            }).toList();
            assertThat(statuses.stream().filter(status -> status == 401)).hasSize(8);
            assertThat(statuses.stream().filter(status -> status == 429)).hasSize(1);
            assertThat(blockingPasswords.calls.get()).isEqualTo(8);
            assertThat(blockingPasswords.maximumConcurrent.get()).isEqualTo(1);
        } finally {
            blockingPasswords.release.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void serializesLoginSessionCreationWithCredentialRevocation() throws Exception {
        UserRecord operator = context.auth.createUser(map(
            "name", "Operador",
            "email", "operador-lock@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin",
            "cmsPermissions", List.of("dashboard")
        ), owner);
        BlockingPasswordService blockingPasswords = new BlockingPasswordService(true);
        AuthService auth = authWith(blockingPasswords);
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch updateFinished = new CountDownLatch(1);
        try {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRemoteAddr("203.0.113.78");
            var login = executor.submit(() -> auth.login(Map.of(
                "email", operator.getEmail(), "password", PASSWORD
            ), request));
            assertThat(blockingPasswords.firstEntered.await(5, TimeUnit.SECONDS)).isTrue();

            var update = executor.submit(() -> {
                try {
                    return auth.updateUser(
                        operator.getId(), Map.of("cmsPermissions", List.of("home")), owner);
                } finally {
                    updateFinished.countDown();
                }
            });
            assertThat(updateFinished.await(300, TimeUnit.MILLISECONDS)).isFalse();
            blockingPasswords.release.countDown();

            AuthService.LoginResult result = login.get(10, TimeUnit.SECONDS);
            update.get(10, TimeUnit.SECONDS);
            assertThat(context.sessionRepository.findWithoutRenewal(result.session().getId())).isNull();
        } finally {
            blockingPasswords.release.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void rejectsAStalePasswordChangeAfterAdministrativeResetRevokesItsSession() {
        UserRecord operator = context.auth.createUser(map(
            "name", "Operador",
            "email", "operador-reset@rodogarcia.com.br",
            "password", PASSWORD,
            "confirmPassword", PASSWORD,
            "role", "admin",
            "cmsPermissions", List.of("dashboard")
        ), owner);
        SessionRecord staleSession = context.sessions.create(operator.getId());
        context.auth.updateUser(operator.getId(), map(
            "password", "SenhaResetAdmin123",
            "confirmPassword", "SenhaResetAdmin123"
        ), owner);

        assertThatThrownBy(() -> context.auth.changeOwnPassword(operator, map(
            "currentPassword", PASSWORD,
            "password", "SenhaAtacante123",
            "confirmPassword", "SenhaAtacante123"
        ), staleSession.getId())).isInstanceOfSatisfying(ApiException.class, error ->
            assertThat(error.status()).isEqualTo(401));
        UserRecord stored = context.users.findById(operator.getId());
        assertThat(context.passwords.verify("SenhaResetAdmin123", stored.getPasswordHash())).isTrue();
        assertThat(context.passwords.verify("SenhaAtacante123", stored.getPasswordHash())).isFalse();
    }

    @Test
    void keepsEmailUniqueWhenDifferentUsersAreUpdatedConcurrently() throws Exception {
        UserRecord first = context.auth.createUser(map(
            "name", "Primeiro", "email", "primeiro@rodogarcia.com.br",
            "password", PASSWORD, "confirmPassword", PASSWORD, "role", "user"
        ), owner);
        UserRecord second = context.auth.createUser(map(
            "name", "Segundo", "email", "segundo@rodogarcia.com.br",
            "password", PASSWORD, "confirmPassword", PASSWORD, "role", "user"
        ), owner);
        var executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            var futures = List.of(first, second).stream().map(user -> executor.submit(() -> {
                ready.countDown();
                start.await();
                try {
                    context.auth.updateUser(
                        user.getId(), Map.of("email", "compartilhado@rodogarcia.com.br"), owner);
                    return 200;
                } catch (ApiException error) {
                    return error.status();
                }
            })).toList();
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            List<Integer> statuses = futures.stream().map(future -> {
                try {
                    return future.get(5, TimeUnit.SECONDS);
                } catch (Exception error) {
                    throw new AssertionError(error);
                }
            }).toList();

            assertThat(statuses).containsExactlyInAnyOrder(200, 409);
            assertThat(context.users.list().stream()
                .filter(user -> "compartilhado@rodogarcia.com.br".equals(user.getEmail())))
                .hasSize(1);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void grantsLegacyDefaultsOnlyWithoutAProfileAndFailsClosedForInvalidProfiles() {
        var profile = context.access.createProfile(map(
            "name", "Perfil limitado",
            "description", "Somente home",
            "permissions", List.of("home")
        ), owner);
        ObjectNode storage = context.mapper.createObjectNode();
        var users = storage.putArray("users");
        users.addObject().put("id", "owner").put("email", "owner@example.com")
            .put("role", "admin").put("active", true).put("isOwner", true)
            .put("createdAt", "2026-01-01T00:00:00.000Z");
        users.addObject().put("id", "legacy").put("email", "legacy@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .put("createdAt", "2026-01-02T00:00:00.000Z");
        users.addObject().put("id", "legacy-empty-profile").put("email", "empty@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .put("accessProfileId", "").put("createdAt", "2026-01-02T01:00:00.000Z");
        users.addObject().put("id", "legacy-profiled").put("email", "profiled@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .put("accessProfileId", profile.getId())
            .putArray("cmsPermissionOverrides").addObject()
            .put("permission", "analytics").put("effect", "grant");
        users.addObject().put("id", "legacy-missing-profile").put("email", "missing@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .put("accessProfileId", "missing-profile")
            .put("createdAt", "2026-01-02T03:00:00.000Z");
        users.addObject().put("id", "legacy-malformed-profile").put("email", "malformed@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .put("accessProfileId", "malformed-profile")
            .put("createdAt", "2026-01-02T04:00:00.000Z");
        users.addObject().put("id", "explicit-null").put("email", "null@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .putNull("cmsPermissions").put("createdAt", "2026-01-03T00:00:00.000Z");
        users.addObject().put("id", "invalid").put("email", "invalid@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .putObject("cmsPermissions").put("dashboard", true)
            .put("createdAt", "2026-01-04T00:00:00.000Z");
        users.addObject().put("id", "invalid-override").put("email", "override@example.com")
            .put("role", "admin").put("active", true).put("isOwner", false)
            .putArray("cmsPermissions");
        ((ObjectNode) users.get(users.size() - 1)).putArray("cmsPermissionOverrides").addObject()
            .put("permission", "analytics").put("effect", "unexpected");
        context.jsonStore.write(context.properties.storagePaths().users(), storage);

        assertThat(context.access.effectivePermissions(context.users.findById("legacy")))
            .containsExactlyElementsOf(CmsAccessService.CMS_PERMISSIONS);
        assertThat(context.access.effectivePermissions(context.users.findById("legacy-empty-profile")))
            .containsExactlyElementsOf(CmsAccessService.CMS_PERMISSIONS);
        assertThat(context.access.effectivePermissions(context.users.findById("legacy-profiled")))
            .containsExactly("home", "analytics");
        assertThat(context.access.effectivePermissions(context.users.findById("legacy-missing-profile")))
            .isEmpty();
        assertThat(context.access.effectivePermissions(context.users.findById("explicit-null")))
            .isEmpty();
        assertThat(context.access.effectivePermissions(context.users.findById("invalid")))
            .isEmpty();
        assertThat(context.access.effectivePermissions(context.users.findById("invalid-override")))
            .isEmpty();

        context.access.updateProfile(profile.getId(), map(
            "name", "Perfil limitado",
            "description", "Somente home",
            "permissions", List.of("home"),
            "active", false
        ), owner);
        assertThat(context.access.effectivePermissions(context.users.findById("legacy-profiled")))
            .containsExactly("analytics");
        context.access.deleteProfile(profile.getId(), owner);
        assertThat(context.access.effectivePermissions(context.users.findById("legacy-profiled")))
            .containsExactly("analytics");

        ObjectNode malformedProfiles = context.mapper.createObjectNode();
        malformedProfiles.putArray("profiles").addObject()
            .put("id", "malformed-profile")
            .put("name", "Perfil malformado")
            .put("active", true);
        context.jsonStore.write(context.properties.storagePaths().cmsAccessProfiles(), malformedProfiles);
        assertThat(context.access.effectivePermissions(context.users.findById("legacy-malformed-profile")))
            .isEmpty();
    }

    private AuthService authWith(PasswordService passwords) {
        return new AuthService(
            context.users,
            context.sessionRepository,
            context.profiles,
            passwords,
            context.sessions,
            context.access,
            context.rateLimits,
            context.clientIpResolver,
            context.properties,
            TEST_CLOCK
        );
    }

    private static final class BlockingPasswordService extends PasswordService {
        private final boolean delegateVerification;
        private final CountDownLatch firstEntered = new CountDownLatch(1);
        private final CountDownLatch secondEntered = new CountDownLatch(1);
        private final CountDownLatch release = new CountDownLatch(1);
        private final AtomicInteger calls = new AtomicInteger();
        private final AtomicInteger active = new AtomicInteger();
        private final AtomicInteger maximumConcurrent = new AtomicInteger();

        private BlockingPasswordService(boolean delegateVerification) {
            this.delegateVerification = delegateVerification;
        }

        @Override
        public boolean verify(String password, String storedHash) {
            int invocation = calls.incrementAndGet();
            int concurrent = active.incrementAndGet();
            maximumConcurrent.accumulateAndGet(concurrent, Math::max);
            if (invocation == 1) firstEntered.countDown();
            else secondEntered.countDown();
            try {
                if (!release.await(5, TimeUnit.SECONDS)) {
                    throw new AssertionError("A verificação bloqueada não foi liberada.");
                }
                return delegateVerification && super.verify(password, storedHash);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                throw new AssertionError(error);
            } finally {
                active.decrementAndGet();
            }
        }
    }

    private static Map<String, Object> map(Object... values) {
        LinkedHashMap<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            map.put((String) values[index], values[index + 1]);
        }
        return map;
    }
}
