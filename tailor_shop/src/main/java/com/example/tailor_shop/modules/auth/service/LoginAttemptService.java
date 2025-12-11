package com.example.tailor_shop.modules.auth.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 15 * 60;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    public void recordFailure(String key) {
        Attempts a = attempts.computeIfAbsent(key, k -> new Attempts());
        a.count++;
        a.firstTime = a.firstTime == 0 ? Instant.now().getEpochSecond() : a.firstTime;
    }

    public boolean isLocked(String key) {
        Attempts a = attempts.get(key);
        if (a == null) return false;
        long now = Instant.now().getEpochSecond();
        if (now - a.firstTime > WINDOW_SECONDS) {
            attempts.remove(key);
            return false;
        }
        return a.count >= MAX_ATTEMPTS;
    }

    private static class Attempts {
        long firstTime;
        int count;
    }
}

