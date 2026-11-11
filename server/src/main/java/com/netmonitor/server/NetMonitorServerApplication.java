package com.netmonitor.server;

import com.netmonitor.server.model.Device;
import com.netmonitor.server.repo.DeviceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NetMonitorServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(NetMonitorServerApplication.class, args);
    }

    /** Two sample devices on first start, so the dashboard shows something immediately. */
    @Bean
    CommandLineRunner sampleData(DeviceRepository devices) {
        return args -> {
            if (devices.count() == 0) {
                devices.save(new Device("This server", "127.0.0.1", "8080", "agent-a"));
                devices.save(new Device("Public DNS", "8.8.8.8", "53", "agent-a"));
            }
        };
    }
}
