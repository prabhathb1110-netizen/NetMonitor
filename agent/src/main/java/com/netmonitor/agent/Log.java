package com.netmonitor.agent;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

final class Log {

    private Log() {}

    static void info(String message) {
        System.out.println(LocalTime.now().truncatedTo(ChronoUnit.SECONDS) + "  " + message);
    }
}
