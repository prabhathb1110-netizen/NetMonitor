package com.netmonitor.server.web;

import com.netmonitor.server.model.Device;
import com.netmonitor.server.model.Measurement;
import com.netmonitor.server.repo.DeviceRepository;
import com.netmonitor.server.repo.MeasurementRepository;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * FR8: Reports, uptime analytics, and CSV exports.
 */
@RestController
@RequestMapping("/api/reports")
@CrossOrigin
public class ReportController {

    private final DeviceRepository devices;
    private final MeasurementRepository measurements;

    public ReportController(DeviceRepository devices, MeasurementRepository measurements) {
        this.devices = devices;
        this.measurements = measurements;
    }

    @GetMapping("/uptime")
    public List<Map<String, Object>> getUptimeSummary(@RequestParam(defaultValue = "24") int hours) {
        Instant since = Instant.now().minus(hours, ChronoUnit.HOURS);
        return devices.findAll().stream().map(d -> {
            List<Measurement> list = measurements.findByDeviceIdAndTimestampAfterOrderByTimestampAsc(d.getId(), since);
            long total = list.size();
            long upCount = list.stream().filter(Measurement::isUp).count();
            double uptimePercent = total > 0 ? (upCount * 100.0 / total) : 100.0;
            double avgLatency = list.stream()
                    .filter(m -> m.getLatencyMs() != null)
                    .mapToDouble(Measurement::getLatencyMs)
                    .average().orElse(0.0);

            Map<String, Object> map = new HashMap<>();
            map.put("deviceId", d.getId());
            map.put("name", d.getName());
            map.put("host", d.getHost());
            map.put("status", d.getStatus().name());
            map.put("sampleCount", total);
            map.put("uptimePercentage", Math.round(uptimePercent * 100.0) / 100.0);
            map.put("averageLatencyMs", Math.round(avgLatency * 10.0) / 10.0);
            return map;
        }).toList();
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<String> exportCsv() {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);

        pw.println("DeviceId,Name,Host,Group,Status,LatencyMs,PacketLoss,LastChecked,AgentId");
        for (Device d : devices.findAll()) {
            pw.printf("%d,\"%s\",\"%s\",\"%s\",%s,%s,%s,\"%s\",\"%s\"%n",
                    d.getId(),
                    d.getName() != null ? d.getName().replace("\"", "\"\"") : "",
                    d.getHost(),
                    d.getDeviceGroup(),
                    d.getStatus(),
                    d.getLatencyMs() != null ? d.getLatencyMs() : "",
                    d.getPacketLoss() != null ? d.getPacketLoss() : "",
                    d.getLastChecked() != null ? d.getLastChecked().toString() : "",
                    d.getAgentId()
            );
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "netmonitor-devices-report.csv");

        return ResponseEntity.ok().headers(headers).body(sw.toString());
    }
}

