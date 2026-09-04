package br.com.rodogarcia.site.backend.repository.json;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;
import java.util.concurrent.locks.ReentrantLock;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.exception.JsonStoreException;
import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.model.RateLimitState;
import br.com.rodogarcia.site.backend.repository.RateLimitRepository;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

@Repository
public class JsonRateLimitRepository implements RateLimitRepository {

    private final NodeCompatibleJsonStore jsonStore;
    private final JsonMapper jsonMapper;
    private final ApplicationProperties properties;
    private final Clock clock;
    private final ReentrantLock lock = new ReentrantLock(true);

    public JsonRateLimitRepository(
        NodeCompatibleJsonStore jsonStore,
        JsonMapper jsonMapper,
        ApplicationProperties properties,
        Clock clock
    ) {
        this.jsonStore = jsonStore;
        this.jsonMapper = jsonMapper;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public RateLimitState inspectAndHit(String key, RateLimitPolicy policy) {
        lock.lock();
        try {
            String bucketKey = policy.namespace() + ":" + hashKey(key);
            long now = clock.millis();
            ObjectNode store = readStore();
            Entry current = readEntry(store.get(bucketKey));

            if (current == null || current.resetAt() <= now) {
                current = new Entry(0, now + policy.window().toMillis());
                store.set(bucketKey, entryNode(current));
                writeStore(pruneExpired(store, clock.millis()));
            }

            if (current.count() >= policy.maximum()) {
                return new RateLimitState(
                    false,
                    current.count(),
                    current.resetAt(),
                    Math.max(0, policy.maximum() - current.count())
                );
            }

            // O Node executa get e hit como duas leituras. O lock preserva essa
            // sequência sem permitir lost update entre threads Spring.
            long hitNow = clock.millis();
            ObjectNode hitStore = readStore();
            Entry hitCurrent = readEntry(hitStore.get(bucketKey));
            Entry updated = hitCurrent == null || hitCurrent.resetAt() <= hitNow
                ? new Entry(1, hitNow + policy.window().toMillis())
                : new Entry(hitCurrent.count() + 1, hitCurrent.resetAt());
            hitStore.set(bucketKey, entryNode(updated));
            writeStore(pruneExpired(hitStore, clock.millis()));
            return new RateLimitState(
                true,
                updated.count(),
                updated.resetAt(),
                Math.max(0, policy.maximum() - updated.count())
            );
        } finally {
            lock.unlock();
        }
    }

    private ObjectNode readStore() {
        JsonNode root = jsonStore.read(
            properties.rateLimitsStorePath(),
            jsonMapper.createObjectNode()
        );
        if (!(root instanceof ObjectNode object)) {
            throw new JsonStoreException(
                properties.rateLimitsStorePath(),
                new IllegalStateException("O rate limit precisa usar um objeto JSON.")
            );
        }
        return object;
    }

    private void writeStore(ObjectNode store) {
        jsonStore.write(properties.rateLimitsStorePath(), store);
    }

    private ObjectNode pruneExpired(ObjectNode store, long now) {
        ObjectNode pruned = jsonMapper.createObjectNode();
        for (var item : store.properties()) {
            Entry entry = readEntry(item.getValue());
            if (entry != null && entry.resetAt() > now) {
                pruned.set(item.getKey(), item.getValue());
            }
        }
        return pruned;
    }

    private ObjectNode entryNode(Entry entry) {
        ObjectNode node = jsonMapper.createObjectNode();
        node.put("count", entry.count());
        node.put("resetAt", entry.resetAt());
        return node;
    }

    private static Entry readEntry(JsonNode value) {
        if (value == null || !value.isObject()) {
            return null;
        }
        JsonNode count = value.get("count");
        JsonNode resetAt = value.get("resetAt");
        if (count == null || resetAt == null || !count.isNumber() || !resetAt.isNumber()) {
            return null;
        }
        return new Entry(count.intValue(), resetAt.longValue());
    }

    private static String hashKey(String key) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 16);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 indisponível na JVM.", error);
        }
    }

    private record Entry(int count, long resetAt) {
    }
}
