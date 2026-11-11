package com.netmonitor.server.web;

import com.netmonitor.server.agent.AgentListener;
import com.netmonitor.server.model.Device;
import com.netmonitor.server.model.DeviceStatus;
import com.netmonitor.server.model.Measurement;
import com.netmonitor.server.repo.DeviceRepository;
import com.netmonitor.server.service.MonitoringService;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Device management (FR1) and history (FR8). */
@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private static final Pattern HOST = Pattern.compile("[A-Za-z0-9][A-Za-z0-9.:_-]{0,252}");
    private static final Pattern PORTS = Pattern.compile("(\\d{1,5}(,\\d{1,5})*)?");

    /** Body of POST and PUT. tcpPorts is comma-separated, for example "22,80". */
    public record DeviceRequest(String name, String host, String tcpPorts, String agentId) {}

    private final DeviceRepository devices;
    private final MonitoringService monitoring;
    private final AgentListener agentListener;
    private final DashboardHub hub;

    public DeviceController(DeviceRepository devices, MonitoringService monitoring,
                            AgentListener agentListener, DashboardHub hub) {
        this.devices = devices;
        this.monitoring = monitoring;
        this.agentListener = agentListener;
        this.hub = hub;
    }

    @GetMapping
    public List<Device> list() {
        return devices.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Device create(@RequestBody DeviceRequest request) {
        DeviceRequest clean = validate(request);
        Device device = devices.save(new Device(clean.name(), clean.host(), clean.tcpPorts(), clean.agentId()));
        agentListener.pushConfig(device.getAgentId());
        hub.broadcast("device", device);
        return device;
    }

    @PutMapping("/{id}")
    public Device update(@PathVariable Long id, @RequestBody DeviceRequest request) {
        DeviceRequest clean = validate(request);
        Device device = find(id);
        String previousAgent = device.getAgentId();
        if (!clean.host().equals(device.getHost()) || !clean.agentId().equals(previousAgent)) {
            device.setStatus(DeviceStatus.UNKNOWN); // the old result no longer describes this device
        }
        device.setName(clean.name());
        device.setHost(clean.host());
        device.setTcpPorts(clean.tcpPorts());
        device.setAgentId(clean.agentId());
        device = devices.save(device);
        agentListener.pushConfig(device.getAgentId());
        if (!Objects.equals(previousAgent, device.getAgentId())) {
            agentListener.pushConfig(previousAgent);
        }
        hub.broadcast("device", device);
        return device;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Device device = find(id);
        monitoring.deleteDevice(id);
        agentListener.pushConfig(device.getAgentId());
    }

    @GetMapping("/{id}/measurements")
    public List<Measurement> measurements(@PathVariable Long id, @RequestParam(defaultValue = "1") int hours) {
        find(id);
        return monitoring.history(id, Math.max(1, Math.min(hours, 24 * 30)));
    }

    private Device find(Long id) {
        return devices.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No device " + id));
    }

    private static DeviceRequest validate(DeviceRequest request) {
        String name = trim(request.name());
        String host = trim(request.host());
        String ports = trim(request.tcpPorts()).replace(" ", "");
        String agentId = trim(request.agentId());
        if (name.isEmpty() || name.length() > 100) {
            throw bad("name is required (at most 100 characters)");
        }
        if (!HOST.matcher(host).matches()) {
            throw bad("host must be an IP address or host name");
        }
        if (!PORTS.matcher(ports).matches()) {
            throw bad("tcpPorts must be comma-separated port numbers, for example 22,80");
        }
        for (String port : ports.split(",")) {
            if (!port.isEmpty() && (Integer.parseInt(port) < 1 || Integer.parseInt(port) > 65535)) {
                throw bad("port " + port + " is out of range");
            }
        }
        if (agentId.isEmpty() || agentId.length() > 100) {
            throw bad("agentId is required");
        }
        return new DeviceRequest(name, host, ports, agentId);
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
