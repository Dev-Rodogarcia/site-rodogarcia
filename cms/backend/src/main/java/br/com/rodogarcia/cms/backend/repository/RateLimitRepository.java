package br.com.rodogarcia.cms.backend.repository;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;
import java.util.Iterator;

import br.com.rodogarcia.cms.backend.config.StoragePaths;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

@Repository
public class RateLimitRepository {

    private final JsonFileStore store;
    private final Path path;
    private final Clock clock;

    public RateLimitRepository(JsonFileStore store, StoragePaths paths, Clock clock) {
        this.store = store;
        this.path = paths.rateLimits();
        this.clock = clock;
    }

    public RateLimitState get(String namespace, String key, long windowMs, int maxAttempts) {
        return store.withWriteLock(java.util.List.of(path), () -> {
            long now = clock.millis();
            String bucket = namespace + ":" + hashKey(key);
            ObjectNode root = store.readObject(path);
            JsonNode existing = root.get(bucket);
            if (!valid(existing) || existing.path("resetAt").asLong() <= now) {
                ObjectNode entry = store.mapper().createObjectNode();
                entry.put("count", 0);
                entry.put("resetAt", now + windowMs);
                root.set(bucket, entry);
                prune(root, now);
                store.write(path, root);
                return new RateLimitState(0, now + windowMs, maxAttempts);
            }
            int count = existing.path("count").asInt();
            return new RateLimitState(
                count,
                existing.path("resetAt").asLong(),
                Math.max(0, maxAttempts - count)
            );
        });
    }

    /** Verifica o teto e registra o hit na mesma seção crítica. */
    public boolean tryHit(String namespace, String key, long windowMs, int maxAttempts) {
        return store.withWriteLock(java.util.List.of(path), () -> {
            long now = clock.millis();
            String bucket = namespace + ":" + hashKey(key);
            ObjectNode root = store.readObject(path);
            JsonNode existing = root.get(bucket);
            int count = 0;
            long resetAt = now + windowMs;
            if (valid(existing) && existing.path("resetAt").asLong() > now) {
                count = existing.path("count").asInt();
                resetAt = existing.path("resetAt").asLong();
            }
            if (count >= maxAttempts) return false;
            ObjectNode entry = store.mapper().createObjectNode();
            entry.put("count", count + 1);
            entry.put("resetAt", resetAt);
            root.set(bucket, entry);
            prune(root, now);
            store.write(path, root);
            return true;
        });
    }

    private static boolean valid(JsonNode value) {
        return value != null && value.isObject()
            && value.path("count").isNumber() && value.path("resetAt").isNumber();
    }

    private static void prune(ObjectNode root, long now) {
        Iterator<java.util.Map.Entry<String, JsonNode>> entries = root.properties().iterator();
        while (entries.hasNext()) {
            JsonNode value = entries.next().getValue();
            if (!valid(value) || value.path("resetAt").asLong() <= now) entries.remove();
        }
    }

    private static String hashKey(String key) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 16);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 indisponível.", error);
        }
    }

    public record RateLimitState(int count, long resetAt, int remaining) {
    }
}
