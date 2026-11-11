package com.netmonitor.agent;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal JSON reader/writer, so the agent JAR runs with no external libraries.
 * Objects become Map, arrays become List, numbers become Double.
 */
public final class Json {

    private final String s;
    private int i;

    private Json(String s) {
        this.s = s;
    }

    // ---------- reading ----------

    public static Object parse(String text) {
        Json p = new Json(text);
        p.ws();
        Object v = p.value();
        p.ws();
        if (p.i != text.length()) {
            throw p.err("unexpected text after value");
        }
        return v;
    }

    private Object value() {
        if (i >= s.length()) {
            throw err("unexpected end of input");
        }
        switch (s.charAt(i)) {
            case '{': return object();
            case '[': return array();
            case '"': return string();
            case 't': expect("true"); return Boolean.TRUE;
            case 'f': expect("false"); return Boolean.FALSE;
            case 'n': expect("null"); return null;
            default: return number();
        }
    }

    private Map<String, Object> object() {
        Map<String, Object> map = new LinkedHashMap<>();
        i++; // {
        ws();
        if (peek() == '}') {
            i++;
            return map;
        }
        while (true) {
            ws();
            if (peek() != '"') {
                throw err("expected a string key");
            }
            String key = string();
            ws();
            require(':');
            ws();
            map.put(key, value());
            ws();
            if (peek() == ',') {
                i++;
                continue;
            }
            require('}');
            return map;
        }
    }

    private List<Object> array() {
        List<Object> list = new ArrayList<>();
        i++; // [
        ws();
        if (peek() == ']') {
            i++;
            return list;
        }
        while (true) {
            ws();
            list.add(value());
            ws();
            if (peek() == ',') {
                i++;
                continue;
            }
            require(']');
            return list;
        }
    }

    private String string() {
        StringBuilder sb = new StringBuilder();
        i++; // opening quote
        while (true) {
            if (i >= s.length()) {
                throw err("unterminated string");
            }
            char c = s.charAt(i++);
            if (c == '"') {
                return sb.toString();
            }
            if (c != '\\') {
                sb.append(c);
                continue;
            }
            if (i >= s.length()) {
                throw err("unterminated escape");
            }
            char e = s.charAt(i++);
            switch (e) {
                case 'n': sb.append('\n'); break;
                case 't': sb.append('\t'); break;
                case 'r': sb.append('\r'); break;
                case 'b': sb.append('\b'); break;
                case 'f': sb.append('\f'); break;
                case 'u':
                    if (i + 4 > s.length()) {
                        throw err("bad unicode escape");
                    }
                    try {
                        sb.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                    } catch (NumberFormatException ex) {
                        throw err("bad unicode escape");
                    }
                    i += 4;
                    break;
                case '"': case '\\': case '/': sb.append(e); break;
                default: throw err("bad escape \\" + e);
            }
        }
    }

    private Double number() {
        int start = i;
        while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) {
            i++;
        }
        if (start == i) {
            throw err("unexpected character '" + s.charAt(i) + "'");
        }
        try {
            return Double.valueOf(s.substring(start, i));
        } catch (NumberFormatException ex) {
            throw err("bad number");
        }
    }

    private void expect(String word) {
        if (!s.startsWith(word, i)) {
            throw err("expected " + word);
        }
        i += word.length();
    }

    private void require(char c) {
        if (peek() != c) {
            throw err("expected '" + c + "'");
        }
        i++;
    }

    private char peek() {
        return i < s.length() ? s.charAt(i) : '\0';
    }

    private void ws() {
        while (i < s.length() && Character.isWhitespace(s.charAt(i))) {
            i++;
        }
    }

    private IllegalArgumentException err(String message) {
        return new IllegalArgumentException("JSON error at position " + i + ": " + message);
    }

    // ---------- writing ----------

    public static String write(Object value) {
        StringBuilder sb = new StringBuilder();
        write(sb, value);
        return sb.toString();
    }

    private static void write(StringBuilder sb, Object v) {
        if (v == null) {
            sb.append("null");
        } else if (v instanceof Boolean) {
            sb.append(v);
        } else if (v instanceof Number n) {
            double d = n.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) {
                sb.append("null");
            } else if (d == Math.rint(d) && Math.abs(d) < 1e15) {
                sb.append((long) d);
            } else {
                sb.append(d);
            }
        } else if (v instanceof Map<?, ?> map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!first) {
                    sb.append(',');
                }
                first = false;
                quote(sb, String.valueOf(e.getKey()));
                sb.append(':');
                write(sb, e.getValue());
            }
            sb.append('}');
        } else if (v instanceof Iterable<?> items) {
            sb.append('[');
            boolean first = true;
            for (Object item : items) {
                if (!first) {
                    sb.append(',');
                }
                first = false;
                write(sb, item);
            }
            sb.append(']');
        } else {
            quote(sb, v.toString());
        }
    }

    private static void quote(StringBuilder sb, String text) {
        sb.append('"');
        for (int k = 0; k < text.length(); k++) {
            char c = text.charAt(k);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append('"');
    }
}
