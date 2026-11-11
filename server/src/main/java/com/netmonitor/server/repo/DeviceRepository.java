package com.netmonitor.server.repo;

import com.netmonitor.server.model.Device;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    List<Device> findByAgentId(String agentId);
}
