package br.com.rodogarcia.site.backend.utils;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.StdSerializer;

/** Número JSON cujo lexema segue JSON.stringify/String(Number) do ECMAScript. */
@JsonSerialize(using = EcmaScriptJsonNumber.Serializer.class)
public final class EcmaScriptJsonNumber extends Number {

    private final double value;

    private EcmaScriptJsonNumber(double value) {
        if (!Double.isFinite(value)) {
            throw new IllegalArgumentException("O número JSON precisa ser finito.");
        }
        this.value = value;
    }

    public static EcmaScriptJsonNumber of(double value) {
        return new EcmaScriptJsonNumber(value);
    }

    @Override
    public int intValue() {
        return (int) value;
    }

    @Override
    public long longValue() {
        return (long) value;
    }

    @Override
    public float floatValue() {
        return (float) value;
    }

    @Override
    public double doubleValue() {
        return value;
    }

    @Override
    public String toString() {
        return EcmaScriptNumberFormatter.format(value);
    }

    public static final class Serializer extends StdSerializer<EcmaScriptJsonNumber> {

        public Serializer() {
            super(EcmaScriptJsonNumber.class);
        }

        @Override
        public void serialize(
            EcmaScriptJsonNumber value,
            JsonGenerator generator,
            SerializationContext context
        ) throws JacksonException {
            generator.writeNumber(value.toString());
        }
    }
}
